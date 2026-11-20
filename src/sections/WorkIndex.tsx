/**
 * Work index — the body of the Work chapter.
 * Editorial list grouped by tier; on desktop a sticky "plate" previews the hovered/focused
 * project's architecture diagram (or its headline figures when it has no diagram yet).
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { Figure } from '@/components/ui/Figure';
import { projects, tierIntro, tierLabel, type Project, type ProjectTier } from '@/content/projects';
import { ProjectDiagram } from '@/diagrams/projects';
import { cx } from '@/lib/cx';
import { dur, ease } from '@/lib/motion';
import { Link } from '@/lib/router';

const tiers: ProjectTier[] = ['flagship', 'selected', 'field'];


function InlineMetrics({ project, max = 3 }: { project: Project; max?: number }) {
  if (project.metrics.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {project.metrics.slice(0, max).map((m) => (
        <li key={m.label} className="flex items-baseline gap-2">
          <span className={cx('font-display text-[1.375rem] leading-none tabular', m.tone === 'before' ? 'text-poppy' : 'ink-1')}>
            {m.value}
          </span>
          <span className="label ink-3 normal-case tracking-[0.02em]">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ project, onActivate, active }: { project: Project; onActivate: () => void; active: boolean }) {
  const flagship = project.tier === 'flagship';
  return (
    <li className="border-b hairline">
      <Link
        to={`/work/${project.slug}`}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        className={cx(
          'group/row grid gap-4 py-8 transition-colors duration-[var(--dur-base)] md:grid-cols-[4.5rem_1fr] md:gap-6',
          flagship ? 'md:py-10' : 'md:py-7',
        )}
        aria-describedby={`${project.slug}-summary`}
      >
        <span className={cx('label tabular pt-1 transition-colors', active ? 'text-pollen' : 'ink-3')}>{project.no}</span>
        <span className="flex min-w-0 flex-col gap-3">
          <span className="label ink-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>{project.category}</span>
            <span aria-hidden="true" className="ink-4 max-sm:hidden">/</span>
            <span className="tabular">{project.period}</span>
          </span>
          <span
            className={cx(
              'font-display uppercase transition-colors duration-[var(--dur-fast)] group-hover/row:text-pollen',
              flagship ? 'text-display-m' : 'text-display-s',
            )}
          >
            {project.title}
          </span>
          <span id={`${project.slug}-summary`} className="measure ink-2">
            {project.summary}
          </span>
          {flagship && (
            <span className="mt-1 block">
              <InlineMetrics project={project} />
            </span>
          )}
          <span className="label mt-1 inline-flex items-center gap-2 text-cream">
            Read case study
            <span aria-hidden="true" className="transition-transform duration-[var(--dur-base)] ease-out-expo group-hover/row:translate-x-1">
              →
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function Preview({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={project.slug}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6 }}
        transition={{ duration: dur.base, ease: ease.outExpo }}
      >
        <Figure
          number={project.no}
          title={project.architecture.title}
        >
          {project.architecture.diagram ? (
            <ProjectDiagram id={project.architecture.diagram} minWidth={0} />
          ) : (
            <div className="flex min-h-48 flex-col justify-center gap-6">
              <p className="font-display text-display-s uppercase ink-1">{project.title}</p>
              <InlineMetrics project={project} max={4} />
            </div>
          )}
        </Figure>
      </motion.div>
    </AnimatePresence>
  );
}

export function WorkIndex() {
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);
  const active = projects.find((p) => p.slug === activeSlug) ?? projects[0];

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-20">
      <div className="flex flex-col gap-20">
        {tiers.map((tier) => {
          const list = projects.filter((p) => p.tier === tier);
          return (
            <section key={tier} aria-labelledby={`tier-${tier}`} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Eyebrow index={tier === 'flagship' ? 'A' : tier === 'selected' ? 'B' : 'C'}>
                  <span id={`tier-${tier}`}>{tierLabel[tier]}</span>
                </Eyebrow>
                <p className="text-small ink-3">{tierIntro[tier]}</p>
              </div>
              <ul className="border-t hairline">
                {list.map((p) => (
                  <Row key={p.slug} project={p} active={p.slug === activeSlug} onActivate={() => setActiveSlug(p.slug)} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Desktop plate preview — decorative duplicate of the case-study figure. */}
      <aside aria-hidden="true" className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+3rem)]">
          <Preview project={active} />
        </div>
      </aside>
    </div>
  );
}
