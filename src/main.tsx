/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Signal the WPF host that React has painted and the splash can fade out.
// setTimeout(0) schedules a macrotask, which the browser only runs after the
// current paint cycle finishes — so the splash never drops before the first frame.
setTimeout(() => {
  if ((window as any).chrome?.webview) {
    (window as any).chrome.webview.postMessage('tsd:ready');
  }
}, 0);
