import { SearchIndex } from './search';
export class BibleLibrary {
    bibles = new Map();
    index = new SearchIndex();
    loadBible(bible) {
        if (this.bibles.has(bible.id)) {
            return this.bibles.get(bible.id);
        }
        this.bibles.set(bible.id, bible);
        this.index.indexBible(bible);
        return bible;
    }
    unloadBible(bibleId) {
        this.bibles.delete(bibleId);
        this.index.removeBible(bibleId);
    }
    getBible(bibleId) {
        return this.bibles.get(bibleId);
    }
    getAllBibles() {
        return this.bibles;
    }
    getBibleCount() {
        return this.bibles.size;
    }
    getLoadedBibleIds() {
        return this.index.getLoadedBibleIds();
    }
    search(query) {
        return this.index.search(query);
    }
    searchSimple(query) {
        return this.index.searchSimple(query);
    }
    getDocumentCount() {
        return this.index.getDocumentCount();
    }
}
