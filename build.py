"""Build a self-contained HTML app from editable JSON; requires Python 3 only."""
import json,pathlib,sys,re
p=pathlib.Path(__file__).resolve().parent
registry={'topics':json.loads((p/'data/topics.json').read_text(encoding='utf-8')),'lessons':{},'cards':{},'vocabularySuggestions':{},'research':{},'htmlLessons':{}}
ids=set();numbers=set()
for topic in registry['topics']:
    key=topic['id']
    if key in ids or topic['number'] in numbers:raise ValueError(f'Duplicate ID or number: {key}')
    ids.add(key);numbers.add(topic['number'])
    lesson=p/'data/lessons'/f'{key}.json';cards=p/'data/flashcards'/f'{key}.cards.json'
    if lesson.exists():
        item=json.loads(lesson.read_text(encoding='utf-8'))
        if item.get('id')!=key or not isinstance(item.get('slides'),list) or not item['slides']:raise ValueError(f'Invalid lesson: {lesson}')
        for slide in item['slides']:
            if not all(k in slide for k in ('id','title')):raise ValueError(f'Missing slide id/title: {lesson}')
        registry['lessons'][key]=item
        topic['status']='available'
    else:topic['status']='coming-soon'
    suggestions=p/'data/vocabulary'/f'{key}.vocabulary.json'
    research=p/'data/research'/f'{key}.research.md'
    if suggestions.exists():
        words=json.loads(suggestions.read_text(encoding='utf-8'))
        if not isinstance(words,list) or any(not isinstance(w,dict) or not all(isinstance(w.get(k),str) and w[k].strip() for k in ('word','meaning','sentence')) for w in words):
            raise ValueError(f'Invalid vocabulary suggestions: {suggestions}')
        registry['vocabularySuggestions'][key]=words
    if research.exists():
        registry['research'][key]=research.read_text(encoding='utf-8')
    custom_html=p/'data/lesson-html'/f'{key}.html'
    if custom_html.exists():
        markup=custom_html.read_text(encoding='utf-8')
        if re.search(r'<\s*(script|iframe|object|embed|base)\b|\son[a-z]+\s*=|javascript\s*:',markup,re.I):
            raise ValueError(f'Unsafe HTML in {custom_html}; use declarative markup only')
        if key not in registry['lessons']:raise ValueError(f'HTML requires a corresponding JSON lesson: {key}')
        expected=len(registry['lessons'][key]['slides'])
        actual=len(re.findall(r'<article\s+[^>]*data-aem-chapter\s*=',markup,re.I))
        if actual!=expected:raise ValueError(f'Expected {expected} HTML chapters, found {actual}: {custom_html}')
        registry['htmlLessons'][key]=markup
    if cards.exists():
        item=json.loads(cards.read_text(encoding='utf-8'))
        if not isinstance(item,list):raise ValueError(f'Cards must be an array: {cards}')
        for card in item:
            if not all(card.get(k) for k in ('id','front','back')):raise ValueError(f'Invalid flashcard: {cards}')
        registry['cards'][key]=item
html=(p/'index.html').read_text(encoding='utf-8');css=(p/'app.css').read_text(encoding='utf-8');js=(p/'app.js').read_text(encoding='utf-8')
assert '<link rel="stylesheet" href="app.css">' in html and '<script src="app.js"></script>' in html
html=html.replace('<link rel="stylesheet" href="app.css">','<style>'+css+'</style>')
data=json.dumps(registry,ensure_ascii=False).replace('</','<\\/')
html=html.replace('<script src="app.js"></script>','<script>window.AEM_DATA='+data+';</script><script>'+js+'</script>')
(p/'AI_Engineering_Mastery_OFFLINE.html').write_text(html,encoding='utf-8')
print(f'Built offline HTML: {len(registry["topics"])} topics, {sum(len(x["slides"]) for x in registry["lessons"].values())} slides, {sum(len(x) for x in registry["cards"].values())} cards, {sum(len(x) for x in registry["vocabularySuggestions"].values())} vocabulary suggestions, {len(registry["research"])} research documents')
