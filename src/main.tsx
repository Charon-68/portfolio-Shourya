import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './fonts';
import './index.css';
import { ValleyProvider } from './scene/ValleyProvider';

// QA switch: `?motion=reduced` forces prefers-reduced-motion for every consumer (Motion, the
// engine, our hooks) — browsers can't set the OS preference per tab. Must run before anything
// reads matchMedia.
if (new URLSearchParams(window.location.search).get('motion') === 'reduced') {
  const native = window.matchMedia.bind(window);
  window.matchMedia = (query: string) => {
    if (!query.includes('prefers-reduced-motion')) return native(query);
    // A complete stand-in: Motion calls addListener on it, so every method must exist and not throw.
    const noop = () => {};
    return {
      matches: !query.includes('no-preference'),
      media: query,
      onchange: null,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
  document.documentElement.dataset.motion = 'reduced';
}

createRoot(document.getElementById('root')!).render(
  <ValleyProvider>
    <App />
  </ValleyProvider>,
);
