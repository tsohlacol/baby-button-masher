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
// Double requestAnimationFrame ensures the signal fires only after the browser
// has committed the first frame to the GPU, eliminating the black flash caused
// by signalling before the compositor has rasterized React's initial render.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.postMessage('tsd:ready');
    }
  });
});
