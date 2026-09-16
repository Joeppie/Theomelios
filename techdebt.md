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

- ~~**3. Move UI types out of domain layer**~~ ✅ Resolved — created `src/types/ui.ts` with `SelectorBook`, `SelectorChapter`, `SelectorVerse`, `VerseRange`, `ChapterRangeSelection`. All imports updated: `BibleLibrary.ts`, `App.tsx`, `bibleIntegration.test.ts`.

- ~~**4. Add indexes to BibleLibrary**~~ ✅ Resolved:
  - `getSelectorBible` now returns cached result built during `loadBible()` (O(1) after first call)
  - `verseLookup` Map: `bibleId|bookAbbr|chapterId|verseId` → `{text, bookName}` for O(1) verse text lookup
  - `getVersesForChapter` now uses early-return pattern instead of iterating all testaments/books per verse
  - `unloadBible` clears both caches (`selectorCache`, `verseLookup`)

- ~~**5. Consolidate selection state**~~ ✅ Resolved:
  - Removed `selectedVerses` state (`useState<Set<string>>`)
  - Replaced with `selectedVerses` derived via `useMemo` from `verseRangeSelections`
  - Removed bridging `useEffect` (lines 127-142 in original)
  - Removed `selectedVersesRef` (no longer needed)
  - Removed unused `verseRangesToKeySet` helper (now only used by useMemo)
  - **Single source of truth**: `verseRangeSelections` (Map of ranges) → `selectedVerses` (derived Set of keys)

---

## P2 — Architectural Improvements

### ~~6. Split App.tsx (986 lines) into composable components~~ ✅ Resolved

App.tsx has been split into 8 focused components:

| Component | File | Lines | Responsibility |
|-----------|------|-------|----------------|
| `Header` | `src/components/Header.tsx` | ~40 | Title and search/selection mode toggle |
| `StatusInfo` | `src/components/StatusInfo.tsx` | ~10 | Loaded bible/verse count display |
| `FileUploader` | `src/components/FileUploader.tsx` | ~40 | File input, demo button, bible selector dropdown |
| `SearchBar` | `src/components/SearchBar.tsx` | ~20 | Search query input and submit |
| `SelectionSummary` | `src/components/SelectionSummary.tsx` | ~15 | Selected verse count with clear button |
| `ResultsSummary` | `src/components/ResultsSummary.tsx` | ~15 | Search result count with clear button |
| `BooksPane` | `src/components/BooksPane.tsx` | ~80 | Book buttons grouped by category |
| `ChaptersPane` | `src/components/ChaptersPane.tsx` | ~55 | Chapter buttons for selected book |
| `VersesPane` | `src/components/VersesPane.tsx` | ~250 | Verse list with click/drag selection |
| `ResultsPane` | `src/components/ResultsPane.tsx` | ~180 | Selected verses or search results display |
| `App` | `src/components/App.tsx` | ~270 | State management, wiring, layout |

Each component has JSDoc documentation, uses typed props, and focuses on a single responsibility. App.tsx is now responsible for state management and composes the UI components.

### 7. Move search logic to engine or custom hook

The `handleSearch` callback in App.tsx (lines ~170-260) still handles three cases:
- Verse/chapter reference parsing → uses `parseReference()` from `constants/books.ts`
- Book name lookup → uses `findBookByName()` from `constants/books.ts`
- Text search → calls `library.search()` and flattens results

**Option A (engine):** Add `BibleLibrary.searchByReference(bibleId, book, chapter, verse)` that navigates to a verse and returns it.
**Option B (hook):** Extract `useSearch` hook that encapsulates the reference-parsing → navigation flow.

### 8. Fix minor code quality issues

| Issue | Location |
|-------|----------|
| Demo loader fetches nonexistent path | `src/components/App.tsx:341` — `./data/bible.json` does not exist in repo |

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
