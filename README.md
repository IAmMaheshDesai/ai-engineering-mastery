# AI Engineering Mastery — Vocabulary Edition

## Open the app
Extract the ZIP. Double-click **AI_Engineering_Mastery_OFFLINE.html** in Chrome. This is the single-file, offline version. Do not open `index.html` without its adjacent `app.js` and `app.css`.

## Save a word while reading
Open a lesson, highlight a word or phrase in the lesson text, click **+ Add to Dictionary**, enter a meaning and one example sentence, then click **Save Word**. The dictionary is saved in your browser's local storage. You can also click **My Dictionary** on the home/catalog page and add words manually.

## Review your dictionary
Click **My Dictionary** to open a full-screen vocabulary review. Recall the meaning and example sentence, click **Reveal Meaning & Sentence**, then rate Again/Hard/Good/Easy. Use Previous/Next, arrow keys and Space. Vocabulary ratings are saved; the current vocabulary review is sequential, not a spaced-repetition scheduler.

## Back up progress
Click **Export Progress**. This includes vocabulary and ratings. Use **Import Progress** to restore. Browser storage is local to the browser and file origin; keep your backup JSON.

## Publish or edit an HTML lesson

Edit `data/lesson-html/<topic-id>.html`. Each marked chapter article is one slide. A topic may use a complete standalone HTML document or a chapter fragment. The reader takes chapter order, titles, content and navigation directly from those articles. Cards, suggested words and research remain separate resources.

Run `python3 build.py` to refresh the offline HTML and the hosted catalog. Open `AI_Engineering_Mastery_OFFLINE.html` directly, or run `python3 -m http.server 8000` in the project folder and visit `http://localhost:8000/index.html`. The hosted reader fetches the topic HTML on each open. Rebuild when adding topics or updating the hosted catalog and resources. A double-click on index.html opens the bundled offline reader.

Use `python3 add_topic.py` to register a new topic. See CUSTOM_HTML_LESSONS.md for the chapter markup.
