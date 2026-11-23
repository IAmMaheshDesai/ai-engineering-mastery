"""Build the offline reader and the hosted catalog from the HTML lesson sources."""
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re


class Chapters(HTMLParser):
    """Extract original chapter markup, omitting the standalone reader around it."""
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0] + [m.end() for m in re.finditer('\n', source)]
        self.start = None
        self.depth = 0
        self.items = []
        self.feed(source)
        self.close()
        if self.depth or not self.items:
            raise ValueError('Expected complete <article data-aem-chapter> elements')

    def source_offset(self):
        line, col = self.getpos()
        return self.offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag != 'article':
            return
        if self.depth:
            self.depth += 1
        elif 'data-aem-chapter' in dict(attrs):
            self.start = self.source_offset()
            self.depth = 1

    def handle_endtag(self, tag):
        if tag == 'article' and self.depth:
            self.depth -= 1
            if not self.depth:
                end = self.source.index('>', self.source_offset()) + 1
                self.items.append(self.source[self.start:end])


root = Path(__file__).resolve().parent
data = root / 'data'
topics = json.loads((data / 'topics.json').read_text('utf-8'))
registry = dict(topics=topics, cards={}, research={}, vocabularySuggestions={})
sources = []
chapter_count = 0
if len({t['id'] for t in topics}) != len(topics) or len({t['number'] for t in topics}) != len(topics):
    raise ValueError('Duplicate catalog ID or number')

for topic in topics:
    key = topic['id']
    lesson = data / 'lesson-html' / (key + '.html')
    topic['status'] = 'available' if lesson.exists() else 'coming-soon'
    topic['lesson'] = 'data/lesson-html/' + key + '.html'
    if lesson.exists():
        try:
            chapters = Chapters(lesson.read_text('utf-8')).items
        except ValueError as err:
            raise ValueError(f'{lesson}: {err}') from err
        markup = '\n'.join(chapters)
        if re.search(r'<\s*/?\s*(script|iframe|object|embed|base|template|style|link)\b|\son[a-z]+\s*=|javascript\s*:', markup, re.I):
            raise ValueError(f'{lesson}: chapter content must be declarative HTML')
        sources.append(f'<template data-lesson-id="{escape(key, quote=True)}">{markup}</template>')
        chapter_count += len(chapters)
    for folder, suffix, store, fields in [
        ('flashcards', '.cards.json', 'cards', ('id', 'front', 'back')),
        ('vocabulary', '.vocabulary.json', 'vocabularySuggestions', ('word', 'meaning', 'sentence'))
    ]:
        path = data / folder / (key + suffix)
        if path.exists():
            records = json.loads(path.read_text('utf-8'))
            if not isinstance(records, list) or any(not isinstance(r, dict) or not all(r.get(f) for f in fields) for r in records):
                raise ValueError(f'Invalid resource: {path}')
            registry[store][key] = records
    research = data / 'research' / (key + '.research.md')
    if research.exists():
        registry['research'][key] = research.read_text('utf-8')

catalog = 'window.AEM_DATA=' + json.dumps(registry, ensure_ascii=False).replace('<', r'\u003c') + ';'
shell = (root / 'index.html').read_text('utf-8')
css = (root / 'app.css').read_text('utf-8')
js = (root / 'app.js').read_text('utf-8')
offline = shell.replace('<link rel="stylesheet" href="app.css">', '<style>' + css + '</style>')
offline = offline.replace('<script src="catalog.js"></script>', '\n'.join(sources) + '<script>' + catalog + '</script>')
offline = offline.replace('<script src="app.js"></script>', '<script>' + js + '</script>')
(root / 'catalog.js').write_text(catalog, 'utf-8')
(root / 'AI_Engineering_Mastery_OFFLINE.html').write_text(offline, 'utf-8')
print(f'Built {len(sources)} HTML lessons with {chapter_count} chapters.')
