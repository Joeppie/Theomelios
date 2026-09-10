import { useState, useEffect } from 'react';

const PresentationPage = () => {
  const [passage, setPassage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = (window as any).bibleApi.onPassageUpdate((data: any) => {
      setPassage(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      fontFamily: 'Georgia, serif',
    }}>
      {isLoading ? (
        <div style={{ fontSize: 24, color: '#888' }}>Select a passage in the main window...</div>
      ) : passage ? (
        <div style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 48,
            marginBottom: 20,
            color: '#e94560',
          }}>
            {passage.book} {passage.chapter}
          </h1>
          <div style={{ fontSize: 16, color: '#888', marginBottom: 40, letterSpacing: 2 }}>
            {passage.translation.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.8, maxWidth: '700px', margin: '0 auto' }}>
            {passage.verses.map((v: { ID?: number; Text: string }) => (
              <span key={v.ID} style={{ display: 'inline' }}>
                <sup style={{ color: '#e94560', fontSize: 18 }}>{v.ID}</sup>{' '}
                {v.Text}{' '}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ color: '#666', fontSize: 18 }}>
          No passage loaded. Select a book, chapter, and translation in the main window, then click "Open Presentation".
        </div>
      )}
    </div>
  );
};

export default PresentationPage;
