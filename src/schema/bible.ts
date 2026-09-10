export interface BibleVerse {
  ID?: number;
  Text: string;
}

export interface BibleChapter {
  Verses: BibleVerse[];
}

export interface BibleBook {
  Abbreviation: string;
  Chapters: BibleChapter[];
}

export interface BibleTestament {
  Books: BibleBook[];
  Text: string;
}

export interface BibleData {
  Abbreviation: string;
  Language: string;
  Publisher: string;
  Copyright: string;
  Introduction: string;
  VersionDate: string;
  IsCompressed: number;
  IsProtected: number;
  UseCurrentLanguage: number;
  Guid: string;
  Testaments: BibleTestament[];
  Text: string;
}

export interface BookSummary {
  abbreviation: string;
  name: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
}

export interface BibleInfo {
  abbreviation: string;
  name: string;
  books: BookSummary[];
}

export interface PassageRequest {
  book: string;
  chapter: number;
  verses?: [number, number] | number;
  translation: string;
}

export interface PassageResult {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  translation: string;
  bookAbbreviation: string;
  testament: 'OT' | 'NT';
}

export interface PresentationSlide {
  type: 'verse' | 'chapter' | 'passage';
  book: string;
  chapter: number;
  verses?: [number, number] | number;
  translation: string;
  title?: string;
}
