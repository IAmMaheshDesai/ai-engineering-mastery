# HTML lesson format

Save the topic under `data/lesson-html/<topic-id>.html`. Each `<article data-aem-chapter="1">` holds a complete chapter body with an h1 title. Their document order controls the chapter picker and saved position. Standalone page controls and scripts outside those articles are omitted in the app. Inside an article, use declarative markup, native details, tables, and the existing AIBL code panels. The app supplies shared styles and Copy behavior.

Lesson JSON is optional archival or authoring material. Runtime and build do not access it. The catalog, flashcards, vocabulary, and progress still use their existing formats.
