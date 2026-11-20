import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './fonts';
import './index.css';
import { ValleyProvider } from './scene/ValleyProvider';

createRoot(document.getElementById('root')!).render(
  <ValleyProvider>
    <App />
  </ValleyProvider>,
);
