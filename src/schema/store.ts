import type { BibleInfo, PassageResult, PresentationSlide } from '@app-types';

export interface AppStore {
  translations: BibleInfo[];
  selectedTranslation: string | null;
  selectedBook: string | null;
  selectedChapter: number | null;
  selectedVerseRange: [number, number] | null;
  currentPassage: PassageResult | null;
  isLoading: boolean;
  error: string | null;
}

export interface PresentationWindowState {
  isVisible: boolean;
  url: string;
  currentSlide: number;
  slides: PresentationSlide[];
}
