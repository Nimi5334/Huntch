'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>שגיאה</h1>
        <button onClick={reset} style={{ marginTop: '1rem', cursor: 'pointer' }}>נסה שוב</button>
      </body>
    </html>
  );
}
