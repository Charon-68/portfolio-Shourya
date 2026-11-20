/**
 * Dev-only design-system specimen, rendered over the live valley + content scrim
 * so contrast and texture are judged in real conditions. Open /specimen.html in dev.
 * Content here uses real resume facts only; diagrams are style tests, not final.
 */
import { useEffect, useState } from 'react';
import { useValley } from '@/scene/useValley';
import { ArrowLink } from '@/components/ui/ArrowLink';
import { Button } from '@/components/ui/Button';
import { Figure } from '@/components/ui/Figure';
import { Metric } from '@/components/ui/Metric';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow, SectionHeading } from '@/components/ui/SectionHeading';
import { TagList } from '@/components/ui/TagList';
import { TodoMark } from '@/components/ui/TodoMark';
import { DEdge, DGroup, DNode, Diagram } from '@/diagrams/primitives';

const swatches = [
  { name: 'night', hex: '#040705', note: 'scene / page background' },
  { name: 'night-2', hex: '#0a0d0b', note: 'raised backdrop' },
  { name: 'moss', hex: '#1b231d', note: 'chart grid' },
  { name: 'cream', hex: '#f5efe2', note: 'primary ink · 17.7:1 on night' },
  { name: 'ink', hex: '#151510', note: 'text on cream' },
  { name: 'pollen', hex: '#eab560', note: 'the accent · 10.9:1 on night' },
  { name: 'pollen-deep', hex: '#b9852f', note: 'pressed / hover' },
  { name: 'poppy', hex: '#d9573a', note: 'data contrast only · 5.2:1' },
];

const inks = [
  { name: 'ink-1', v: '0.94', use: 'headings' },
  { name: 'ink-2', v: '0.78', use: 'body' },
  { name: 'ink-3', v: '0.56', use: 'labels, secondary' },
  { name: 'ink-4', v: '0.34', use: 'decorative only' },
];

/** Specimen reads as content: slowed flight, wheel scrolls the page, 30 fps. */
function useContentMode() {
  const { setMode } = useValley();
  useEffect(() => setMode('content'), [setMode]);
}

/** Cross-fades opener → reading scrim over the first 60% of a viewport of scroll. Writes a CSS var; no re-renders. */
function useScrimProgress() {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)));
      document.documentElement.style.setProperty('--scrim-t', t.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t hairline py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <h2 id={id} className="label ink-3 font-mono">
          {title}
        </h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function GraphRagStyleTest() {
  return (
    <Diagram height={340} label="Style test: hybrid retrieval pipeline. Query goes to BM25 and MiniLM dense retrieval over ChromaDB, fused with Reciprocal Rank Fusion, reranked by a Cross-Encoder, expanded through a Neo4j knowledge graph with multi-hop retrieval, and answered by local Qwen3-8B via Ollama, orchestrated with LangChain.">
      <DGroup x={190} y={30} w={740} h={290} label="LangChain orchestration" order={0} />
      <DNode x={20} y={142} w={130} label="Query" tone="muted" order={0} />
      <DNode x={220} y={70} w={170} label="BM25" sub="sparse · 11.5K chunks" order={1} />
      <DNode x={220} y={214} w={170} label="MiniLM" sub="dense · ChromaDB" order={1} />
      <DNode x={440} y={142} w={120} label="RRF" sub="rank fusion" tone="accent" order={3} />
      <DNode x={596} y={70} w={176} label="Cross-Encoder" sub="ms-marco-MiniLM-L-6-v2" order={4} />
      <DNode x={596} y={214} w={176} label="Neo4j KG" sub="vector + multi-hop" order={4} />
      <DNode x={806} y={142} w={112} label="Qwen3-8B" sub="Ollama · local" tone="accent" order={6} />
      <DEdge d="M150 170 C185 170 185 98 218 98" order={1} />
      <DEdge d="M150 170 C185 170 185 242 218 242" order={1} />
      <DEdge d="M390 98 C415 98 415 170 438 170" order={2} />
      <DEdge d="M390 242 C415 242 415 170 438 170" order={2} />
      <DEdge d="M560 170 C578 170 578 98 594 98" tone="accent" order={4} />
      <DEdge d="M560 170 C578 170 578 242 594 242" tone="accent" order={4} />
      <DEdge d="M772 98 C790 98 790 170 804 170" order={5} />
      <DEdge d="M772 242 C790 242 790 170 804 170" order={5} />
    </Diagram>
  );
}

export function Specimen() {
  const [replay, setReplay] = useState(0);
  useContentMode();
  useScrimProgress();

  return (
    <>
      <div className="specimen-scrim" aria-hidden="true" />

      <main className="page relative z-[3] py-16 md:py-24">
        {/* Opener zone: light scrim, so only ink-1 / pollen at display or lead sizes. */}
        <header className="flex min-h-[70vh] flex-col justify-end gap-6 pb-16">
          <Eyebrow index="M1" tone="strong">
            Design system specimen
          </Eyebrow>
          <h1 className="text-display-xl uppercase">Shourya Saxena</h1>
          <p className="measure text-lead ink-1">
            Building intelligent systems — from first principles to production.
          </p>
          <p className="label ink-1">Software Engineering · Applied Machine Learning · Systems</p>
        </header>

        <Block id="s-colour" title="Colour">
          <ul className="grid grid-cols-2 gap-px bg-[var(--hairline)] sm:grid-cols-4">
            {swatches.map((s) => (
              <li key={s.name} className="flex flex-col gap-3 bg-night p-4">
                <span className="h-16 w-full border hairline" style={{ background: s.hex }} />
                <span className="label ink-1">{s.name}</span>
                <span className="label ink-3 normal-case tracking-normal">{s.hex}</span>
                <span className="text-small ink-3">{s.note}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-10 grid gap-4 sm:grid-cols-4">
            {inks.map((i) => (
              <li key={i.name} className="flex flex-col gap-1 border-t hairline pt-3">
                <span className={`text-display-s ${i.name}`}>Aa</span>
                <span className="label ink-3">
                  {i.name} · {i.v}
                </span>
                <span className="text-small ink-3">{i.use}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="s-type" title="Typography">
          <div className="flex flex-col gap-10">
            {[
              ['display-xl · Antonio · 56→148', 'text-display-xl', 'Shourya Saxena'],
              ['display-l · chapter', 'text-display-l', 'Selected Work'],
              ['display-m · project title', 'text-display-m', 'Legal GraphRAG System'],
              ['display-s · sub-head', 'text-display-s', 'Hybrid retrieval over 11.5K contract chunks'],
            ].map(([meta, cls, txt]) => (
              <div key={cls} className="flex flex-col gap-3">
                <span className="label ink-3">{meta}</span>
                <p className={`${cls} font-display uppercase`}>{txt}</p>
              </div>
            ))}
            <div className="flex flex-col gap-3">
              <span className="label ink-3">lead · Manrope 18→22</span>
              <p className="measure text-lead ink-2">
                I like building the whole system: the model, the pipeline that feeds it, and the software that puts it in
                front of people.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label ink-3">body · Manrope 17 / 1.65 · measure 64ch</span>
              <p className="measure ink-2">
                Built a hybrid retrieval pipeline over 11.5K legal contract chunks using BM25, MiniLM, ChromaDB and
                Reciprocal Rank Fusion, then designed a Neo4j knowledge graph with vector search and multi-hop retrieval,
                reaching 5.5-second end-to-end query latency. A Cross-Encoder reranker, LangChain orchestration and a
                local Qwen3-8B model through Ollama produce citation-grounded answers.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <span className="label ink-3">small · 14</span>
                <p className="text-small ink-2">Summer of Science · Maths and Physics Club</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="label ink-3">label · mono 12</span>
                <p className="label ink-1">May’26 – Jul’26</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="label ink-3">micro · mono 11</span>
                <p className="font-mono text-micro ink-3 tabular">x 12.4 · z −33.1 · 58 fps</p>
              </div>
            </div>
          </div>
        </Block>

        <Block id="s-actions" title="Actions">
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap items-center gap-4">
              <Button arrow="right">Explore work</Button>
              <Button variant="outline" arrow="right">Read case study</Button>
              <Button variant="outline" href="#" arrow="external">
                Resume
              </Button>
              <Button variant="ghost" arrow="right">
                Next project
              </Button>
              <Button size="sm" variant="outline">
                Small
              </Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <ArrowLink href="#">All projects</ArrowLink>
              <ArrowLink href="#" external>
                Repository
              </ArrowLink>
              <p className="ink-2">
                Inline prose link:{' '}
                <ArrowLink href="#" tone="text">
                  read the architecture notes
                </ArrowLink>
                .
              </p>
            </div>
            <p className="text-small ink-3">Tab through this block to check focus rings (pollen, 2px, offset 3px).</p>
          </div>
        </Block>

        <Block id="s-heading" title="Section heading">
          <SectionHeading
            index="02"
            eyebrow="Experience"
            title="Where the work happened"
            lead="Internships and roles ran in parallel through 2025–26. The timeline shows them side by side."
          />
        </Block>

        <Block id="s-metrics" title="Metrics">
          <div className="flex flex-col gap-12" key={replay}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              <Metric value="0.80" label="Recall@5" context={{ todo: 'C6' }} />
              <Metric value="1.00" label="MRR" context={{ todo: 'C6' }} />
              <Metric value="5.5s" label="End-to-end query latency" />
              <Metric value="11.5K" label="Legal contract chunks indexed" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              <Metric value="19.4%" label="Max drawdown · before" tone="before" />
              <Metric value="18.2%" label="Max drawdown · after features" />
              <Metric value="0.71" label="OOD AUROC · before" tone="before" />
              <Metric value="0.90" label="OOD AUROC · after" />
            </div>
            <div>
              <Button size="sm" variant="outline" onClick={() => setReplay((r) => r + 1)}>
                Replay count-up
              </Button>
            </div>
          </div>
        </Block>

        <Block id="s-tags" title="Stack list">
          <TagList
            label="Technologies"
            items={['BM25', 'MiniLM', 'ChromaDB', 'RRF', 'Neo4j', 'Cross-Encoder', 'LangChain', 'Ollama', 'Qwen3-8B']}
            highlight={(t) => t === 'Neo4j'}
          />
          <p className="mt-4 text-small ink-3">Mono, slash-separated, wraps naturally. Highlight = pollen (used by the Arsenal evidence map).</p>
        </Block>

        <Block id="s-figure" title="Plate / figure">
          <Figure
            number="01"
            title="Hybrid retrieval"
            caption="Style test for the diagram language: hairline nodes, drawn edges, pollen for the critical path. Pipeline ordering is a draft and will be confirmed against the project in M5."
          >
            <GraphRagStyleTest />
          </Figure>
        </Block>

        <Block id="s-todo" title="Missing content">
          <div className="flex flex-col gap-4">
            <TodoMark id="C5">repository link</TodoMark>
            <p className="measure text-small ink-3">
              Shown wherever a fact or link has not been supplied. IDs map to docs/CONTENT-TODO.md and are only visible in
              development.
            </p>
          </div>
        </Block>

        <Block id="s-motion" title="Motion">
          <div className="flex flex-col gap-6">
            <ul className="grid gap-4 sm:grid-cols-4">
              {[
                ['fast', '180ms', 'hover, colour'],
                ['base', '420ms', 'UI transitions'],
                ['slow', '800ms', 'reveals'],
                ['scene', '1200ms', 'chapter / camera'],
              ].map(([n, v, u]) => (
                <li key={n} className="border-t hairline pt-3">
                  <p className="label ink-1">{n}</p>
                  <p className="font-display text-display-s tabular">{v}</p>
                  <p className="text-small ink-3">{u}</p>
                </li>
              ))}
            </ul>
            {[0, 1, 2].map((i) => (
              <Reveal key={i} delay={i * 0.07}>
                <p className="ink-2">Reveal · fade + 18px rise · out-expo · once · step {i + 1}</p>
              </Reveal>
            ))}
          </div>
        </Block>
      </main>
    </>
  );
}
