import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Loader } from './components/layout/Loader';
import { MobileMenu } from './components/layout/MobileMenu';
import { chapterById, chapters, HOME_WAYPOINT, type ChapterId } from './content/chapters';
import { projectBySlug, projects } from './content/projects';
import { caseDepth, matchProject, navigate, usePath } from './lib/router';
import { useScrollIntent } from './lib/useScrollIntent';
import { CaseStudy } from './pages/CaseStudy';
import { Journal, type JournalHandle } from './pages/Journal';
import { NotFound } from './pages/NotFound';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { BeyondCode } from './sections/BeyondCode';
import { Contact } from './sections/Contact';
import { Experience } from './sections/Experience';
import { WorkIndex } from './sections/WorkIndex';
import { useValley } from './scene/useValley';

type View = 'hero' | 'journal';

const isChapter = (id: string): id is ChapterId => chapters.some((c) => c.id === id);

/** Each case study gets its own nearby spot in the Work stretch of the valley. */
const projectWaypoint = (slug: string) =>
  chapterById.work.waypoint + Math.max(0, projects.findIndex((p) => p.slug === slug)) * 0.012;


export default function App() {
  const { introDone, setMode, flyTo } = useValley();
  const [heroIntent, setHeroIntent] = useState(0);
  const path = usePath();
  const slug = matchProject(path);
  const project = slug ? (projectBySlug[slug] ?? null) : null;
  const onCase = slug !== null;
  const isUnknownPath = path !== '/' && !slug;

  // A case study deep link behaves as if opened from the journal (Back → work index).
  const initialView: View = matchProject(window.location.pathname) ? 'journal' : 'hero';
  const [view, setView] = useState<View>(initialView);
  const [activeChapter, setActiveChapter] = useState<ChapterId | null>(initialView === 'journal' ? 'work' : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const journalRef = useRef<JournalHandle>(null);
  const viewRef = useRef<View>(initialView);


  /** Camera + engine mode follow the chapter being read; the hash mirrors it (no history spam). */
  const applyChapter = useCallback(
    (id: ChapterId) => {
      setActiveChapter(id);
      flyTo(chapterById[id].waypoint);
      setMode(id === 'contact' ? 'contact' : 'content');
      if (window.location.pathname === '/' && window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    },
    [flyTo, setMode],
  );

  /** Move focus to an element without scrolling (view changes would otherwise drop focus on <body>). */
  // Two frames: the target view must have committed and dropped `inert` before it can take focus.
  const focusSoon = (selector: string) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })),
    );

  const leaveCase = () => {
    if (matchProject(window.location.pathname) || window.location.pathname !== '/') navigate('/');
  };

  const openChapter = useCallback(
    (id: ChapterId) => {
      leaveCase();
      const wasOpen = viewRef.current === 'journal';
      if (!wasOpen) journalRef.current?.reset();
      viewRef.current = 'journal';
      setView('journal');
      setMenuOpen(false);
      applyChapter(id);
      // Already reading → glide; arriving from the hero → place instantly under the fade.
      requestAnimationFrame(() => journalRef.current?.scrollTo(id, wasOpen));
      focusSoon(`#${id}-title`);
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
    leaveCase();
    viewRef.current = 'hero';
    setView('hero');
    setMenuOpen(false);
    setActiveChapter(null);
    setMode('explore');
    flyTo(HOME_WAYPOINT);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    focusSoon('#hero-title');
  }, [setMode, flyTo]);

  // Entering / leaving a case study: camera + mode follow; back on the journal, re-apply its chapter.
  const activeRef = useRef(activeChapter);
  activeRef.current = activeChapter;
  const lastSlug = useRef<string | null>(null);
  useEffect(() => {
    // Only case studies and 404s here — everything on "/" is owned by the location sync below,
    // so the two can never race (React may render this before the popstate listener runs).
    if (slug) {
      lastSlug.current = slug;
      setActiveChapter('work');
      setMode('content');
      flyTo(projectWaypoint(slug));
    } else if (path !== '/') {
      setMode('content'); // 404 over a calm valley
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, path]);

  const journalBodies = useMemo(
    () => ({
      work: <WorkIndex />,
      experience: <Experience />,
      about: <About />,
      beyond: <BeyondCode />,
      contact: <Contact onHome={() => navRef.current.goHome()} />,
    }),
    [],
  );

  const backToWork = useCallback(() => {
    const depth = caseDepth();
    // Opened in-app: step back to the journal entry exactly where the reader left it.
    if (depth > 0) history.go(-depth);
    else navRef.current.openChapter('work'); // deep link: no journal entry behind us
  }, []);

  // Hero: a sustained scroll/swipe down (while the wheel is also flying the camera) enters the work.
  useScrollIntent({
    enabled: view === 'hero' && !onCase && !isUnknownPath && !menuOpen && introDone,
    direction: 'down',
    threshold: 1500,
    onProgress: setHeroIntent,
    onTrigger: () => openChapter('work'),
  });

  // Hero keyboard: the keys that would scroll a normal page enter the journal instead.
  useEffect(() => {
    if (view !== 'hero' || onCase || isUnknownPath || menuOpen) return;
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
  }, [view, onCase, isUnknownPath, menuOpen, openChapter]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      const next = !open;
      // The menu dims the valley like content does; restore the right mode on close.
      setMode(next || viewRef.current === 'journal' || matchProject(window.location.pathname) ? 'content' : 'explore');
      return next;
    });
  }, [setMode]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMode(viewRef.current === 'journal' || matchProject(window.location.pathname) ? 'content' : 'explore');
  }, [setMode]);

  /**
   * The URL is the source of truth for which view is showing. Runs on load, popstate
   * (Back/Forward) and hashchange (typed hashes). Our own replaceState calls fire neither.
   *   /work/:slug   → case study (journal behind it, so Back/"All work" returns there)
   *   /#chapter     → journal at that chapter — without re-scrolling if it is already the one open
   *   /             → hero, explore mode
   *   anything else → 404
   * Installed once; callbacks are read through a ref because their identity changes with
   * provider state (a re-run would jump the reader).
   * useLayoutEffect, not useEffect: the router's popstate subscriber (useSyncExternalStore)
   * registers in a passive effect, so registering here first means this listener runs before
   * React re-renders for the new URL — otherwise the journal briefly reopens with a stale view
   * and its scroll tracker rewrites the hash.
   */
  const navRef = useRef({ openChapter, goHome, applyChapter, setMode });
  navRef.current = { openChapter, goHome, applyChapter, setMode };
  useLayoutEffect(() => {
    const sync = () => {
      const nav = navRef.current;
      const { pathname, hash } = window.location;
      setMenuOpen(false);
      if (matchProject(pathname)) {
        if (viewRef.current !== 'journal') {
          viewRef.current = 'journal';
          setView('journal');
        }
        return; // the slug effect sets mode + camera
      }
      if (pathname !== '/') return; // 404 — slug effect sets mode
      const id = hash.slice(1);
      if (isChapter(id)) {
        if (viewRef.current === 'journal' && activeRef.current === id) {
          nav.applyChapter(id); // keep the reader's scroll position
          // Back from a case study: return focus to the row that opened it.
          if (lastSlug.current) {
            focusSoon(`#main a[href="/work/${lastSlug.current}"]`);
            lastSlug.current = null;
          }
        } else nav.openChapter(id);
      } else if (viewRef.current !== 'hero') {
        nav.goHome();
      } else {
        nav.setMode('explore');
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  /** Skip link: jump to the current view's content rather than always opening Work. */
  const skipToContent = () => {
    if (onCase) focusSoon('#cs-title');
    else if (view === 'journal') focusSoon(`#${activeRef.current ?? 'work'}-title`);
    else openChapter('work');
  };

  return (
    <>
      <a
        href="#work"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
        className="sr-only-focusable label fixed left-4 top-4 z-[var(--z-loader)] rounded-pill bg-cream px-4 py-2.5 text-ink"
      >
        Skip to content
      </a>

      <Hero active={view === 'hero' && !onCase && !isUnknownPath && !menuOpen} intent={heroIntent} onExplore={() => openChapter('work')} />
      <Journal
        ref={journalRef}
        open={view === 'journal' && !onCase && !isUnknownPath}
        onActiveChange={onActiveChange}
        onReturnHome={goHome}
        bodies={journalBodies}
      />
      {project && <CaseStudy key={project.slug} project={project} onBack={backToWork} />}
      {((slug && !project) || isUnknownPath) && <NotFound onHome={goHome} onWork={() => openChapter('work')} />}

      <Header
        visible={introDone}
        view={onCase || view === 'journal' ? 'journal' : 'hero'}
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
