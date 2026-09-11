import { useState, useEffect } from 'react';

interface Verse {
  ID: number;
  Text: string;
}

const PresentationPage = () => {
  const [passage, setPassage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlight, setHighlight] = useState<{ wordIndex: number; verseNum: number } | null>(null);

  useEffect(() => {
    const unsubscribe = (window as any).bibleApi.onPassageUpdate((data: any) => {
      setPassage(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = (window as any).bibleApi.onWordHighlight((data: any) => {
      setHighlight(data);
    });

    return () => unsubscribe();
  }, []);

  const allVerses: Verse[] = passage?.verses || [];

  const renderVerseText = (verseText: string, verseNum: number) => {
    const words = verseText.split(/(\s+)/);
    let wordIndex = 0;

    return (
      <span>
        {words.map((w, i) => {
          if (w.match(/^\s+$/)) {
            return <span key={i}>{w}</span>;
          }

          const isHighlighted = highlight?.verseNum === verseNum && highlight?.wordIndex === wordIndex;
          wordIndex++;

          return (
            <span
              key={i}
              style={{
                backgroundColor: isHighlighted ? 'rgba(255, 224, 102, 0.3)' : undefined,
                cursor: 'pointer',
                userSelect: isHighlighted ? 'text' : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </span>
    );
  };

  const renderCorpus = () => {
    return (
      <div>
        {allVerses.map((verse: Verse) => (
          <p key={verse.ID} style={{
            fontSize: 22,
            lineHeight: 1.7,
            margin: '0 0 8px 0',
            color: '#e6edf3',
          }}>
            <sup style={{
              fontSize: 12,
              color: '#58a6ff',
              fontWeight: 600,
              marginRight: 2,
            }}>{verse.ID}</sup>
            {renderVerseText(verse.Text, verse.ID)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      fontFamily: 'Georgia, serif',
      overflowY: 'auto',
    }}>
      {isLoading ? (
        <div style={{ fontSize: 24, color: '#888' }}>Select a passage in the main window...</div>
      ) : passage ? (
        <div style={{ maxWidth: '900px', width: '100%' }}>
          <h1 style={{
            fontSize: 36,
            marginBottom: 4,
            color: '#e94560',
            fontWeight: 400,
          }}>
            {passage.book} {passage.chapter}
          </h1>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 30, letterSpacing: 2 }}>
            {passage.translation.toUpperCase()}
          </div>
          {renderCorpus()}
        </div>
      ) : (
        <div style={{ color: '#666', fontSize: 18 }}>
          No passage loaded. Select a book, chapter, and verses in the main window, then present.
        </div>
      )}
    </div>
  );
};

export default PresentationPage;
