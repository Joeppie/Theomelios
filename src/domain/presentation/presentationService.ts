import type { PresentationSlide } from '../../schema/bible';

export class PresentationService {
  private slides: PresentationSlide[] = [];
  private currentSlideIndex = 0;

  getSlides(): PresentationSlide[] {
    return [...this.slides];
  }

  getCurrentSlide(): PresentationSlide | undefined {
    return this.slides[this.currentSlideIndex];
  }

  getCurrentIndex(): number {
    return this.currentSlideIndex;
  }

  addSlides(slides: PresentationSlide[]): void {
    this.slides.push(...slides);
  }

  clear(): void {
    this.slides = [];
    this.currentSlideIndex = 0;
  }

  navigate(direction: 'next' | 'prev' | 'first' | 'last'): number {
    switch (direction) {
      case 'first':
        this.currentSlideIndex = 0;
        break;
      case 'last':
        this.currentSlideIndex = this.slides.length - 1;
        break;
      case 'next':
        this.currentSlideIndex = Math.min(this.currentSlideIndex + 1, this.slides.length - 1);
        break;
      case 'prev':
        this.currentSlideIndex = Math.max(this.currentSlideIndex - 1, 0);
        break;
    }
    return this.currentSlideIndex;
  }
}
