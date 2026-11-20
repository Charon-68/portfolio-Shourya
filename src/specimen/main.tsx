import { createRoot } from 'react-dom/client';
import '../fonts';
import './specimen.css';
import { ValleyProvider } from '@/scene/ValleyProvider';
import { Specimen } from './Specimen';

createRoot(document.getElementById('root')!).render(
  <ValleyProvider>
    <Specimen />
  </ValleyProvider>,
);
