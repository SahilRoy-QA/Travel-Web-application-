import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0b1120; color: #fff; font-family: sans-serif; padding: 24px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Initialization Notice</h2>
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;">The application encountered an unexpected startup state.</p>
        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">
          Reset & Reload
        </button>
      </div>
    `;
  }
}
