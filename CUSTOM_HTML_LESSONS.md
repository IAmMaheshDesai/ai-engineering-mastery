# Optional per-topic HTML lessons

Place a fragment at `data/lesson-html/<topic-id>.html`. The file must contain exactly one `<article data-aem-chapter="1">...</article>` for each slide in the matching `data/lessons/<topic-id>.json`, in order.

The existing JSON remains authoritative for chapter navigation, titles, flashcards, progress, and fallback. The HTML fragment controls only the chapter body. You may use semantic HTML, tables, diagrams made with HTML/CSS, and dark code panels. Do not include `<html>`, `<script>`, iframes, inline event handlers, or JavaScript URLs. Styles belong in `app.css`; this preserves the offline single-file build.

Use `<div class="aem-code-panel"><div class="aem-code-head"><span>PYTHON</span><button type="button" class="aem-copy" data-aem-copy>Copy code</button></div><pre><code>...</code></pre></div>` for copy-enabled code. HTML-escape source characters.

Run `python3 build.py` to embed the fragments into `AI_Engineering_Mastery_OFFLINE.html`. If a topic has no HTML fragment, the original JSON renderer is used unchanged. Existing vocabulary, research, flashcards, zoom, navigation, fullscreen and progress remain in the main app.
