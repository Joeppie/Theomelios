import type { PassageResult, BibleInfo, PassageRequest } from '@app-types';

export interface IpcApi {
  // Bible operations
  listTranslations(): Promise<string[]>;
  getTranslationInfo(translationAbbrev: string): Promise<BibleInfo | null>;
  getVerses(request: PassageRequest): Promise<PassageResult | null>;

  // Window operations
  openPresentationWindow(): Promise<void>;
  closePresentationWindow(): Promise<void>;

  // Presentation operations
  openPresentationUrl(url: string): Promise<void>;
  navigatePresentation(direction: 'next' | 'prev' | 'first' | 'last'): Promise<void>;
}

export interface IpcRendererExposed {
  invoke<K extends keyof IpcApi>(channel: K, ...args: Parameters<IpcApi[K]>): Promise<ReturnType<IpcApi[K]>>;
  on<K extends keyof IpcListenerMap>(channel: K, listener: IpcListenerMap[K]): () => void;
}

export interface IpcListenerMap {
  'passage:update': (data: PassageResult) => void;
  'presentation:navigate': (direction: 'next' | 'prev') => void;
  'window:closed': () => void;
}
