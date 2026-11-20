import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Loader } from './components/layout/Loader';
import { MobileMenu } from './components/layout/MobileMenu';
import { chapterById, chapters, HOME_WAYPOINT, type ChapterId } from './content/chapters';
import { useScrollIntent } from './lib/useScrollIntent';
import { Journal, type JournalHandle } from './pages/Journal';
import { Hero } from './sections/Hero';
import { useValley } from './scene/useValley';

type View = 'hero' | 'journal';

const isChapter = (id: string): id is ChapterId => chapters.some((c) => c.id === id);

export default function App() {
  const { introDone, setMode, flyTo } = useValley();
  const [heroIntent, setHeroIntent] = useState(0);
  const [view, setView] = useState<View>('hero');
  const [activeChapter, setActiveChapter] = useState<ChapterId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const journalRef = useRef<JournalHandle>(null);
  const viewRef = useRef<View>('hero');

  /** Camera + engine mode follow the chapter being read; the hash mirrors it (no history spam). */
  const applyChapter = useCallback(
    (id: ChapterId) => {
      setActiveChapter(id);
      flyTo(chapterById[id].waypoint);
      setMode(id === 'contact' ? 'contact' : 'content');
      if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    },
    [flyTo, setMode],
  );

  const openChapter = useCallback(
    (id: ChapterId) => {
      const wasOpen = viewRef.current === 'journal';
      if (!wasOpen) journalRef.current?.reset();
      viewRef.current = 'journal';
      setView('journal');
      setMenuOpen(false);
      applyChapter(id);
      // Already reading → glide; arriving from the hero → place instantly under the fade.
      requestAnimationFrame(() => journalRef.current?.scrollTo(id, wasOpen));
    },
    [applyChapter],
  );

  const onActiveChange = useCallback(
    (id: ChapterId) => {
      if (viewRef.current === 'journal') applyChapter(id);
    },
    [applyChapter],
  );

  const goHome = useCallback(() => {
    viewRef.current = 'hero';
    setView('hero');
    setMenuOpen(false);
    setActiveChapter(null);
    setMode('explore');
    flyTo(HOME_WAYPOINT);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [setMode, flyTo]);

  // Hero: a sustained scroll/swipe down (while the wheel is also flying the camera) enters the work.
  useScrollIntent({
    enabled: view === 'hero' && !menuOpen && introDone,
    direction: 'down',
    threshold: 1500,
    onProgress: setHeroIntent,
    onTrigger: () => openChapter('work'),
  });

  // Hero keyboard: the keys that would scroll a normal page enter the journal instead.
  useEffect(() => {
    if (view !== 'hero' || menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.isContentEditable)) {
        if (e.key === ' ') return; // Space activates focused controls
      }
      if (e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        openChapter('work');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, menuOpen, openChapter]);

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

  // Deep links: /#experience opens the journal at that chapter — on load, and on same-document
  // hash changes (typed URL, back/forward). Our own replaceState calls don't fire hashchange.
  // Callbacks change identity when provider state changes (progress, sound…); read them via a
  // ref so this listener is installed once and never re-runs a sync that would jump the reader.
  const navRef = useRef({ openChapter, goHome });
  navRef.current = { openChapter, goHome };
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1);
      if (isChapter(id)) navRef.current.openChapter(id);
      else if (!id && viewRef.current === 'journal') navRef.current.goHome();
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

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

      <Hero active={view === 'hero' && !menuOpen} intent={heroIntent} onExplore={() => openChapter('work')} />
      <Journal ref={journalRef} open={view === 'journal'} onActiveChange={onActiveChange} onReturnHome={goHome} />

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
