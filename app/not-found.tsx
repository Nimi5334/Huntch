/* eslint-disable @next/next/no-html-link-for-pages */
export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>404</h1>
      <p>הדף לא נמצא</p>
      <a href="/" style={{ color: '#2e6b46', textDecoration: 'none' }}>חזרה לדף הבית</a>
    </div>
  );
}
