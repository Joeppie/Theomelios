declare global {
  interface Window {
    bibleApi: {
      listTranslations(): Promise<string[]>;
      getTranslationInfo(translationFile: string): Promise<{
        abbreviation: string;
        name: string;
        books: Array<{
          abbreviation: string;
          name: string;
          testament: 'OT' | 'NT';
          chapterCount: number;
        }>;
      } | null>;
      getVerses(request: {
        book: string;
        chapter: number;
        verses?: [number, number] | number;
        translationFile: string;
      }): Promise<{
        book: string;
        chapter: number;
        verses: Array<{ ID?: number; Text: string }>;
        translation: string;
        bookAbbreviation: string;
        testament: 'OT' | 'NT';
      } | null>;
      openPresentationWindow(): Promise<boolean>;
      closePresentationWindow(): Promise<void>;
      onPassageUpdate(callback: (data: any) => void): () => void;
      onPresentationNavigate(callback: (direction: 'next' | 'prev') => void): () => void;
      onWindowClosed(callback: () => void): () => void;
    };
  }
}

export {};
