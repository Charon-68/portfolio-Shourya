/**
 * About chapter body: bio + education, achievements (large figures, no badge wall),
 * and the technical arsenal as an evidence map (select a skill → where the resume shows it used).
 */
import { useMemo, useState } from 'react';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { TodoMark } from '@/components/ui/TodoMark';
import { achievements, bio, certifications, education, honours } from '@/content/about';
import { evidenceFor, skillGroups, type Skill } from '@/content/skills';
import { cx } from '@/lib/cx';
import { Link } from '@/lib/router';

function Bio() {
  return (
    <section aria-labelledby="about-bio" className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-20">
      <div className="flex flex-col gap-6">
        <Eyebrow index="A">
          <span id="about-bio">In brief</span>
        </Eyebrow>
        {bio.map((p, i) => (
          <p key={i} className={cx('measure', i === 0 ? 'text-lead ink-1' : 'ink-2')}>
            {p}
          </p>
        ))}
      </div>
      <dl className="flex flex-col gap-0 self-start border-t hairline">
        {[
          ['Institution', education.institution],
          ['Degree', education.degree],
          ['Minor', education.minor],
          ['Graduating', education.graduation],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 border-b hairline py-4">
            <dt className="label ink-3">{k}</dt>
            <dd className="ink-1">{v}</dd>
          </div>
        ))}
        {education.cpi.show ? (
          <div className="grid grid-cols-[8rem_1fr] gap-4 border-b hairline py-4">
            <dt className="label ink-3">CPI</dt>
            <dd className="ink-1 tabular">{education.cpi.value}</dd>
          </div>
        ) : (
          <div className="py-3">
            <TodoMark id={education.cpi.todo} compact>
              show CPI?
            </TodoMark>
          </div>
        )}
      </dl>
    </section>
  );
}

function Achievements() {
  return (
    <section aria-labelledby="about-achievements" className="flex flex-col gap-10">
      <Eyebrow index="B">
        <span id="about-achievements">Achievements</span>
      </Eyebrow>
      <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((a) => (
          <li key={a.title} className="flex flex-col gap-3 border-t hairline pt-5">
            <p className="font-display text-numeral uppercase tabular">{a.figure}</p>
            <p className="label ink-3 -mt-1 min-h-[1.4em]">{a.of ?? '\u00a0'}</p>
            <h3 className="label min-h-[2.8em] text-pollen">{a.title}</h3>
            <p className="text-small ink-2">{a.detail}</p>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col border-t hairline">
        {honours.map((h) => (
          <li key={h} className="grid grid-cols-[1.25rem_1fr] border-b hairline py-3.5 ink-2">
            <span aria-hidden="true" className="text-pollen">–</span>
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceList({ skill }: { skill: Skill }) {
  const evidence = evidenceFor(skill);
  return (
    <>
      <p className="label ink-3">Where it appears</p>
      <p className="font-display text-display-s uppercase">{skill.name}</p>
      {evidence.length > 0 ? (
        <ul className="flex flex-col">
          {evidence.map((ev) => (
            <li key={ev.kind + ev.id} className="border-b hairline">
              {ev.kind === 'project' ? (
                <Link to={ev.href} className="flex items-baseline justify-between gap-4 py-3 text-cream hover:text-pollen">
                  <span>{ev.label}</span>
                  <span className="label ink-3 shrink-0">Case study →</span>
                </Link>
              ) : (
                <a
                  href={ev.href}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(ev.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-baseline justify-between gap-4 py-3 text-cream hover:text-pollen"
                >
                  <span>{ev.label}</span>
                  <span className="label ink-3 shrink-0">Experience ↑</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ink-2">Part of the toolkit; not named in a specific project write-up here.</p>
      )}
    </>
  );
}

function Arsenal() {
  const [selected, setSelected] = useState<Skill | null>(null);
  const counts = useMemo(
    () => new Map(skillGroups.flatMap((g) => g.skills).map((s) => [s.name, evidenceFor(s).length])),
    [],
  );

  return (
    <section aria-labelledby="about-arsenal" className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Eyebrow index="C">
          <span id="about-arsenal">Technical arsenal</span>
        </Eyebrow>
        <p className="measure ink-2">
          Select a tool to see where it appears in the work. Numbers count the projects and roles that name it.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col">
          {skillGroups.map((g) => (
            <div key={g.id} className="grid gap-4 border-t hairline py-6 md:grid-cols-[11rem_1fr]">
              <h3 className="label ink-3">{g.title}</h3>
              <ul className="flex flex-wrap gap-x-1 gap-y-1.5">
                {g.skills.map((s) => {
                  const n = counts.get(s.name) ?? 0;
                  const on = selected?.name === s.name;
                  return (
                    <li key={s.name}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSelected(on ? null : s)}
                        className={cx(
                          'group/skill inline-flex items-baseline gap-1 rounded-hair px-1.5 py-0.5 font-mono text-[0.8125rem] transition-colors duration-[var(--dur-fast)]',
                          on ? 'bg-pollen text-ink' : n > 0 ? 'text-cream hover:text-pollen' : 'ink-2 hover:text-cream',
                        )}
                      >
                        {s.name}
                        {n > 0 && (
                          <sup className={cx('text-[0.625rem] tabular', on ? 'text-ink' : 'text-pollen')} aria-label={`${n} uses`}>
                            {n}
                          </sup>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Small screens: evidence opens right under the tapped group. */}
              {selected && g.skills.some((s) => s.name === selected.name) && (
                <div className="flex flex-col gap-3 border-t hairline pt-4 md:col-start-2 lg:hidden" aria-live="polite">
                  <EvidenceList skill={selected} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Evidence panel */}
        <div className="hidden lg:sticky lg:top-[calc(var(--header-h)+3rem)] lg:block lg:self-start">
          <div className="flex min-h-56 flex-col gap-4 border-t hairline pt-6" aria-live="polite">
            {selected ? (
              <EvidenceList skill={selected} />
            ) : (
              <p className="measure ink-3">Nothing selected. Tools with a number are named in the projects and roles above.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="label ink-3">Certifications & courses</h3>
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {certifications.map((c) => (
            <li key={c.title} className="flex flex-col gap-1.5 border-t hairline pt-4">
              <p className="ink-1">{c.title}</p>
              <p className="text-small ink-3">{c.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function About() {
  return (
    <div className="flex flex-col gap-24">
      <Bio />
      <Achievements />
      <Arsenal />
    </div>
  );
}
