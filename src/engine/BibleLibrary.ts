import type { BibleData, BibleMetadata } from '../types/bible'
import { SearchIndex } from './search'

export class BibleLibrary {
  private bibles = new Map<string, BibleData>()
  private index = new SearchIndex()

  loadBible(bible: BibleData): BibleData {
    if (this.bibles.has(bible.id)) {
      return this.bibles.get(bible.id)!
    }
    this.bibles.set(bible.id, bible)
    this.index.indexBible(bible)
    return bible
  }

  unloadBible(bibleId: string): void {
    this.bibles.delete(bibleId)
    this.index.removeBible(bibleId)
  }

  getBible(bibleId: string): BibleData | undefined {
    return this.bibles.get(bibleId)
  }

  getAllBibles(): Map<string, BibleData> {
    return this.bibles
  }

  getBibleCount(): number {
    return this.bibles.size
  }

  getLoadedBibleIds(): string[] {
    return this.index.getLoadedBibleIds()
  }

  search(query: string) {
    return this.index.search(query)
  }

  searchSimple(query: string): boolean {
    return this.index.searchSimple(query)
  }

  getDocumentCount(): number {
    return this.index.getDocumentCount()
  }
}
