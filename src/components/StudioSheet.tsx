import React, { useEffect, useState } from 'react';
import { X, ArrowUpRight, Check } from 'lucide-react';

export type SheetSection = 'work' | 'about' | 'journal' | 'contact' | null;

interface StudioSheetProps {
  section: SheetSection;
  onClose: () => void;
  onNavigate: (section: Exclude<SheetSection, null>) => void;
}

const WORK_ITEMS = [
  {
    year: '2026',
    discipline: 'Living Architecture · Biomaterial Systems',
    title: 'Mycelial Pavilion at Aoraki Basin',
    summary:
      'A zero-steel acoustic shelter grown from agricultural hemp hurd and native fungal substrates that biodegrades back into alpine topsoil after a seven-year exhibition cycle.',
  },
  {
    year: '2025',
    discipline: 'Ecological Identity · Digital Ecosystem',
    title: 'Waitomo Watershed Commons',
    summary:
      'Real-time telemetry platform and community stewardship ledger pairing soil moisture sensors with seasonal restoration pledges across forty-two riparian farms.',
  },
  {
    year: '2025',
    discipline: 'Botanical Packaging · Circular Supply',
    title: 'Kawakawa Apothecary Vessel',
    summary:
      'Refillable seaweed-polymer vessels embossed with seed-paper sleeves that sprout native understory groundcover once planted in damp shade.',
  },
];

const JOURNAL_NOTES = [
  {
    date: 'November 2026',
    readingTime: '4 min read',
    title: 'Against permanence: designing objects meant to compost',
    excerpt:
      'Most industrial design treats decay as a failure mode. When we design for natural decomposition from day zero, material choices become honest again.',
  },
  {
    date: 'September 2026',
    readingTime: '6 min read',
    title: 'Nocturnal pollination and dark-sky lighting standards',
    excerpt:
      'Field observations from three valley sanctuaries on how warm-spectrum micro-luminance preserves moth and beetle corridors without blinding human paths.',
  },
  {
    date: 'July 2026',
    readingTime: '5 min read',
    title: 'What soil networks teach us about resilient software',
    excerpt:
      'Decentralized nutrient exchange in old-growth root systems offers a blueprint for local-first digital tools that thrive without cloud sprawl.',
  },
];

export const StudioSheet: React.FC<StudioSheetProps> = ({
  section,
  onClose,
  onNavigate,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!section) return;
    setSubmitted(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [section, onClose]);

  if (!section) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div
      className="studio-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Fernhollow ${section}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="studio-sheet">
        <div className="flex items-start justify-between gap-6 border-b border-[#f5efe2]/15 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f5efe2]/60">
              Fernhollow Studio
            </p>
            <h2 className="mt-2">
              {section === 'work' && 'Selected Work'}
              {section === 'about' && 'Rooted in Regeneration'}
              {section === 'journal' && 'Field Journal'}
              {section === 'contact' && 'Let’s Talk'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Return to valley"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f5efe2]/35 text-[#f5efe2] transition-colors hover:bg-[#f5efe2] hover:text-[#151510]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {section === 'work' && (
          <div className="mt-8 divide-y divide-[#f5efe2]/12">
            {WORK_ITEMS.map((item) => (
              <article key={item.title} className="py-6 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                  <span>{item.discipline}</span>
                  <span className="tabular-nums">{item.year}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-medium text-[#f5efe2]">{item.title}</h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex shrink-0 items-center gap-1 text-xs uppercase tracking-[0.14em] text-[#f5efe2]/75 transition-opacity hover:opacity-60"
                  >
                    Inquire <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#f5efe2]/75">
                  {item.summary}
                </p>
              </article>
            ))}
          </div>
        )}

        {section === 'about' && (
          <div className="mt-8 space-y-6">
            <p className="max-w-2xl text-lg leading-relaxed text-[#f5efe2]/90">
              Fernhollow is an independent regenerative design studio crafting
              physical spaces, living materials, and quiet digital tools that
              leave ecosystems richer than we found them.
            </p>
            <div className="grid gap-6 border-t border-[#f5efe2]/15 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#f5efe2]/55">
                  Biomaterials
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#f5efe2]/75">
                  Mycelium, kelp polymers, and local timber engineered for full
                  biological return.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#f5efe2]/55">
                  Spatial Systems
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#f5efe2]/75">
                  Low-impact pavilions, dark-sky wayfinding, and watershed
                  restoration signage.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#f5efe2]/55">
                  Digital Craft
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#f5efe2]/75">
                  Lightweight web experiences and field-sensor interfaces built
                  for longevity.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex h-11 items-center rounded-full bg-[#f5efe2] px-6 text-xs font-medium uppercase tracking-[0.16em] text-[#151510] transition-transform hover:-translate-y-0.5"
              >
                Start a conversation
              </button>
            </div>
          </div>
        )}

        {section === 'journal' && (
          <div className="mt-8 divide-y divide-[#f5efe2]/12">
            {JOURNAL_NOTES.map((note) => (
              <article key={note.title} className="py-6 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#f5efe2]/55">
                  <span>{note.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{note.readingTime}</span>
                </div>
                <h3 className="mt-2 text-xl font-medium text-[#f5efe2]">{note.title}</h3>
                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#f5efe2]/75">
                  {note.excerpt}
                </p>
              </article>
            ))}
          </div>
        )}

        {section === 'contact' && (
          <div className="mt-8">
            {submitted ? (
              <div className="rounded-xl border border-[#f5efe2]/20 bg-[#f5efe2]/5 p-6">
                <div className="flex items-center gap-3 text-[#f5efe2]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5efe2] text-[#151510]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-medium">Note received, {name}.</p>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#f5efe2]/75">
                  Thank you for reaching out to Fernhollow. Our studio team will
                  reply to {email} within two working days.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-[#f5efe2]/40 px-6 text-xs font-medium uppercase tracking-[0.16em] text-[#f5efe2] transition-colors hover:bg-[#f5efe2] hover:text-[#151510]"
                >
                  Return to valley
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="max-w-xl text-sm leading-relaxed text-[#f5efe2]/75">
                  Tell us about the place, material, or ecological story you are
                  building around.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                      Name
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-2 w-full rounded-lg border border-[#f5efe2]/20 bg-night/40 px-4 py-3 text-sm text-[#f5efe2] placeholder:text-[#f5efe2]/35 focus:border-[#f5efe2]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.org"
                      className="mt-2 w-full rounded-lg border border-[#f5efe2]/20 bg-night/40 px-4 py-3 text-sm text-[#f5efe2] placeholder:text-[#f5efe2]/35 focus:border-[#f5efe2]"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                    Project notes
                  </span>
                  <textarea
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share a brief note on scope, timeline, or stewardship goals..."
                    className="mt-2 w-full rounded-lg border border-[#f5efe2]/20 bg-night/40 px-4 py-3 text-sm text-[#f5efe2] placeholder:text-[#f5efe2]/35 focus:border-[#f5efe2]"
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <span className="text-xs text-[#f5efe2]/55">
                    hello@fernhollow.studio · Wellington &amp; Portland
                  </span>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center rounded-full bg-[#f5efe2] px-7 text-xs font-medium uppercase tracking-[0.16em] text-[#151510] transition-transform hover:-translate-y-0.5"
                  >
                    Send note
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
