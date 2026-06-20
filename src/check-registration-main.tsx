import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PublicCheckRegistration from './views/PublicCheckRegistration';
import './index.css';

function StandaloneCheckRegistration() {
  const handleNavigate = (view: string) => {
    // Redirect standalone page to main dashboard if they try to navigate out
    window.location.href = `/?view=${view}`;
  };

  return (
    <div className="min-h-screen bg-slate-955 py-6">
      <PublicCheckRegistration onNavigate={handleNavigate} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandaloneCheckRegistration />
  </StrictMode>,
);
