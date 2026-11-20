import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Loader } from './components/layout/Loader';
import { MobileMenu } from './components/layout/MobileMenu';
import { chapters, type ChapterId } from './content/chapters';
import { Journal, type JournalHandle } from './pages/Journal';
import { Hero } from './sections/Hero';
import { useValley } from './scene/useValley';

type View = 'hero' | 'journal';

const isChapter = (id: string): id is ChapterId => chapters.some((c) => c.id === id);

export default function App() {
  const { introDone, setMode } = useValley();
  const [view, setView] = useState<View>('hero');
  const [activeChapter, setActiveChapter] = useState<ChapterId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const journalRef = useRef<JournalHandle>(null);
  const viewRef = useRef<View>('hero');

  const openChapter = useCallback(
    (id: ChapterId) => {
      const wasOpen = viewRef.current === 'journal';
      viewRef.current = 'journal';
      setView('journal');
      setActiveChapter(id);
      setMenuOpen(false);
      setMode('content');
      history.replaceState(null, '', `#${id}`);
      // Already reading → glide; arriving from the hero → place instantly under the fade.
      requestAnimationFrame(() => journalRef.current?.scrollTo(id, wasOpen));
    },
    [setMode],
  );

  const goHome = useCallback(() => {
    viewRef.current = 'hero';
    setView('hero');
    setMenuOpen(false);
    setMode('explore');
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [setMode]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      const next = !open;
      // The menu dims the valley like content does; restore the right mode on close.
      setMode(next || viewRef.current === 'journal' ? 'content' : 'explore');
      return next;
    });
  }, [setMode]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMode(viewRef.current === 'journal' ? 'content' : 'explore');
  }, [setMode]);

  // Deep link: /#experience opens the journal at that chapter.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (isChapter(id)) openChapter(id);
  }, [openChapter]);

  return (
    <>
      <a
        href="#work"
        onClick={(e) => {
          e.preventDefault();
          openChapter('work');
        }}
        className="sr-only-focusable label fixed left-4 top-4 z-[var(--z-loader)] rounded-pill bg-cream px-4 py-2.5 text-ink"
      >
        Skip to content
      </a>

      <Hero active={view === 'hero' && !menuOpen} onExplore={() => openChapter('work')} />
      <Journal ref={journalRef} open={view === 'journal'} />

      <Header
        visible={introDone}
        view={view}
        activeChapter={activeChapter}
        menuOpen={menuOpen}
        onHome={goHome}
        onChapter={openChapter}
        onToggleMenu={toggleMenu}
      />
      <MobileMenu open={menuOpen} onClose={closeMenu} onHome={goHome} onChapter={openChapter} />

      <Loader />
    </>
  );
}
