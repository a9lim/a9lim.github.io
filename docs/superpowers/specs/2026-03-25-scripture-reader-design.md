# Scripture Reader Design Spec

A static scripture reader for a9l.im that displays religious texts chapter-by-chapter with verse numbers, typed footnotes, cross-references, glossary, translation comparison, and full-text search. Lives at `scripture/` as a git submodule.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Work splitting | Bible separate; BoM/D&C/PoGP as one "LDS" work | Bible stands alone for cross-tradition comparison |
| Translation comparison | Single-translation default + compare mode toggle | Clean reading by default, side-by-side for study |
| Footnote interaction | Unified clickable markers, typed content (commentary/cross-ref/glossary) | Consistent UX, visual distinction by type |
| Data format | Hybrid: manifest + chapter JSONs per work + search index | Fast initial load, lazy chapter fetching |
| Extraction language | Python (PyMuPDF) | Best PDF layout analysis; run-once tool |
| Frontend approach | Static JSON + vanilla JS, shared design system | Matches site architecture, no build step |
| Layout | Top toolbar + centered reading pane + right notes sidebar | Wide reading area, persistent footnotes |
| Search | Client-side full-text with prebuilt JSON index | No server needed, loaded on demand |
| Modularity | Auto-discovery of works, parser base class, no work-specific frontend code | Easy addition of future texts |

## Data Architecture

### Directory Layout

```
scripture/data/
  quran/
    manifest.json
    glossary.json
    chapters/
      1.json .. 114.json
  bible-kjv/
    manifest.json
    glossary.json          # Bible Dictionary from the Quad
    chapters/
      genesis-1.json .. revelation-22.json
  lds/
    manifest.json          # covers BoM, D&C, PoGP as sub-works
    glossary.json
    chapters/
      1-nephi-1.json ...
      dc-1.json ...
      moses-1.json ...
  search-index.json        # combined flat index across all works
```

### Manifest Schema

```json
{
  "id": "quran",
  "title": "The Quran",
  "translations": [
    { "id": "m-ali", "name": "Maulana Muhammad Ali", "year": 2010 }
  ],
  "books": [
    {
      "id": "quran",
      "name": "The Quran",
      "chapters": [
        { "id": "1", "name": "Al-Fatihah", "altName": "The Opening", "verses": 7 },
        { "id": "2", "name": "Al-Baqarah", "altName": "The Cow", "verses": 286 }
      ]
    }
  ]
}
```

For multi-book works (Bible, LDS), `books` contains multiple entries:
```json
{
  "id": "bible-kjv",
  "title": "King James Bible",
  "translations": [
    { "id": "kjv", "name": "King James Version", "year": 1769 }
  ],
  "books": [
    {
      "id": "genesis",
      "name": "Genesis",
      "chapters": [
        { "id": "genesis-1", "name": "Chapter 1", "verses": 31 }
      ]
    }
  ]
}
```

### Chapter Schema

```json
{
  "chapter": "2",
  "name": "Al-Baqarah",
  "altName": "The Cow",
  "intro": "This chapter deals mainly with the Israelites...",
  "sections": [
    { "heading": "Fundamental Principles of Islam", "startVerse": 1 }
  ],
  "verses": [
    {
      "number": 1,
      "text": "I, Allah, am the Best Knower.",
      "footnotes": ["a"]
    }
  ],
  "footnotes": {
    "a": {
      "type": "commentary",
      "text": "This verse consists of the letters alif, lam, mim..."
    },
    "b": {
      "type": "cross-ref",
      "refs": ["quran:3:3", "quran:10:37"],
      "text": "See also 3:3 and 10:37."
    },
    "c": {
      "type": "glossary",
      "termId": "taqwa",
      "text": "Keeping one's duty to Allah."
    }
  }
}
```

### Glossary Schema

```json
[
  { "id": "taqwa", "term": "Taqwa", "definition": "Guarding against evil..." }
]
```

### Search Index Schema

```json
[
  { "ref": "quran:2:255", "text": "Allah — there is no god but He..." }
]
```

Single flat array. Loaded on demand when search opens. Ref format: `workId:chapterId:verseNumber`.

### Cross-Reference Format

Refs use the pattern `workId:chapterId:verseNumber`. Examples:
- `quran:2:255` — Quran, chapter 2, verse 255
- `bible-kjv:genesis-1:26` — KJV Bible, Genesis chapter 1, verse 26
- `lds:1-nephi-1:3` — Book of Mormon, 1 Nephi chapter 1, verse 3

This allows cross-references both within and between works.

## Frontend Architecture

### File Structure

```
scripture/
  index.html
  main.js                  # entry point, $ DOM cache
  styles.css               # project-specific CSS
  colors.js                # extends _PALETTE
  src/
    reader.js              # reading pane — renders verses, footnote markers, section headings
    notes.js               # notes sidebar — renders footnotes, highlight on click
    nav.js                 # toolbar dropdowns — work/book/chapter/translation selectors
    compare.js             # compare mode — split pane, scroll sync
    search.js              # search overlay — load index, filter, render results
    glossary.js            # glossary overlay — browseable term list
    chapters.js            # chapter fetching + in-memory caching
  data/                    # generated JSON (gitignored, built by extraction script)
  extract/                 # Python extraction pipeline
```

### Shared Module Usage

| Shared Module | Usage |
|---|---|
| `shared-tokens.js` | All colors via CSS vars, extended by `colors.js` |
| `shared-utils.js` | `escapeHtml`, `debounce`, `trapFocus`, `showToast`, `initOverlayDismiss` |
| `shared-base.css` | `.glass` toolbar, `.tool-btn`, form controls, toast, a11y |
| `shared-toolbar.js` | `_toolbar.initTheme()` for theme toggle |
| `shared-tabs.js` | Tabbed views in glossary/search if needed |
| `shared-touch.js` | Swipe-to-dismiss notes on mobile |
| `shared-shortcuts.js` | Keyboard shortcuts (`/` search, arrow keys chapter nav, Escape close) |
| `shared-about.js` | About overlay with project info |

### URL Routing

Hash-based, matching the main site's pattern:
- `#quran/2` — Quran, chapter 2
- `#bible-kjv/genesis-1` — KJV Bible, Genesis 1
- `#lds/1-nephi-1` — Book of Mormon, 1 Nephi 1
- `#search/light` — search results for "light"
- Default (no hash): first work, first chapter

### Layout

**Desktop (>900px):**
- Glass toolbar (top): brand, work dropdown, book dropdown (if multi-book), chapter dropdown, translation dropdown, Compare toggle, Glossary button, Search button, theme toggle
- Reading pane (center): chapter title, section headings, verse text with superscript numbers and footnote markers
- Notes sidebar (right, ~250px): footnotes for visible section, color-coded by type (blue=commentary, green=cross-ref, amber=glossary)
- Prev/next chapter links at bottom of reading pane

**Mobile (<=900px):**
- Compressed toolbar with abbreviated dropdowns
- Full-width reading pane
- Notes sidebar collapses; footnotes become tappable inline cards (dismissable)
- Compare mode stacks columns vertically
- Swipe gestures for prev/next chapter

**Compare mode:**
- Reading pane splits into side-by-side columns, each with its own translation label
- Verses aligned by number, synchronized scroll
- Notes sidebar hides; footnotes become inline popovers
- Mobile: columns stack vertically with translation headers

### Key Interactions

1. **Page load**: fetch all `data/*/manifest.json` (auto-discovery via a top-level `data/works.json` listing available work IDs), populate dropdowns, load chapter from URL hash or default
2. **Chapter navigation**: update hash, fetch + cache chapter JSON, render verses and footnotes
3. **Footnote click**: highlight marker in reading pane, scroll notes sidebar to that note
4. **Cross-ref click**: navigate to referenced verse (update hash, fetch chapter if needed, scroll to verse, highlight)
5. **Compare toggle**: split reading pane, show second translation dropdown, sync scroll
6. **Search**: open overlay, lazy-load `search-index.json` on first use, debounced type-ahead, results grouped by work, click navigates to verse
7. **Glossary**: open overlay, show alphabetical term list, click shows definition, glossary footnotes in text link here

### Auto-Discovery

A `data/works.json` file lists available work IDs:
```json
["quran", "bible-kjv", "lds"]
```

The extraction pipeline updates this file. The frontend reads it to know which manifests to fetch. Adding a new work means adding its directory and appending its ID to this list — no frontend code changes needed.

## Extraction Pipeline

### Structure

```
scripture/extract/
  extract.py               # CLI: python3 extract.py <pdf> --parser quran --output ../data/quran
  base_parser.py           # BaseParser abstract class
  parsers/
    __init__.py
    quran.py               # QuranParser
    bible.py               # BibleParser
    lds.py                 # LDSParser
  search_index.py          # python3 search_index.py ../data → builds search-index.json + works.json
  requirements.txt         # pymupdf
```

### BaseParser Interface

```python
class BaseParser:
    def parse(self, pdf_path: str) -> dict:
        """Main entry. Returns { manifest, chapters, glossary }."""

    def extract_chapters(self, doc) -> list[dict]:
        """PDF document -> list of chapter dicts (verses, footnotes, sections)."""

    def extract_glossary(self, doc) -> list[dict]:
        """PDF document -> list of { id, term, definition } entries."""

    def build_manifest(self, chapters, metadata) -> dict:
        """Build the manifest from extracted chapter data + user-provided metadata."""

    def write_output(self, data: dict, output_dir: str):
        """Write manifest.json, glossary.json, chapters/*.json to output_dir."""
```

### Parser Strategies

**QuranParser:**
- Sequential page scan from chapter 1 start (~page 69)
- Chapter detection: `Chapter N` + Arabic transliteration + English name
- Verse detection: inline superscript numbers before verse text
- Footnote detection: letter markers (a, b, c...) with paragraphs of commentary
- Section headings: bold text between chapter header and verse content
- Glossary: extract Arabic terms defined within footnote commentary

**BibleParser:**
- Two-column layout handling via PyMuPDF text block positioning
- Book detection: all-caps book names (`GENESIS`, `EXODUS`, etc.)
- Chapter detection: `CHAPTER N` headers + italic chapter summaries
- Verse detection: inline numbers
- Footnote detection: superscript letters mapping to page-bottom cross-references
- Glossary: Bible Dictionary section (~pages 2200-2400 of the Quad)

**LDSParser:**
- Extends same two-column handling as BibleParser
- Detects three sub-work boundaries within the Quad PDF
- Book of Mormon: book names + chapter numbers
- D&C: `Section N` headers with headnotes
- Pearl of Great Price: book names (Moses, Abraham, JS—Matthew, JS—History, Articles of Faith)

### Adding a New Text

1. Place PDF in `scripture/`
2. Create `parsers/new_text.py` inheriting `BaseParser`
3. Implement `extract_chapters()` and `extract_glossary()` for that PDF's layout
4. Run: `python3 extract.py new_text.pdf --parser new_text --output ../data/new-text-id`
5. Run: `python3 search_index.py ../data` (rebuilds search index + works.json)
6. Frontend auto-discovers the new work on next load

## Accessibility

- Skip link to reading pane
- Toolbar dropdowns are keyboard-navigable (arrow keys, Enter, Escape)
- Footnote markers have `role="button"` and `aria-describedby` linking to note content
- Notes sidebar is `role="complementary"` with `aria-label`
- Search overlay and glossary use `trapFocus()` and `aria-modal`
- Compare mode columns use `aria-label` to identify translations
- `prefers-reduced-motion` respected (no scroll animations)
- Prev/next chapter links are focusable with descriptive text

## Colors

`colors.js` extends `_PALETTE` with scripture-specific tokens:
- Footnote type colors: commentary (blue), cross-ref (green), glossary (amber)
- Verse number accent color
- Section heading color
- Search highlight color

All derived from the shared palette's extended color set where possible.
