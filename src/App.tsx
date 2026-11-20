import { useCallback, useState } from 'react';
import { Loader } from './components/layout/Loader';
import { StudioSheet, SheetSection } from './components/StudioSheet';
import { useValley } from './scene/useValley';

export default function App() {
  const { introDone, soundOn, toggleSound, setMode, startHover, stopHover, status } = useValley();
  const [activeSheet, setActiveSheet] = useState<SheetSection>(null);

  const handleOpenSheet = useCallback(
    (section: Exclude<SheetSection, null>) => {
      setActiveSheet(section);
      setMode('content');
    },
    [setMode],
  );

  const handleCloseSheet = useCallback(() => {
    setActiveSheet(null);
    setMode('explore');
  }, [setMode]);

  const handleGoPointerEnter = useCallback(() => startHover(), [startHover]);
  const handleGoPointerLeave = useCallback(() => {
    if (!activeSheet) stopHover();
  }, [activeSheet, stopHover]);
  const isSoundOn = soundOn;
  const handleToggleSound = toggleSound;

  return (
    <>
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
          {status !== 'fallback' && (
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
          )}
        </div>
      </div>

      <StudioSheet
        section={activeSheet}
        onClose={handleCloseSheet}
        onNavigate={handleOpenSheet}
      />

      <Loader />
    </>
  );
}
