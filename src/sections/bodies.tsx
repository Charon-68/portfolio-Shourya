/**
 * All journal chapter bodies in one lazily-loaded chunk. The hero never needs them, so they
 * load only when the journal first opens (and are prefetched once the valley is ready).
 */
import { useEffect } from 'react';
import type { ChapterId } from '@/content/chapters';
import { About } from './About';
import { BeyondCode } from './BeyondCode';
import { Contact } from './Contact';
import { Experience } from './Experience';
import { WorkIndex } from './WorkIndex';

type Props = { chapter: ChapterId; onHome: () => void; onReady?: () => void };

export default function ChapterBody({ chapter, onHome, onReady }: Props) {
  // Mounted ⇒ layout above the reader may have changed; let the journal re-apply its scroll target.
  useEffect(() => {
    onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  switch (chapter) {
    case 'work':
      return <WorkIndex />;
    case 'experience':
      return <Experience />;
    case 'about':
      return <About />;
    case 'beyond':
      return <BeyondCode />;
    case 'contact':
      return <Contact onHome={onHome} />;
  }
}
