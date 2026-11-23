# AI Engineering Mastery — Vocabulary Edition

## Open the app
Extract the ZIP. Double-click **AI_Engineering_Mastery_OFFLINE.html** in Chrome. This is the single-file, offline version. Do not open `index.html` without its adjacent `app.js` and `app.css`.

## Save a word while reading
Open a lesson, highlight a word or phrase in the lesson text, click **+ Add to Dictionary**, enter a meaning and one example sentence, then click **Save Word**. The dictionary is saved in your browser's local storage. You can also click **My Dictionary** on the home/catalog page and add words manually.

## Review your dictionary
Click **My Dictionary** to open a full-screen vocabulary review. Recall the meaning and example sentence, click **Reveal Meaning & Sentence**, then rate Again/Hard/Good/Easy. Use Previous/Next, arrow keys and Space. Vocabulary ratings are saved; the current vocabulary review is sequential, not a spaced-repetition scheduler.

## Back up progress
Click **Export Progress**. This includes vocabulary and ratings. Use **Import Progress** to restore. Browser storage is local to the browser and file origin; keep your backup JSON.

## Add lesson content for existing Topic #2
1. Open `data/topics.json` and find `sd-002`. Do not change its ID.
2. Copy `NEW_TOPIC_PROMPT.md` into ChatGPT, replacing TOPIC_NAME with `Leader election, leases, fencing tokens, ownership epochs` and TOPIC_ID with `sd-002`.
3. Ask for two JSON files following the `sd-001` examples.
4. Save the lesson as `data/lessons/sd-002.json` and cards as `data/flashcards/sd-002.cards.json`.
5. In Terminal, `cd` into the extracted `AI_Engineering_Mastery` folder, run `python3 build.py`.
6. Open or refresh `AI_Engineering_Mastery_OFFLINE.html`. Topic #2 will show Start Lesson automatically.

## Add a brand-new Topic #61 or later
1. In Terminal, `cd` into the `AI_Engineering_Mastery` folder.
2. Run `python3 add_topic.py` and enter the title, category and company tags. It appends a unique ID to `data/topics.json`.
3. Use `NEW_TOPIC_PROMPT.md` to generate lesson and flashcard JSON for the printed ID.
4. Save the files to the indicated `data/lessons/` and `data/flashcards/` paths.
5. Run `python3 build.py` and reopen the standalone HTML.

## Content schema
Lessons: `{ "id":"sd-002", "title":"...", "durationMinutes":90, "sections":[], "slides":[{"id":"unique", "section":"...", "title":"...", "lead":"...", "blocks":[{"type":"section","title":"...","paragraphs":["..."],"bullets":["..."]}]}] }`.

Cards: `[{"id":"sd-002-fc-001","type":"concept","front":"...","back":"..."}]`.

The build validates IDs, lesson slide structures and cards, and sets topic availability automatically. You do not need to modify HTML, CSS or JavaScript to add lessons.

## Notes
The 60 topics are populated. Topic #1 is the only authored lesson in this starter. Company tags indicate relevance, not verified interview questions. The application requests true browser fullscreen; browsers may deny it. Use the Fullscreen button if needed.

## Optional topic research and vocabulary files (new)
For each topic ID (for example `sd-002`), optionally add:
- `data/research/sd-002.research.md` — Markdown research notes and clickable source links. Open **Research & Sources** from the fullscreen lesson toolbar.
- `data/vocabulary/sd-002.vocabulary.json` — JSON array of objects with `word`, `meaning`, and `sentence`. Open **Topic Words** from the fullscreen lesson toolbar. Import individual words or **Add All New Words** into your personal dictionary. Existing words and personal definitions are never overwritten.

Run `python3 build.py` after saving either file. Both files are optional and do not change the core JavaScript. Example `sd-001` files are included. The app does not automatically import suggested vocabulary into your personal dictionary; you choose when to add it. Export your progress before upgrading to preserve your personal vocabulary.
