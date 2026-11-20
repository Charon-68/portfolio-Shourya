import { createRoot } from 'react-dom/client';
import '../fonts';
import './specimen.css';
import { Specimen } from './Specimen';

createRoot(document.getElementById('root')!).render(<Specimen />);
