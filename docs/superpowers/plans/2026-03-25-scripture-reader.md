# Scripture Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static scripture reader that extracts text from religious PDFs and displays them with verse numbers, typed footnotes, translation comparison, glossary, and search.

**Architecture:** Python extraction pipeline (PyMuPDF) converts PDFs to JSON (manifests + chapter files + glossary + search index). Vanilla JS frontend consumes JSON with hash-based routing, auto-discovers works from `data/works.json`. Reuses shared design system (`shared-tokens.js`, `shared-base.css`, `shared-toolbar.js`, etc.).

**Tech Stack:** Python 3 + PyMuPDF for extraction, vanilla ES6 modules for frontend, shared design system from root site.

**Spec:** `docs/superpowers/specs/2026-03-25-scripture-reader-design.md`

---

## File Map

### Extraction Pipeline (Python)

| File | Responsibility |
|------|---------------|
| `extract/requirements.txt` | PyMuPDF dependency |
| `extract/base_parser.py` | Abstract base class defining parser interface |
| `extract/extract.py` | CLI entry point — loads parser, runs extraction, writes output |
| `extract/parsers/__init__.py` | Parser registry |
| `extract/parsers/quran.py` | Quran PDF parser |
| `extract/parsers/bible.py` | KJV Bible parser (from Quad PDF) |
| `extract/parsers/lds.py` | BoM/D&C/PoGP parser (from Quad PDF) |
| `extract/search_index.py` | Builds combined search index + works.json from all data dirs |

### Frontend (JavaScript)

| File | Responsibility |
|------|---------------|
| `index.html` | HTML shell — toolbar, reading pane, notes sidebar, overlays |
| `main.js` | Entry point — `$` DOM cache, init, hash routing |
| `colors.js` | Extends `_PALETTE` with scripture-specific tokens |
| `styles.css` | All project-specific CSS |
| `src/chapters.js` | Manifest + chapter fetching and caching |
| `src/nav.js` | Toolbar dropdown population and interaction |
| `src/reader.js` | Verse rendering with footnote markers and section headings |
| `src/notes.js` | Notes sidebar rendering, footnote highlight sync |
| `src/compare.js` | Compare mode — split pane, translation picker, scroll sync |
| `src/search.js` | Search overlay — index loading, filtering, result rendering |
| `src/glossary.js` | Glossary overlay — term list, definitions |

### Generated Data (committed for GitHub Pages)

| File | Responsibility |
|------|---------------|
| `data/works.json` | Array of available work IDs |
| `data/{workId}/manifest.json` | Work metadata, book/chapter listing, translation info |
| `data/{workId}/glossary.json` | Extracted terms and definitions |
| `data/{workId}/chapters/{id}.json` | Verses, footnotes, sections for one chapter |
| `data/search-index.json` | Combined verse text index across all works |

---

## Task 1: Extraction Pipeline — Base Parser + CLI

**Files:**
- Create: `scripture/extract/requirements.txt`
- Create: `scripture/extract/base_parser.py`
- Create: `scripture/extract/extract.py`
- Create: `scripture/extract/parsers/__init__.py`
- Create: `scripture/extract/search_index.py`

- [ ] **Step 1: Create requirements.txt**

```
pymupdf>=1.25.0
```

- [ ] **Step 2: Create base_parser.py**

```python
"""Abstract base class for scripture PDF parsers."""

import json
import os
import re
from abc import ABC, abstractmethod

import fitz  # PyMuPDF


class BaseParser(ABC):
    """Base class all scripture parsers inherit from.

    Subclasses must implement:
        extract_chapters(doc) -> list[dict]
        extract_glossary(doc) -> list[dict]
        build_manifest(chapters) -> dict
    """

    @abstractmethod
    def extract_chapters(self, doc: fitz.Document) -> list[dict]:
        """Extract chapters from PDF.

        Returns list of dicts matching the chapter JSON schema:
        {
            "chapter": str,
            "id": str,
            "name": str,
            "altName": str | None,
            "intro": str | None,
            "sections": [{"heading": str, "startVerse": int}],
            "verses": [{"number": int, "text": str, "footnotes": [str]}],
            "footnotes": {
                "a": {"type": "commentary"|"cross-ref"|"glossary", "text": str, ...}
            }
        }
        """

    @abstractmethod
    def extract_glossary(self, doc: fitz.Document) -> list[dict]:
        """Extract glossary terms from PDF.

        Returns list of {"id": str, "term": str, "definition": str}.
        """

    @abstractmethod
    def build_manifest(self, chapters: list[dict]) -> dict:
        """Build manifest from extracted chapters.

        Returns dict matching the manifest JSON schema:
        {
            "id": str,
            "title": str,
            "translations": [{"id": str, "name": str, "year": int}],
            "books": [{
                "id": str,
                "name": str,
                "chapters": [{"id": str, "name": str, "altName": str|None, "verses": int}]
            }]
        }
        """

    def parse(self, pdf_path: str) -> dict:
        """Main entry point. Opens PDF and runs extraction."""
        doc = fitz.open(pdf_path)
        chapters = self.extract_chapters(doc)
        glossary = self.extract_glossary(doc)
        manifest = self.build_manifest(chapters)
        doc.close()
        return {"manifest": manifest, "chapters": chapters, "glossary": glossary}

    def write_output(self, data: dict, output_dir: str):
        """Write manifest.json, glossary.json, and chapters/*.json."""
        os.makedirs(os.path.join(output_dir, "chapters"), exist_ok=True)

        with open(os.path.join(output_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(data["manifest"], f, indent=2, ensure_ascii=False)

        with open(os.path.join(output_dir, "glossary.json"), "w", encoding="utf-8") as f:
            json.dump(data["glossary"], f, indent=2, ensure_ascii=False)

        for ch in data["chapters"]:
            chapter_id = ch.get("id", ch["chapter"])
            path = os.path.join(output_dir, "chapters", f"{chapter_id}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(ch, f, indent=2, ensure_ascii=False)

        print(f"Wrote {len(data['chapters'])} chapters to {output_dir}")

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-safe slug: lowercase, hyphens, no special chars."""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_]+', '-', text)
        return text.strip('-')
```

- [ ] **Step 3: Create parsers/__init__.py with registry**

```python
"""Parser registry. Maps parser names to classes."""

from .quran import QuranParser
from .bible import BibleParser
from .lds import LDSParser

PARSERS = {
    "quran": QuranParser,
    "bible": BibleParser,
    "lds": LDSParser,
}
```

Note: This will fail to import until the parser files exist. That's expected — they're created in Tasks 2-4.

- [ ] **Step 4: Create extract.py CLI**

```python
#!/usr/bin/env python3
"""CLI for extracting scripture PDFs into JSON data files.

Usage:
    python3 extract.py <pdf_path> --parser <name> --output <dir>

Example:
    python3 extract.py ../trans-quran-web.pdf --parser quran --output ../data/quran
"""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract scripture PDF to JSON")
    parser.add_argument("pdf", help="Path to the PDF file")
    parser.add_argument("--parser", required=True, help="Parser name (quran, bible, lds)")
    parser.add_argument("--output", required=True, help="Output directory for JSON files")
    args = parser.parse_args()

    # Import here so --help works even without parsers
    from parsers import PARSERS

    if args.parser not in PARSERS:
        print(f"Unknown parser: {args.parser}")
        print(f"Available: {', '.join(PARSERS.keys())}")
        sys.exit(1)

    p = PARSERS[args.parser]()
    print(f"Parsing {args.pdf} with {args.parser} parser...")
    data = p.parse(args.pdf)
    p.write_output(data, args.output)
    print("Done.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Create search_index.py**

```python
#!/usr/bin/env python3
"""Build combined search index and works.json from all extracted data directories.

Usage:
    python3 search_index.py <data_dir>

Example:
    python3 search_index.py ../data
"""

import argparse
import json
import os


def build_index(data_dir: str):
    """Walk all data/{workId}/chapters/*.json, build search index + works.json."""
    works = []
    index = []

    for entry in sorted(os.listdir(data_dir)):
        manifest_path = os.path.join(data_dir, entry, "manifest.json")
        if not os.path.isfile(manifest_path):
            continue

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        work_id = manifest["id"]
        works.append(work_id)

        chapters_dir = os.path.join(data_dir, entry, "chapters")
        if not os.path.isdir(chapters_dir):
            continue

        for ch_file in sorted(os.listdir(chapters_dir)):
            if not ch_file.endswith(".json"):
                continue
            with open(os.path.join(chapters_dir, ch_file), "r", encoding="utf-8") as f:
                chapter = json.load(f)

            chapter_id = chapter.get("id", chapter["chapter"])
            for verse in chapter.get("verses", []):
                ref = f"{work_id}:{chapter_id}:{verse['number']}"
                index.append({"ref": ref, "text": verse["text"]})

    # Write works.json
    works_path = os.path.join(data_dir, "works.json")
    with open(works_path, "w", encoding="utf-8") as f:
        json.dump(works, f, indent=2)
    print(f"Wrote {len(works)} works to {works_path}")

    # Write search-index.json
    index_path = os.path.join(data_dir, "search-index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
    print(f"Wrote {len(index)} verses to {index_path}")


def main():
    parser = argparse.ArgumentParser(description="Build search index from extracted data")
    parser.add_argument("data_dir", help="Path to the data directory")
    args = parser.parse_args()
    build_index(args.data_dir)


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Commit**

```bash
cd scripture
git add extract/
git commit -m "feat: add extraction pipeline base — CLI, base parser, search index builder"
```

---

## Task 2: Quran Parser

**Files:**
- Create: `scripture/extract/parsers/quran.py`

This is the most straightforward parser — the Quran PDF has a single-column layout with clear structural markers.

**PDF structure findings (from `trans-quran-web.pdf`):**
- Content starts ~page 69 (0-indexed 68)
- Chapter headers: `Chapter N` at size 15.0 flags 4, followed by Arabic name (size 10.0, flags 22), then English name (size 15.0, flags 20)
- Verse numbers: size 10.5, flags 20 (bold), appear on their own line before verse text
- Verse text: size 10.5, flags 4
- Footnote markers in verse text: single letters at size 7.0, flags 7 (superscript)
- Section headings within chapters: "Section N:" pattern, smaller bold text
- Notes section: starts with "Notes" heading (size 9.0, flags 22), followed by note entries starting with bold letter (size 8.5, flags 22)
- Chapter intro paragraphs: size 9.0, appear between chapter header and "Section 1"
- Page numbers at top of page (size 9.0 or 10.4)

- [ ] **Step 1: Create parsers/quran.py**

```python
"""Parser for the Maulana Muhammad Ali Quran translation PDF."""

import re
import fitz
from ..base_parser import BaseParser

# Font-size thresholds from PDF analysis
_CH_HEADER_SIZE = 14.0   # "Chapter N" text
_VERSE_TEXT_SIZE = 10.0   # verse body text min
_FOOTNOTE_MARKER_SIZE = 7.5  # superscript footnote letters (7.0 in PDF)
_NOTE_LETTER_FLAGS = 22   # bold italic for note letters

# Chapter header pattern
_CH_PATTERN = re.compile(r'^Chapter\s+(\d+)\s*$')
# Verse number pattern (standalone number on a line)
_VERSE_NUM_PATTERN = re.compile(r'^(\d+)\s*$')
# Section heading pattern
_SECTION_PATTERN = re.compile(r'^Section\s+(\d+):\s*(.*)', re.IGNORECASE)
# Note letter at start of a note entry
_NOTE_START_PATTERN = re.compile(r'^([a-z])\.\s*')


class QuranParser(BaseParser):
    """Extract Quran chapters, verses, footnotes, and glossary."""

    # First page of actual chapter content (0-indexed)
    CONTENT_START_PAGE = 68

    def extract_chapters(self, doc: fitz.Document) -> list[dict]:
        chapters = []
        current = None

        for page_idx in range(self.CONTENT_START_PAGE, len(doc)):
            page = doc[page_idx]
            blocks = page.get_text("dict")["blocks"]

            for block in blocks:
                if "lines" not in block:
                    continue
                for line in block["lines"]:
                    spans = line["spans"]
                    if not spans:
                        continue

                    text = "".join(s["text"] for s in spans).strip()
                    if not text:
                        continue

                    first_span = spans[0]
                    size = first_span["size"]
                    flags = first_span["flags"]

                    # Detect chapter header
                    m = _CH_PATTERN.match(text)
                    if m and size >= _CH_HEADER_SIZE:
                        if current:
                            self._finalize_chapter(current)
                            chapters.append(current)
                        ch_num = m.group(1)
                        current = {
                            "chapter": ch_num,
                            "id": ch_num,
                            "name": "",
                            "altName": None,
                            "intro": "",
                            "sections": [],
                            "verses": [],
                            "footnotes": {},
                            "_state": "header",
                            "_note_key": None,
                            "_note_buf": "",
                        }
                        continue

                    if current is None:
                        continue

                    state = current["_state"]

                    # Right after "Chapter N", next large-font lines are the names
                    if state == "header":
                        if size >= _CH_HEADER_SIZE and flags & 16:
                            current["altName"] = text
                            continue
                        elif flags & 2:
                            current["name"] = text
                            continue
                        else:
                            current["_state"] = "intro"

                    # Detect "Notes" section start
                    if text.startswith("Notes") or text == "\x02otes" or (
                        text.lower().startswith("note") and flags & 2 and size < _VERSE_TEXT_SIZE
                    ):
                        current["_state"] = "notes"
                        continue

                    # Detect chapter intro paragraph
                    if state == "intro":
                        sm = _SECTION_PATTERN.match(text)
                        if sm:
                            current["sections"].append({
                                "heading": sm.group(2).strip() if sm.group(2).strip() else f"Section {sm.group(1)}",
                                "startVerse": len(current["verses"]) + 1,
                            })
                            current["_state"] = "verses"
                            continue

                        if _VERSE_NUM_PATTERN.match(text) and flags & 16:
                            current["_state"] = "verses"
                        else:
                            if current["intro"]:
                                current["intro"] += " "
                            current["intro"] += text
                            continue

                    state = current["_state"]

                    # Notes section parsing
                    if state == "notes":
                        if len(spans) >= 1 and spans[0]["flags"] & 2 and size < _VERSE_TEXT_SIZE:
                            first_text = spans[0]["text"].strip()
                            nm = _NOTE_START_PATTERN.match(first_text)
                            if nm:
                                if current["_note_key"]:
                                    self._save_note(current)
                                current["_note_key"] = nm.group(1)
                                rest = first_text[nm.end():]
                                rest += "".join(s["text"] for s in spans[1:])
                                current["_note_buf"] = rest.strip()
                                continue
                            elif len(first_text) == 1 and first_text.isalpha():
                                if current["_note_key"]:
                                    self._save_note(current)
                                current["_note_key"] = first_text.lower()
                                rest = "".join(s["text"] for s in spans[1:]).strip()
                                if rest.startswith("."):
                                    rest = rest[1:].strip()
                                current["_note_buf"] = rest
                                continue

                        if current["_note_key"]:
                            if current["_note_buf"]:
                                current["_note_buf"] += " "
                            current["_note_buf"] += text
                        continue

                    # Verse parsing
                    if state == "verses":
                        sm = _SECTION_PATTERN.match(text)
                        if sm:
                            current["sections"].append({
                                "heading": sm.group(2).strip() if sm.group(2).strip() else f"Section {sm.group(1)}",
                                "startVerse": len(current["verses"]) + 1,
                            })
                            continue

                        if size < _VERSE_TEXT_SIZE and not (flags & 2):
                            if re.match(r'^\d+$', text) or re.match(r'^Ch\.\s*\d+', text, re.IGNORECASE):
                                continue
                            if '\u2022' in text or 'Ch.' in text:
                                continue

                        verse_num = None
                        verse_text_parts = []
                        footnote_markers = []

                        for s in spans:
                            s_text = s["text"].strip()
                            if not s_text:
                                continue

                            if s["size"] < _FOOTNOTE_MARKER_SIZE and len(s_text) == 1 and s_text.isalpha():
                                footnote_markers.append(s_text.lower())
                                continue

                            if verse_num is None and s["flags"] & 16 and _VERSE_NUM_PATTERN.match(s_text):
                                verse_num = int(s_text)
                                continue

                            verse_text_parts.append(s["text"])

                        verse_text = "".join(verse_text_parts).strip()

                        if verse_num is not None:
                            current["verses"].append({
                                "number": verse_num,
                                "text": verse_text,
                                "footnotes": footnote_markers,
                            })
                        elif verse_text and current["verses"]:
                            last = current["verses"][-1]
                            last["text"] += " " + verse_text
                            last["footnotes"].extend(footnote_markers)

        if current:
            self._finalize_chapter(current)
            chapters.append(current)

        return chapters

    def _save_note(self, current: dict):
        """Save buffered note text to chapter footnotes."""
        key = current["_note_key"]
        text = current["_note_buf"].strip()
        if key and text:
            ref_pattern = re.compile(r'(\d+):(\d+)')
            refs = ref_pattern.findall(text)
            if refs and len(text) < 200 and ("see" in text.lower() or "cf." in text.lower()):
                current["footnotes"][key] = {
                    "type": "cross-ref",
                    "refs": [f"quran:{ch}:{v}" for ch, v in refs],
                    "text": text,
                }
            else:
                current["footnotes"][key] = {
                    "type": "commentary",
                    "text": text,
                }

    def _finalize_chapter(self, current: dict):
        """Clean up temporary state from chapter dict."""
        if current.get("_note_key"):
            self._save_note(current)
        for key in ("_state", "_note_key", "_note_buf"):
            current.pop(key, None)
        if not current["intro"]:
            current["intro"] = None

    def extract_glossary(self, doc: fitz.Document) -> list[dict]:
        """The Quran translation doesn't have a dedicated glossary section."""
        return []

    def build_manifest(self, chapters: list[dict]) -> dict:
        chapter_entries = []
        for ch in chapters:
            chapter_entries.append({
                "id": ch["chapter"],
                "name": ch.get("name", f"Chapter {ch['chapter']}"),
                "altName": ch.get("altName"),
                "verses": len(ch.get("verses", [])),
            })

        return {
            "id": "quran",
            "title": "The Quran",
            "translations": [
                {"id": "m-ali", "name": "Maulana Muhammad Ali", "year": 2010}
            ],
            "books": [
                {
                    "id": "quran",
                    "name": "The Quran",
                    "chapters": chapter_entries,
                }
            ],
        }
```

- [ ] **Step 2: Test extraction on the Quran PDF**

Run from `scripture/extract/`:
```bash
cd scripture/extract && python3 extract.py ../../scripture/trans-quran-web.pdf --parser quran --output ../data/quran
```

Verify:
```bash
ls ../data/quran/chapters/ | wc -l
python3 -c "import json; ch=json.load(open('../data/quran/chapters/1.json')); print(json.dumps(ch, indent=2)[:1000])"
python3 -c "import json; m=json.load(open('../data/quran/manifest.json')); print(len(m['books'][0]['chapters']))"
```

Expected: 114 chapter files, Al-Fatihah has 7 verses with footnote markers, manifest lists 114 chapters.

- [ ] **Step 3: Iterate on parser quality**

Inspect several chapters for quality. Check:
- Verse text is clean (no stray page numbers or headers mixed in)
- Footnote markers (a, b, c) in verses correspond to entries in the footnotes dict
- Chapter names and alt names are correct
- Section headings are captured

Fix any issues in the parser. This step may require multiple iterations.

- [ ] **Step 4: Commit**

```bash
cd scripture
git add extract/parsers/quran.py data/quran/
git commit -m "feat: add Quran parser — extracts 114 chapters with verses and footnotes"
```

---

## Task 3: Bible Parser (KJV from Quad)

**Files:**
- Create: `scripture/extract/parsers/bible.py`

**PDF structure findings (from `quad_regular_simulated_black_unindexed.pdf`):**
- Bible content starts at page 10 (0-indexed), ends before Topical Guide (~page 1650)
- Two-column layout: left column x-origin ~36, right column x-origin ~223
- Book names: all-caps text (e.g., "GENESIS", "EXODUS")
- Chapter headers: "CHAPTER N" in text, followed by italic chapter summary
- Verse numbers: regular size 10.3, indented
- Footnote markers: size 6.0, flags 22/23, single letters with hair space \u200a
- Cross-reference footnotes at page bottom
- Bible Dictionary: ~pages 2170-2400

- [ ] **Step 1: Create parsers/bible.py**

```python
"""Parser for KJV Bible from the LDS Quad PDF."""

import re
import fitz
from ..base_parser import BaseParser

_BIBLE_START = 9
_BIBLE_END = 1640
_BIBLE_DICT_START = 2150
_BIBLE_DICT_END = 2400
_COL_SPLIT_X = 200
_VERSE_TEXT_SIZE = 10.0
_FOOTNOTE_MARKER_MAX_SIZE = 7.0

_BOOK_NAMES = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation",
]
_BOOK_NAMES_UPPER = {b.upper(): b for b in _BOOK_NAMES}
_HEADER_PATTERN = re.compile(
    r'^(' + '|'.join(re.escape(b.upper()) for b in _BOOK_NAMES) + r')\s+\d+:\d+',
)
_CHAPTER_PATTERN = re.compile(r'^CHAPTER\s+(\d+)\s*$')
_VERSE_START_PATTERN = re.compile(r'^(\d+)\s+')


class BibleParser(BaseParser):
    """Extract KJV Bible from the Quad PDF."""

    def extract_chapters(self, doc: fitz.Document) -> list[dict]:
        chapters = []
        current_book = None
        current_chapter = None

        for page_idx in range(_BIBLE_START, min(_BIBLE_END, len(doc))):
            page = doc[page_idx]
            lines = self._get_ordered_lines(page)

            for line_text, line_spans, is_header_zone in lines:
                text = line_text.strip()
                if not text:
                    continue

                if re.match(r'^\d{1,4}$', text) and len(line_spans) == 1:
                    if line_spans[0]["size"] < _VERSE_TEXT_SIZE or is_header_zone:
                        continue

                if _HEADER_PATTERN.match(text):
                    continue

                if text in _BOOK_NAMES_UPPER and len(line_spans) <= 3:
                    current_book = _BOOK_NAMES_UPPER[text]
                    continue

                cm = _CHAPTER_PATTERN.match(text)
                if cm:
                    if current_chapter:
                        self._finalize_chapter(current_chapter)
                        chapters.append(current_chapter)

                    ch_num = cm.group(1)
                    book_slug = self.slugify(current_book) if current_book else "unknown"
                    current_chapter = {
                        "chapter": ch_num,
                        "id": f"{book_slug}-{ch_num}",
                        "name": f"Chapter {ch_num}",
                        "altName": None,
                        "intro": "",
                        "sections": [],
                        "verses": [],
                        "footnotes": {},
                        "_book": current_book,
                        "_in_summary": True,
                    }
                    continue

                if current_chapter is None:
                    continue

                if current_chapter["_in_summary"]:
                    if _VERSE_START_PATTERN.match(text):
                        current_chapter["_in_summary"] = False
                    else:
                        if current_chapter["intro"]:
                            current_chapter["intro"] += " "
                        current_chapter["intro"] += text
                        continue

                self._parse_verse_line(text, line_spans, current_chapter)

        if current_chapter:
            self._finalize_chapter(current_chapter)
            chapters.append(current_chapter)

        return chapters

    def _get_ordered_lines(self, page: fitz.Page) -> list[tuple]:
        """Extract text lines ordered by column (left then right), then top to bottom."""
        blocks = page.get_text("dict")["blocks"]
        lines_left = []
        lines_right = []

        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                spans = line["spans"]
                if not spans:
                    continue
                text = "".join(s["text"] for s in spans).strip()
                if not text:
                    continue

                x = spans[0]["origin"][0]
                y = spans[0]["origin"][1]
                is_header = y < 40

                entry = (text, spans, is_header, y)
                if x < _COL_SPLIT_X:
                    lines_left.append(entry)
                else:
                    lines_right.append(entry)

        lines_left.sort(key=lambda e: e[3])
        lines_right.sort(key=lambda e: e[3])

        return [(t, s, h) for t, s, h, _ in lines_left] + [(t, s, h) for t, s, h, _ in lines_right]

    def _parse_verse_line(self, text: str, spans: list, chapter: dict):
        """Parse a line of verse text, extracting verse numbers and footnote markers."""
        footnote_markers = []
        text_parts = []

        for s in spans:
            s_text = s["text"]
            clean = s_text.strip().replace('\u200a', '')
            if not clean:
                continue

            if s["size"] < _FOOTNOTE_MARKER_MAX_SIZE and len(clean) == 1 and clean.isalpha():
                footnote_markers.append(clean.lower())
                continue

            text_parts.append(s_text)

        full_text = "".join(text_parts).strip()
        full_text = full_text.replace('\u00b6 ', '').replace('\u00b6', '')

        if not full_text:
            return

        vm = _VERSE_START_PATTERN.match(full_text)
        if vm:
            verse_num = int(vm.group(1))
            full_text = full_text[vm.end():]
            chapter["verses"].append({
                "number": verse_num,
                "text": full_text.strip(),
                "footnotes": footnote_markers,
            })
        elif chapter["verses"]:
            last = chapter["verses"][-1]
            last["text"] += " " + full_text.strip()
            last["footnotes"].extend(footnote_markers)

    def _finalize_chapter(self, chapter: dict):
        if not chapter["intro"]:
            chapter["intro"] = None
        chapter.pop("_book", None)
        chapter.pop("_in_summary", None)
        for v in chapter["verses"]:
            v["text"] = re.sub(r'\s+', ' ', v["text"]).strip()

    def extract_glossary(self, doc: fitz.Document) -> list[dict]:
        """Extract Bible Dictionary entries from the Quad."""
        glossary = []
        current_term = None
        current_def = []

        for page_idx in range(_BIBLE_DICT_START, min(_BIBLE_DICT_END, len(doc))):
            page = doc[page_idx]
            blocks = page.get_text("dict")["blocks"]

            for block in blocks:
                if "lines" not in block:
                    continue
                for line in block["lines"]:
                    spans = line["spans"]
                    if not spans:
                        continue

                    text = "".join(s["text"] for s in spans).strip()
                    if not text:
                        continue

                    first = spans[0]

                    if first["flags"] & 2 and first["size"] >= 9.0:
                        term_text = first["text"].strip()
                        if current_term and current_def:
                            glossary.append({
                                "id": self.slugify(current_term),
                                "term": current_term,
                                "definition": " ".join(current_def),
                            })
                        current_term = term_text
                        rest = "".join(s["text"] for s in spans[1:]).strip()
                        current_def = [rest] if rest else []
                    elif current_term:
                        current_def.append(text)

        if current_term and current_def:
            glossary.append({
                "id": self.slugify(current_term),
                "term": current_term,
                "definition": " ".join(current_def),
            })

        return glossary

    def build_manifest(self, chapters: list[dict]) -> dict:
        books = {}
        book_order = []
        for ch in chapters:
            parts = ch["id"].rsplit("-", 1)
            book_slug = parts[0]

            if book_slug not in books:
                proper_name = None
                for bn in _BOOK_NAMES:
                    if self.slugify(bn) == book_slug:
                        proper_name = bn
                        break
                books[book_slug] = {
                    "id": book_slug,
                    "name": proper_name or book_slug,
                    "chapters": [],
                }
                book_order.append(book_slug)

            books[book_slug]["chapters"].append({
                "id": ch["id"],
                "name": ch["name"],
                "altName": ch.get("altName"),
                "verses": len(ch.get("verses", [])),
            })

        return {
            "id": "bible-kjv",
            "title": "King James Bible",
            "translations": [
                {"id": "kjv", "name": "King James Version", "year": 1769}
            ],
            "books": [books[slug] for slug in book_order],
        }
```

- [ ] **Step 2: Test extraction on the Quad PDF (Bible portion)**

```bash
cd scripture/extract && python3 extract.py ../../scripture/quad_regular_simulated_black_unindexed.pdf --parser bible --output ../data/bible-kjv
```

Verify:
```bash
ls ../data/bible-kjv/chapters/ | wc -l
python3 -c "import json; ch=json.load(open('../data/bible-kjv/chapters/genesis-1.json')); print(f'Verses: {len(ch[\"verses\"])}'); print(ch['verses'][0])"
python3 -c "import json; m=json.load(open('../data/bible-kjv/manifest.json')); print(f'Books: {len(m[\"books\"])}')"
```

Expected: ~1189 chapter files, Genesis 1 has 31 verses, manifest has 66 books.

- [ ] **Step 3: Iterate on parser quality**

Check several chapters across OT and NT for correct verse splitting, clean text, and proper column ordering.

- [ ] **Step 4: Commit**

```bash
cd scripture
git add extract/parsers/bible.py data/bible-kjv/
git commit -m "feat: add KJV Bible parser — extracts 66 books from Quad PDF"
```

---

## Task 4: LDS Scripture Parser (BoM, D&C, PoGP)

**Files:**
- Create: `scripture/extract/parsers/lds.py`

- [ ] **Step 1: Create parsers/lds.py**

```python
"""Parser for LDS scriptures (Book of Mormon, D&C, PoGP) from the Quad PDF."""

import re
import fitz
from ..base_parser import BaseParser
from .bible import _COL_SPLIT_X, _VERSE_TEXT_SIZE, _FOOTNOTE_MARKER_MAX_SIZE

_BOM_START = 2460
_DC_START = 3030
_POGP_START = 3340
_POGP_END = 3400

_BOM_BOOKS = [
    "1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni",
    "Words of Mormon", "Mosiah", "Alma", "Helaman",
    "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni",
]
_BOM_BOOKS_UPPER = {b.upper(): b for b in _BOM_BOOKS}

_POGP_BOOKS = [
    "Moses", "Abraham", "Joseph Smith\u2014Matthew",
    "Joseph Smith\u2014History", "Articles of Faith",
]
_POGP_BOOKS_UPPER = {b.upper(): b for b in _POGP_BOOKS}

_CHAPTER_PATTERN = re.compile(r'^CHAPTER\s+(\d+)\s*$')
_SECTION_PATTERN = re.compile(r'^SECTION\s+(\d+)\s*$')
_VERSE_START_PATTERN = re.compile(r'^(\d+)\s+')


class LDSParser(BaseParser):
    """Extract BoM, D&C, and PoGP from the Quad PDF."""

    def extract_chapters(self, doc: fitz.Document) -> list[dict]:
        chapters = []
        current_book = None
        current_chapter = None
        current_section = "bom"

        for page_idx in range(_BOM_START, min(_POGP_END, len(doc))):
            page = doc[page_idx]
            lines = self._get_ordered_lines(page)

            if page_idx >= _POGP_START:
                current_section = "pogp"
            elif page_idx >= _DC_START:
                current_section = "dc"

            for line_text, line_spans, is_header_zone in lines:
                text = line_text.strip()
                if not text:
                    continue

                if re.match(r'^\d{1,4}$', text) and len(line_spans) == 1:
                    if is_header_zone or line_spans[0]["size"] < _VERSE_TEXT_SIZE:
                        continue

                if is_header_zone:
                    continue

                text_upper = text.upper().strip()
                detected_book = None
                if current_section == "bom" and text_upper in _BOM_BOOKS_UPPER:
                    detected_book = _BOM_BOOKS_UPPER[text_upper]
                elif current_section == "pogp" and text_upper in _POGP_BOOKS_UPPER:
                    detected_book = _POGP_BOOKS_UPPER[text_upper]

                if detected_book:
                    current_book = detected_book
                    continue

                ch_num = None
                cm = _CHAPTER_PATTERN.match(text)
                if cm:
                    ch_num = cm.group(1)
                else:
                    sm = _SECTION_PATTERN.match(text)
                    if sm:
                        ch_num = sm.group(1)
                        if current_section == "dc":
                            current_book = "Doctrine and Covenants"

                if ch_num is not None:
                    if current_chapter:
                        self._finalize_chapter(current_chapter)
                        chapters.append(current_chapter)

                    book_slug = BaseParser.slugify(current_book) if current_book else "unknown"
                    if current_section == "dc":
                        ch_id = f"dc-{ch_num}"
                    else:
                        ch_id = f"{book_slug}-{ch_num}"

                    current_chapter = {
                        "chapter": ch_num,
                        "id": ch_id,
                        "name": f"{'Section' if current_section == 'dc' else 'Chapter'} {ch_num}",
                        "altName": None,
                        "intro": "",
                        "sections": [],
                        "verses": [],
                        "footnotes": {},
                        "_book": current_book,
                        "_in_summary": True,
                    }
                    continue

                if current_chapter is None:
                    continue

                if current_chapter["_in_summary"]:
                    if _VERSE_START_PATTERN.match(text):
                        current_chapter["_in_summary"] = False
                    else:
                        if current_chapter["intro"]:
                            current_chapter["intro"] += " "
                        current_chapter["intro"] += text
                        continue

                self._parse_verse_line(text, line_spans, current_chapter)

        if current_chapter:
            self._finalize_chapter(current_chapter)
            chapters.append(current_chapter)

        return chapters

    def _get_ordered_lines(self, page: fitz.Page) -> list[tuple]:
        blocks = page.get_text("dict")["blocks"]
        lines_left = []
        lines_right = []

        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                spans = line["spans"]
                if not spans:
                    continue
                text = "".join(s["text"] for s in spans).strip()
                if not text:
                    continue

                x = spans[0]["origin"][0]
                y = spans[0]["origin"][1]
                is_header = y < 40

                entry = (text, spans, is_header, y)
                if x < _COL_SPLIT_X:
                    lines_left.append(entry)
                else:
                    lines_right.append(entry)

        lines_left.sort(key=lambda e: e[3])
        lines_right.sort(key=lambda e: e[3])

        return [(t, s, h) for t, s, h, _ in lines_left] + [(t, s, h) for t, s, h, _ in lines_right]

    def _parse_verse_line(self, text: str, spans: list, chapter: dict):
        footnote_markers = []
        text_parts = []

        for s in spans:
            s_text = s["text"]
            clean = s_text.strip().replace('\u200a', '')
            if not clean:
                continue

            if s["size"] < _FOOTNOTE_MARKER_MAX_SIZE and len(clean) == 1 and clean.isalpha():
                footnote_markers.append(clean.lower())
                continue

            text_parts.append(s_text)

        full_text = "".join(text_parts).strip()
        full_text = full_text.replace('\u00b6 ', '').replace('\u00b6', '')

        if not full_text:
            return

        vm = _VERSE_START_PATTERN.match(full_text)
        if vm:
            verse_num = int(vm.group(1))
            verse_text = full_text[vm.end():].strip()
            chapter["verses"].append({
                "number": verse_num,
                "text": verse_text,
                "footnotes": footnote_markers,
            })
        elif chapter["verses"]:
            last = chapter["verses"][-1]
            last["text"] += " " + full_text
            last["footnotes"].extend(footnote_markers)

    def _finalize_chapter(self, chapter: dict):
        if not chapter["intro"]:
            chapter["intro"] = None
        chapter.pop("_book", None)
        chapter.pop("_in_summary", None)
        for v in chapter["verses"]:
            v["text"] = re.sub(r'\s+', ' ', v["text"]).strip()

    def extract_glossary(self, doc: fitz.Document) -> list[dict]:
        return []

    def build_manifest(self, chapters: list[dict]) -> dict:
        books = {}
        book_order = []

        for ch in chapters:
            ch_id = ch["id"]
            if ch_id.startswith("dc-"):
                book_slug = "doctrine-and-covenants"
                book_name = "Doctrine and Covenants"
            else:
                parts = ch_id.rsplit("-", 1)
                book_slug = parts[0]
                book_name = book_slug
                for name in _BOM_BOOKS + _POGP_BOOKS:
                    if BaseParser.slugify(name) == book_slug:
                        book_name = name
                        break

            if book_slug not in books:
                books[book_slug] = {
                    "id": book_slug,
                    "name": book_name,
                    "chapters": [],
                }
                book_order.append(book_slug)

            books[book_slug]["chapters"].append({
                "id": ch["id"],
                "name": ch["name"],
                "altName": ch.get("altName"),
                "verses": len(ch.get("verses", [])),
            })

        return {
            "id": "lds",
            "title": "Book of Mormon, D&C, Pearl of Great Price",
            "translations": [
                {"id": "lds-2013", "name": "LDS Edition", "year": 2013}
            ],
            "books": [books[slug] for slug in book_order],
        }
```

- [ ] **Step 2: Test extraction**

```bash
cd scripture/extract && python3 extract.py ../../scripture/quad_regular_simulated_black_unindexed.pdf --parser lds --output ../data/lds
```

Verify:
```bash
ls ../data/lds/chapters/ | wc -l
python3 -c "import json; ch=json.load(open('../data/lds/chapters/1-nephi-1.json')); print(f'Verses: {len(ch[\"verses\"])}'); print(ch['verses'][0])"
python3 -c "import json; ch=json.load(open('../data/lds/chapters/dc-1.json')); print(f'Verses: {len(ch[\"verses\"])}'); print(ch['verses'][0])"
python3 -c "import json; m=json.load(open('../data/lds/manifest.json')); print(f'Books: {len(m[\"books\"])}')"
```

- [ ] **Step 3: Iterate on parser quality, then build search index**

```bash
cd scripture/extract && python3 search_index.py ../data
```

Verify:
```bash
python3 -c "import json; w=json.load(open('../data/works.json')); print(w)"
python3 -c "import json; idx=json.load(open('../data/search-index.json')); print(f'Total verses: {len(idx)}'); print(idx[0])"
```

- [ ] **Step 4: Commit**

```bash
cd scripture
git add extract/parsers/lds.py data/
git commit -m "feat: add LDS parser + build search index — all three works extracted"
```

---

## Task 5: Frontend Shell — HTML, Colors, Base CSS

**Files:**
- Create: `scripture/index.html`
- Create: `scripture/colors.js`
- Create: `scripture/styles.css`
- Create: `scripture/.gitignore`

- [ ] **Step 1: Create .gitignore**

```
.DS_Store
```

Note: `data/` is NOT gitignored — the generated JSON should be committed for GitHub Pages.

- [ ] **Step 2: Create colors.js**

```javascript
/* Scripture-specific palette extensions. Loaded after shared-tokens.js. */

_PALETTE.noteCommentary = _PALETTE.extended.blue;
_PALETTE.noteCrossRef   = _PALETTE.extended.green;
_PALETTE.noteGlossary   = _PALETTE.extended.yellow;
_PALETTE.verseNum       = _PALETTE.accent;
_PALETTE.sectionHeading = _PALETTE.extended.slate;
_PALETTE.searchHighlight = _PALETTE.extended.yellow;

Object.freeze(_PALETTE.extended);
Object.freeze(_PALETTE.light);
Object.freeze(_PALETTE.dark);
Object.freeze(_FONT);
Object.freeze(_PALETTE);
```

- [ ] **Step 3: Create index.html**

See spec for full HTML structure. Key elements:
- Shared script/CSS loading in `<head>` (same order as other projects)
- Skip link to `#reading-pane`
- Toolbar with `.sim-toolbar.glass`: brand, work/book/chapter/translation `<select>` dropdowns, compare/glossary/search/about/theme buttons
- `#app-layout` flex container with `#reading-pane` (main), `#compare-pane` (hidden), `#notes-sidebar` (aside)
- Search and glossary overlays with `.sim-overlay`
- `<script type="module" src="main.js">` at bottom

- [ ] **Step 4: Create styles.css**

Key CSS sections:
- `#app-layout` flex layout with `#reading-pane` flex:1, `#notes-sidebar` 280px sticky
- Chapter header centered with `--font-display`, verse text with `--font-display` at 1.0625rem, line-height: 2
- `.verse-num` superscript accent-colored, `.fn-marker` small colored button per type
- `.note-card` with left border colored by `data-type` (commentary=`--ext-blue`, cross-ref=`--ext-green`, glossary=`--ext-yellow`)
- Search/glossary overlay with `.overlay-content.glass` centered
- Mobile (<=900px): hide sidebar, show inline notes, stack compare columns
- Mobile (<=600px): smaller title, tighter line-height

- [ ] **Step 5: Commit**

```bash
cd scripture
git add index.html colors.js styles.css .gitignore
git commit -m "feat: add frontend shell — HTML, CSS, colors"
```

---

## Task 6: Core Data Layer — chapters.js

**Files:**
- Create: `scripture/src/chapters.js`

- [ ] **Step 1: Create src/chapters.js**

Exports:
- `loadManifests()` — fetches `data/works.json` then all manifests in parallel, caches in Maps
- `getWorkIds()`, `getManifest(workId)`, `getAllManifests()`
- `loadChapter(workId, chapterId)` — fetches + caches chapter JSON
- `loadGlossary(workId)` — fetches + caches glossary JSON
- `loadSearchIndex()` — lazy loads `data/search-index.json`
- `parseRef(ref)` — splits `"quran:2:255"` into `{ workId, chapterId, verse }`
- `getAdjacentChapters(workId, chapterId)` — returns `{ prev, next }` chapter entries from manifest

All fetching uses `fetch()` with error handling. All caching is in-memory Maps (same pattern as `blog.js`).

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/chapters.js && git commit -m "feat: add data layer — manifest/chapter/glossary loading with caching"
```

---

## Task 7: Navigation + Routing — nav.js + main.js

**Files:**
- Create: `scripture/src/nav.js`
- Create: `scripture/main.js`

- [ ] **Step 1: Create src/nav.js**

Exports:
- `initNav($, navigateFn)` — wires change listeners on all 4 selects, calls `navigateFn(workId, chapterId)` on change
- `syncNav($, workId, chapterId)` — sets all dropdown values to match current state

Logic: work change repopulates books+chapters, book change repopulates chapters, chapter change navigates. Book dropdown hidden when work has only 1 book (e.g., Quran). Translation dropdown hidden when work has only 1 translation.

- [ ] **Step 2: Create main.js**

`$` DOM cache with all element IDs. `init()` function:
1. `_toolbar.initTheme('scripture-theme')` + theme button listener
2. `await loadManifests()`
3. `initNav($, navigate)`, `initSearch($, navigate)`, `initGlossary($)`
4. Compare button wires `toggleCompare()`
5. `initShortcuts()` for `/`, `?`, arrow keys, Escape
6. `initAboutPanel()` with project info
7. `hashchange` listener + initial `routeFromHash()`
8. Delegated click handlers on `#verses` for `.fn-marker` clicks and on `#notes-content` for `.note-ref-link` clicks

Hash format: `#workId/chapterId` with optional `:verseNum` suffix for deep-linking to a verse.

- [ ] **Step 3: Commit**

```bash
cd scripture && git add src/nav.js main.js && git commit -m "feat: add navigation dropdowns and hash routing"
```

---

## Task 8: Reading Pane — reader.js

**Files:**
- Create: `scripture/src/reader.js`

- [ ] **Step 1: Create src/reader.js**

Exports:
- `renderChapter($, chapter)` — builds HTML for chapter header, intro, section headings, and verses with inline footnote markers. Uses `escapeHtml()` for all text content. Footnote markers are `<button class="fn-marker" data-note="a" data-type="commentary">`.
- `highlightVerse(verseNum)` — adds `.verse-highlight` class and scrolls to verse element `#v{num}`.

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/reader.js && git commit -m "feat: add verse rendering with footnote markers and section headings"
```

---

## Task 9: Notes Sidebar — notes.js

**Files:**
- Create: `scripture/src/notes.js`

- [ ] **Step 1: Create src/notes.js**

Exports:
- `renderNotes($, footnotes, onRefClick)` — builds `.note-card` elements color-coded by type. Cross-ref notes render clickable `.note-ref-link` elements with `data-ref`.
- `highlightNote(key)` — adds `.active` class to `#note-{key}` and scrolls it into view.

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/notes.js && git commit -m "feat: add notes sidebar with typed footnote rendering"
```

---

## Task 10: Search — search.js

**Files:**
- Create: `scripture/src/search.js`

- [ ] **Step 1: Create src/search.js**

Exports:
- `initSearch($, onNavigate)` — wires search button, close button, backdrop click, input listener with 250ms debounce.

Internal:
- `openSearch($)` — shows overlay, focuses input, traps focus
- `closeSearch($)` — hides overlay, restores focus to search button
- `runSearch($, query)` — lazy-loads index on first use, filters with case-insensitive `includes()`, groups results by work, renders with highlighted match snippets (using `<mark>`), max 100 results. Each result has `data-work`, `data-chapter`, `data-verse` attrs; click handler calls `onNavigate`.

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/search.js && git commit -m "feat: add search overlay with on-demand index loading"
```

---

## Task 11: Glossary — glossary.js

**Files:**
- Create: `scripture/src/glossary.js`

- [ ] **Step 1: Create src/glossary.js**

Exports:
- `initGlossary($)` — wires glossary button, close button, backdrop click, filter input with 200ms debounce.

Internal:
- `openGlossary($)` — loads glossaries from all works, deduplicates by ID, sorts alphabetically, renders
- `filterGlossary($, query)` — case-insensitive filter on term and definition
- `renderEntries($, entries)` — builds `.glossary-entry` elements with `.glossary-term` and `.glossary-def`

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/glossary.js && git commit -m "feat: add glossary overlay with filtering"
```

---

## Task 12: Compare Mode — compare.js

**Files:**
- Create: `scripture/src/compare.js`

- [ ] **Step 1: Create src/compare.js**

Exports:
- `initCompare($)` — checks if current work has multiple translations. If not, shows "no other translations available" message. If yes, populates second translation dropdown and sets up scroll sync between reading pane and compare pane.
- `destroyCompare($)` — clears compare pane, removes scroll listeners.

Scroll sync: proportional scroll position mirroring between the two panes, with a guard flag to prevent infinite loops.

- [ ] **Step 2: Commit**

```bash
cd scripture && git add src/compare.js && git commit -m "feat: add compare mode with scroll sync scaffolding"
```

---

## Task 13: Integration Test + Polish

**Files:**
- Modify: any files needing bug fixes

- [ ] **Step 1: Run the full extraction pipeline**

```bash
cd scripture/extract
python3 extract.py ../../scripture/trans-quran-web.pdf --parser quran --output ../data/quran
python3 extract.py ../../scripture/quad_regular_simulated_black_unindexed.pdf --parser bible --output ../data/bible-kjv
python3 extract.py ../../scripture/quad_regular_simulated_black_unindexed.pdf --parser lds --output ../data/lds
python3 search_index.py ../data
```

- [ ] **Step 2: Start local server and test end-to-end**

```bash
cd /Users/a9lim/Work/a9lim.github.io && python3 -m http.server 8080
```

Open `http://localhost:8080/scripture/` and verify:

1. Page loads without console errors
2. Work dropdown shows all three works
3. Selecting a work populates book and chapter dropdowns
4. Chapter content renders with verse numbers and footnote markers
5. Clicking footnote marker highlights corresponding note in sidebar
6. Prev/next chapter navigation works
7. URL hash updates and back button works
8. Theme toggle works
9. Search overlay opens with `/`, finds verses across works
10. Glossary overlay shows Bible Dictionary entries
11. Compare button shows "no other translations" message (expected for now)
12. Mobile viewport: notes sidebar hides, toolbar compresses

- [ ] **Step 3: Fix any issues found during integration testing**

Common issues to watch for:
- Module import paths
- `escapeHtml` global availability (from `shared-utils.js` on `window`)
- CSS variable references
- Hash routing edge cases (empty hash, invalid work/chapter)
- Async operations in event handlers

- [ ] **Step 4: Commit**

```bash
cd scripture
git add -A
git commit -m "feat: complete scripture reader — extraction + frontend integration"
```

---

## Task 14: Add to Root Site Projects List

**Files:**
- Modify: `/Users/a9lim/Work/a9lim.github.io/src/projects.js`

- [ ] **Step 1: Read current projects.js to understand entry format**

Check existing entries for required fields: `href`, `title`, `shortDesc`, `longDesc`, `tags`, `image`, `icon`, `external`.

- [ ] **Step 2: Add Scripture entry to PROJECTS array**

Add entry with:
- `href: '/scripture/'`
- `title: 'Scripture'`
- `shortDesc: 'Read and compare religious scriptures'`
- `longDesc`: brief description of features (verse display, footnotes, search, compare)
- `tags: ['reader', 'text', 'religion']`
- `icon`: inline SVG of a book
- `external: false`

- [ ] **Step 3: Commit**

```bash
cd /Users/a9lim/Work/a9lim.github.io
git add src/projects.js
git commit -m "feat: add Scripture to projects list"
```
