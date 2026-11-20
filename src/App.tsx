import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StudioSheet, SheetSection } from './components/StudioSheet';
import { ValleyEngine } from './engine/ValleyEngine';

export default function App() {
  const valleyRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ValleyEngine | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetSection>(null);

  useEffect(() => {
    const container = valleyRef.current;
    if (!container) return;

    let introNotified = false;
    const engine = new ValleyEngine(
      container,
      () => {
        setLoaded(true);
      },
      () => {
        if (!introNotified) {
          introNotified = true;
          setIntroDone(true);
        }
      },
    );

    engine.audioStore.initAudio();
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    const store = engineRef.current?.audioStore;
    if (!store || !store.isInitialized) return;
    const muted = store.toggleMute();
    setIsSoundOn(!muted);
  }, []);

  const handleOpenSheet = useCallback((section: Exclude<SheetSection, null>) => {
    setActiveSheet(section);
    engineRef.current?.startHoverTransition();
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveSheet(null);
    engineRef.current?.stopHoverTransition();
  }, []);

  const handleGoPointerEnter = useCallback(() => {
    engineRef.current?.startHoverTransition();
  }, []);

  const handleGoPointerLeave = useCallback(() => {
    if (!activeSheet) {
      engineRef.current?.stopHoverTransition();
    }
  }, [activeSheet]);

  return (
    <>
      <div id="valley" ref={valleyRef} aria-hidden="true">
        <div className="js-canvas-container" />
      </div>

      <div className={`ui ${introDone ? 'on' : ''}`} id="ui">
        <header className="fh-header">
          <a
            className="logo"
            href="#home"
            aria-label="Fernhollow"
            onClick={(e) => {
              e.preventDefault();
              handleCloseSheet();
            }}
          >
            Fernhollow
          </a>

          <nav className="fh-nav" aria-label="Main">
            <a
              className="nav-link"
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                handleOpenSheet('work');
              }}
            >
              Work
            </a>
            <a
              className="nav-link"
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                handleOpenSheet('about');
              }}
            >
              About
            </a>
            <a
              className="nav-link"
              href="#journal"
              onClick={(e) => {
                e.preventDefault();
                handleOpenSheet('journal');
              }}
            >
              Journal
            </a>
            <a
              className="pill"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                handleOpenSheet('contact');
              }}
            >
              Let’s talk
            </a>
          </nav>
        </header>

        <section className={`hero ${activeSheet ? 'dimmed' : ''}`}>
          <h1>Shourya Saxena</h1>
          <p className="cap">
            Rooted in nature.
            <br />
            Built for what’s next.
          </p>
          <a
            className="go"
            href="#work"
            id="go"
            aria-label="See our work"
            onPointerEnter={handleGoPointerEnter}
            onPointerLeave={handleGoPointerLeave}
            onClick={(e) => {
              e.preventDefault();
              handleOpenSheet('work');
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </a>
        </section>

        <div className="corner">
          <span>Scroll to wander</span>
          <i />
          <button
            type="button"
            className="sound"
            id="sound"
            aria-pressed={isSoundOn}
            aria-label="Ambient sound"
            onClick={handleToggleSound}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path
                className="w"
                d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
              />
              <path className="x" d="m16 10 4 4m0-4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      <StudioSheet
        section={activeSheet}
        onClose={handleCloseSheet}
        onNavigate={handleOpenSheet}
      />

      <div className={`loader ${loaded ? 'gone' : ''}`} id="loader">
        <span />
      </div>
    </>
  );
}
