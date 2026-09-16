# Codebase Cleanup Plan

Generated: 2026-09-16

## Overview

Theomelios has clean engine-level separation but several structural issues in the UI layer and coupling between engine and presentation concerns.

---

## P0 — Quick Wins (Dead Code & Bugs)

- ~~**1. Remove unused code**~~ ✅ Resolved — removed `bookAbbrReverse` from `src/constants/books.ts`, removed `SelectorState` from `src/types/bible.ts`
  - ~~`bookAbbrReverse`~~ `src/constants/books.ts:33` — removed (was never used)
  - ~~`SelectorState`~~ `src/types/bible.ts:108` — removed (never imported anywhere)
  - ~~`bookCategoryMap` import in App~~ — NOT dead (used at line 511 for styling, kept)
  - ~~`bookNameToAbbr` import in App~~ — NOT dead (used at line 252 for search results, kept)
  - ~~`setForceLiveDragUpdate`~~ — NOT dead (used as re-render trigger at lines 633, 663, kept)
  - ~~Dead ESLint disable comment~~ — NOT dead (corresponding state is live, kept)

- ~~**2. Fix bug in `getVersesForChapter`**~~ ✅ Resolved — `src/engine/BibleLibrary.ts` line 124: removed redundant `bible.testaments.flatMap(...).find(...)` book lookup inside the verse loop. Now reuses `b` from the outer loop (line 119).

- ~~**Remove duplicate stop words**~~ ✅ Resolved — `src/engine/search.ts`: removed duplicates `he` (appeared twice), `on` (appeared twice), `all` (appeared twice) from `STOP_WORDS` Set.

- ~~**Add unit test for `getVersesForChapter`**~~ ✅ Resolved — added 8 new tests in `src/engine/search.test.ts` under `BibleLibrary getVersesForChapter - engine level` describe block. Tests verify book name correctness, empty arrays for non-existent book/chapter, verse ID ordering, and verse text content.

---

## P1 — Structural Improvements

### 3. Move UI types out of domain layer

`src/types/bible.ts` currently contains both domain types and UI types mixed together:

**Domain types (stay):**
`VerseEntry`, `ChapterData`, `BookData`, `TestamentData`, `BibleMetadata`, `BibleData`, `SearchResult`, `SearchDocument`, `VerseKey`

**UI types (move to `src/components/types.ts` or inline in App):**
`SelectorBook`, `SelectorChapter`, `SelectorVerse`, `ChapterRangeSelection`, `SelectorState`, `VerseRange`

These types are only consumed by the React component layer and don't belong in the shared domain model. This breaks the coupling where the engine returns UI-specific structures.

### 4. Add indexes to BibleLibrary

`BibleLibrary` performs linear scans where O(1) lookups are possible:

| Method | Current | Fix |
|--------|---------|-----|
| `getSelectorBible` | Rebuilds entire books tree on call | Build once on `loadBible()`, cache and return |
| `findVerseByRef` | Traverses all testaments/books/chapters | Build a `Map<key, VerseEntry>` during indexing |
| `getVersesForChapter` | Traverses all testaments/books | O(1) lookup via keyed index |
| `findBookIndex` | Linear `findIndex` on books array | O(1) map: `Map<abbr, index>` |

Implement a lightweight in-memory index keyed by `bibleId|testamentId|bookId|chapterId|verseId` for O(1) verse lookup by reference.

### 5. Consolidate selection state

`App.tsx` maintains two representations of the same selection state:

- `selectedVerses` — `Set<string>` of `"book|chapter|verse"` keys (line 84)
- `verseRangeSelections` — `Map<"book|chapter", [start, end][]>` (line 88)

A `useEffect` (line 127) bridges them by expanding ranges into keys. This is two sources of truth.

**Recommended approach**: Keep `verseRangeSelections` as the source of truth (it supports the drag selection model) and derive `selectedVerses` via a `useMemo`. Remove the `useEffect` bridge and the `selectedVerses` state:

```typescript
const selectedVerses = useMemo(() => {
  const keys = new Set<string>()
  for (const [key, ranges] of verseRangeSelections) {
    const [book, chapter] = key.split('|')
    for (const [start, end] of ranges) {
      for (let v = start; v <= end; v++) {
        keys.add(`${book}|${chapter}|${v}`)
      }
    }
  }
  return keys
}, [verseRangeSelections])
```

---

## P2 — Architectural Improvements

### 6. Split App.tsx (986 lines) into composable components

Violates AGENTS.MD: "keep components small and composable" and "avoid redundancy."

**Proposed components:**

| Component | Responsibility |
|-----------|---------------|
| `SearchBar` | Query input, mode toggle, search form |
| `FileUploader` | File input, loading state, demo button |
| `BibleSelector` | Bible dropdown, loaded count display |
| `BooksPane` | Book buttons grouped by category |
| `ChaptersPane` | Chapter buttons |
| `VersesPane` | Verse list with drag selection |
| `ResultsPane` | Selected verses or search results |
| `App` | Wiring, state management, layout |

The `search` handler (lines 192-281) is 90 lines and handles three cases (reference, book name, text search) plus result flattening — it belongs in a custom hook (`useSearch`) or in the engine itself.

### 7. Move search logic to engine or custom hook

The search handler duplicates logic that the engine could provide:
- Reference parsing → already in `constants/books.ts`
- Book lookup → already in `BibleLibrary`
- Bible fetching → already in `BibleLibrary`
- Result flattening → not in engine

**Option A (engine):** Add `BibleLibrary.searchByReference(bibleId, book, chapter, verse)` that navigates to a verse and returns it.
**Option B (hook):** Extract `useSearch` hook that encapsulates the reference-parsing → navigation flow.

### 8. Fix minor code quality issues

| Issue | Location |
|-------|----------|
| Duplicate stop words: `'all'` and `'on'` | `src/engine/search.ts:5,12` — appears twice in `STOP_WORDS` |
| Demo loader fetches nonexistent path | `src/components/App.tsx:358` — `./data/bible.json` does not exist in repo |

---

## Estimated Effort

| Priority | Count | Effort |
|----------|-------|--------|
| P0 | 2 items | ~30 min |
| P1 | 3 items | ~2-3 hours |
| P2 | 3 items | ~4-6 hours |

## Order of Operations

1. **P0** — Remove dead code, fix the bug. No risk, immediate benefit.
2. **Run tests** — Verify nothing regressed.
3. **P1** — Restructure types, add indexes, consolidate state. Breaking changes to component layer but no engine changes.
4. **Run tests** again.
5. **P2** — Component split and engine method additions. Incremental — each component can be extracted in isolation.
6. **Run tests and lint** on completion.
