/**
 * Beyond Code — deliberately looser than the technical chapters: a staggered two-column
 * layout, big figures, and small line glyphs drawn in the same plate style as the diagrams.
 */
import type { JSX } from 'react';
import { beyond, type BeyondItem } from '@/content/about';
import { cx } from '@/lib/cx';

const glyphs: Record<BeyondItem['id'], JSX.Element> = {
  // Three people connected — mentoring
  mentoring: (
    <>
      <circle cx="20" cy="44" r="7" />
      <circle cx="60" cy="18" r="7" />
      <circle cx="100" cy="44" r="7" />
      <path d="M27 40 53 22M67 22l26 18M27 44h66" strokeDasharray="3 4" />
    </>
  ),
  // A disc on its flight arc — Ultimate Frisbee
  frisbee: (
    <>
      <path d="M8 52C40 8 80 8 112 30" strokeDasharray="3 4" />
      <ellipse cx="100" cy="24" rx="14" ry="5" transform="rotate(-14 100 24)" />
    </>
  ),
  // Keys — keyboard
  keyboard: (
    <>
      <path d="M8 16h104v36H8z" />
      {[22, 38, 54, 70, 86, 102].map((x) => (
        <path key={x} d={`M${x} 16v36`} />
      ))}
      {[30, 46, 78, 94].map((x) => (
        <path key={x} d={`M${x - 4} 16h8v20h-8z`} fill="currentColor" stroke="none" />
      ))}
    </>
  ),
  // Ranked steps — contests
  competitions: (
    <>
      <path d="M8 52h104M20 52V32h26v20M46 52V16h28v36M74 52V38h26v14" />
      <circle cx="60" cy="8" r="3" fill="currentColor" stroke="none" />
    </>
  ),
};

export function BeyondCode() {
  return (
    <ul className="grid gap-x-16 gap-y-16 md:grid-cols-2">
      {beyond.map((b, i) => (
        <li key={b.id} className={cx('flex flex-col gap-5 border-t hairline pt-6', i % 2 === 1 && 'md:mt-24')}>
          <svg
            viewBox="0 0 120 60"
            aria-hidden="true"
            className="h-12 w-24 fill-none stroke-pollen stroke-[1.2] text-pollen [stroke-linecap:round] [stroke-linejoin:round]"
          >
            {glyphs[b.id]}
          </svg>
          <p className="font-display text-numeral uppercase tabular">{b.figure}</p>
          <h3 className="label text-pollen">{b.title}</h3>
          {b.lines.map((l) => (
            <p key={l} className="measure ink-2">
              {l}
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
}
