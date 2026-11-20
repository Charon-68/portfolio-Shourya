/**
 * Diagram primitives for project "plates": thin cream line-art system diagrams.
 *
 * Language (see docs/DESIGN-SYSTEM.md §Diagrams):
 *  - Nodes: 1px hairline rectangles, mono label + optional sub-label. Sharp corners.
 *  - Edges: 1px lines with small open arrowheads; draw on when the figure enters view.
 *  - Accent (pollen): the path Shourya built / the critical path. Use sparingly.
 *  - Muted: external systems or inputs. Groups: dashed boundary with a corner label.
 *  - Coordinates are in viewBox units; author at width 960. Text is 13 units.
 */
import { motion, useInView, useReducedMotion } from 'motion/react';
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { ease } from '@/lib/motion';

type Tone = 'default' | 'accent' | 'muted';

const DiagramCtx = createContext<{ drawn: boolean; reduce: boolean; markerId: string }>({
  drawn: true,
  reduce: true,
  markerId: '',
});

const stroke: Record<Tone, string> = {
  default: 'var(--ink-2)',
  accent: 'var(--color-pollen)',
  muted: 'var(--ink-4)',
};

const STEP = 0.14; // seconds between draw-order steps

type DiagramProps = {
  /** viewBox width/height. */
  width?: number;
  height: number;
  /** Accessible summary of what the diagram shows (required: diagrams carry real content). */
  label: string;
  children: ReactNode;
  className?: string;
  /** Below this CSS width the diagram scrolls horizontally instead of shrinking text illegibly. */
  minWidth?: number;
};

export function Diagram({ width = 960, height, label, children, className, minWidth = 640 }: DiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = !!useReducedMotion();
  const markerId = useId().replace(/:/g, '');
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOverflows(el.scrollWidth > el.clientWidth + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cx('relative -mx-1 overflow-x-auto px-1 [scrollbar-width:thin]', className)}
      // Scrollable regions must be keyboard-reachable (arrow keys scroll once focused).
      {...(overflows ? { tabIndex: 0, role: 'region', 'aria-label': 'Diagram, scrollable' } : {})}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        style={{ minWidth }}
        className="h-auto w-full overflow-visible font-mono"
      >
        <defs>
          {(['default', 'accent', 'muted'] as Tone[]).map((t) => (
            <marker
              key={t}
              id={`${markerId}-${t}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M1 1.5 9 5 1 8.5" fill="none" stroke={stroke[t]} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          ))}
        </defs>
        <DiagramCtx.Provider value={{ drawn: inView || reduce, reduce, markerId }}>{children}</DiagramCtx.Provider>
      </svg>
      {overflows && (
        <p aria-hidden="true" className="label ink-3 sticky left-0 mt-3">
          ← Scroll to see the full diagram →
        </p>
      )}
    </div>
  );
}

type NodeProps = {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  tone?: Tone;
  /** Draw-order step; nodes fade in at their step. */
  order?: number;
};

export function DNode({ x, y, w, h = 56, label, sub, tone = 'default', order = 0 }: NodeProps) {
  const { drawn, reduce } = useContext(DiagramCtx);
  const cx_ = x + w / 2;
  return (
    <motion.g
      initial={reduce ? false : { opacity: 0 }}
      animate={drawn ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, delay: order * STEP, ease: ease.out }}
    >
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={w}
        height={h}
        fill={tone === 'accent' ? 'rgb(234 181 96 / 0.08)' : 'rgb(4 7 5 / 0.55)'}
        stroke={stroke[tone]}
        strokeWidth={1}
        strokeDasharray={tone === 'muted' ? '3 3' : undefined}
      />
      <text
        x={cx_}
        y={sub ? y + h / 2 - 3 : y + h / 2 + 4.5}
        textAnchor="middle"
        fontSize={13}
        letterSpacing="0.04em"
        fill={tone === 'accent' ? 'var(--color-pollen)' : tone === 'muted' ? 'var(--ink-3)' : 'var(--ink-1)'}
      >
        {label}
      </text>
      {sub && (
        <text x={cx_} y={y + h / 2 + 14} textAnchor="middle" fontSize={10.5} letterSpacing="0.02em" fill="var(--ink-3)">
          {sub}
        </text>
      )}
    </motion.g>
  );
}

type EdgeProps = {
  /** SVG path data, e.g. "M120 40 H260" or "M120 40 C190 40 190 120 260 120". */
  d: string;
  tone?: Tone;
  order?: number;
  arrow?: boolean;
  dashed?: boolean;
  /** Optional mid-edge label. */
  label?: string;
  labelAt?: { x: number; y: number };
};

export function DEdge({ d, tone = 'default', order = 0, arrow = true, dashed, label, labelAt }: EdgeProps) {
  const { drawn, reduce, markerId } = useContext(DiagramCtx);
  return (
    <g>
      <motion.path
        d={d}
        fill="none"
        stroke={stroke[tone]}
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray={dashed ? '4 4' : undefined}
        markerEnd={arrow ? `url(#${markerId}-${tone})` : undefined}
        initial={reduce || dashed ? false : { pathLength: 0 }}
        animate={drawn ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 0.7, delay: order * STEP, ease: ease.inOut }}
      />
      {label && labelAt && (
        <motion.text
          x={labelAt.x}
          y={labelAt.y}
          textAnchor="middle"
          fontSize={10.5}
          fill="var(--ink-3)"
          initial={reduce ? false : { opacity: 0 }}
          animate={drawn ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: order * STEP + 0.4 }}
        >
          {label}
        </motion.text>
      )}
    </g>
  );
}

type GroupProps = { x: number; y: number; w: number; h: number; label: string; order?: number };

/** Dashed boundary around a subsystem, labelled at the top-left corner. */
export function DGroup({ x, y, w, h, label, order = 0 }: GroupProps) {
  const { drawn, reduce } = useContext(DiagramCtx);
  return (
    <motion.g
      initial={reduce ? false : { opacity: 0 }}
      animate={drawn ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay: order * STEP }}
    >
      <rect x={x + 0.5} y={y + 0.5} width={w} height={h} fill="none" stroke="var(--hairline-strong)" strokeDasharray="2 4" />
      <rect x={x + 12} y={y - 7} width={label.length * 7.2 + 14} height={14} fill="var(--color-night)" />
      <text x={x + 19} y={y + 3.5} fontSize={10.5} letterSpacing="0.14em" fill="var(--ink-3)">
        {label.toUpperCase()}
      </text>
    </motion.g>
  );
}
