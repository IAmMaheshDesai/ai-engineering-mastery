"""Add a catalog topic without editing JavaScript. Usage: python3 add_topic.py"""
import json,re,pathlib
root=pathlib.Path(__file__).resolve().parent
path=root/'data/topics.json'
topics=json.loads(path.read_text(encoding='utf-8'))
print('AI Engineering Mastery — Add Topic')
title=input('Topic title: ').strip()
if not title:raise SystemExit('Title is required')
category=input('Category (blank = Distributed Systems Foundations): ').strip() or 'Distributed Systems Foundations'
valid=['OpenAI','Anthropic','Meta','Google','NVIDIA']
raw=input('Company tags comma-separated (blank = all five): ').strip()
companies=[c for c in valid if not raw or c.lower() in [x.strip().lower() for x in raw.split(',')]]
if not companies:raise SystemExit('No recognized company tags')
number=max(t['number'] for t in topics)+1
id=f'sd-{number:03d}'
if any(t['title'].lower()==title.lower() for t in topics):raise SystemExit('Topic title already exists')
entry={'id':id,'number':number,'title':title,'category':category,'companies':companies,'difficulty':'Senior Staff','durationMinutes':90,'status':'coming-soon','lesson':f'data/lesson-html/{id}.html','description':f'Senior Staff architecture lesson on {title}.'}
topics.append(entry)
path.write_text(json.dumps(topics,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(f'Added {id}. Create data/lesson-html/{id}.html and data/flashcards/{id}.cards.json, then run python3 build.py.')
