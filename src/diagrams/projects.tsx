/**
 * Architecture diagrams for flagship case studies. Every node names a component from the
 * resume; the drawn data flow is a best reading pending Shourya's confirmation (CONTENT-TODO C16).
 * Authored at 960 units wide (see DESIGN-SYSTEM §Diagrams). Accent = the critical path.
 */
import type { DiagramId } from '@/content/projects';
import { DEdge, DGroup, DNode, Diagram } from './primitives';

type DiagramProps = { className?: string; minWidth?: number };

function GraphRag({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={350}
      label="Legal GraphRAG architecture. A query goes to three retrievers: BM25 sparse search and MiniLM dense search over ChromaDB, whose rankings are fused with Reciprocal Rank Fusion, and a Neo4j knowledge graph with vector search and multi-hop retrieval. Candidates are reranked by a Cross-Encoder and passed by LangChain to Qwen3-8B running locally on Ollama, which returns a citation-grounded answer."
    >
      <DGroup x={160} y={22} w={780} h={310} label="LangChain orchestration" order={0} />
      <DNode x={20} y={150} w={110} label="Query" tone="muted" order={0} />
      <DNode x={180} y={40} w={170} label="BM25" sub="sparse · exact terms" order={1} />
      <DNode x={180} y={150} w={170} label="MiniLM" sub="dense · ChromaDB" order={1} />
      <DNode x={180} y={260} w={170} label="Neo4j KG" sub="vector search · multi-hop" order={1} />
      <DNode x={410} y={95} w={110} label="RRF" sub="rank fusion" tone="accent" order={3} />
      <DNode x={570} y={150} w={180} label="Cross-Encoder" sub="ms-marco-MiniLM-L-6-v2" tone="accent" order={5} />
      <DNode x={790} y={150} w={130} label="Qwen3-8B" sub="Ollama · local" tone="accent" order={7} />
      <DEdge d="M130 178 C155 178 155 68 178 68" order={1} />
      <DEdge d="M130 178 H178" order={1} />
      <DEdge d="M130 178 C155 178 155 288 178 288" order={1} />
      <DEdge d="M350 68 C380 68 380 123 408 123" order={2} />
      <DEdge d="M350 178 C380 178 380 123 408 123" order={2} />
      <DEdge d="M520 123 C545 123 545 178 568 178" tone="accent" order={4} />
      <DEdge d="M350 288 C470 288 480 190 568 190" order={4} label="multi-hop context" labelAt={{ x: 470, y: 300 }} />
      <DEdge d="M750 178 H788" tone="accent" order={6} />
      <text x={855} y={232} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)">
        citation-grounded answer
      </text>
    </Diagram>
  );
}

function Vlm({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={390}
      label="Vision Meets Transformers architecture. Left: a CLIP-style dual encoder; an image encoder and a text encoder map Flickr8k images and captions into a shared space trained with InfoNCE loss and cosine learning-rate scheduling. Right: a Transformer decoder block in which multi-head self-attention over text tokens is followed by cross-attention to image features; residual connections link the sub-layers, and ablating them caused 49% loss degradation."
    >
      <DGroup x={10} y={20} w={420} h={350} label="CLIP-style dual encoder" order={0} />
      <DNode x={30} y={50} w={110} label="Image" tone="muted" order={0} />
      <DNode x={170} y={50} w={160} label="Image encoder" order={1} />
      <DNode x={30} y={290} w={110} label="Caption" tone="muted" order={0} />
      <DNode x={170} y={290} w={160} label="Text encoder" order={1} />
      <DNode x={250} y={170} w={160} label="InfoNCE loss" sub="Flickr8k · cosine LR" tone="accent" order={3} />
      <DEdge d="M140 78 H168" order={1} />
      <DEdge d="M140 318 H168" order={1} />
      <DEdge d="M250 106 C250 140 330 140 330 168" tone="accent" order={2} />
      <DEdge d="M250 290 C250 256 330 256 330 228" tone="accent" order={2} />

      <DGroup x={640} y={70} w={300} h={300} label="Decoder block × N" order={3} />
      <DNode x={460} y={170} w={150} label="Image features" tone="muted" order={3} />
      <DNode x={460} y={290} w={150} label="Text tokens" tone="muted" order={3} />
      <DNode x={670} y={290} w={240} label="Multi-head self-attention" sub="over text" order={4} />
      <DNode x={670} y={170} w={240} label="Cross-attention" sub="text queries · image keys/values" tone="accent" order={5} />
      <DNode x={670} y={90} w={240} h={48} label="Text output" tone="muted" order={7} />
      <DEdge d="M610 318 H668" order={4} />
      <DEdge d="M610 198 H668" tone="accent" order={5} />
      <DEdge d="M790 290 V228" order={5} />
      <DEdge d="M790 170 V140" order={6} />
      <DEdge d="M912 318 C935 318 935 198 912 198" dashed arrow={false} order={6} />
      <text x={925} y={384} textAnchor="end" fontSize={10.5} fill="var(--ink-3)">
        residual paths · ablation: 49% loss degradation
      </text>
    </Diagram>
  );
}

function Mot({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={320}
      label="Traffic analytics architecture. Video frames go to YOLOv8 for vehicle detection; DeepSORT and ByteTrack associate detections into tracks, with a Kalman filter for motion prediction; OpenCV-based logic estimates speed; FastAPI serves results to a Streamlit dashboard, packaged with Docker for real-time inference."
    >
      <DNode x={20} y={110} w={110} label="Video frames" tone="muted" order={0} />
      <DNode x={165} y={110} w={130} label="YOLOv8" sub="detection" order={1} />
      <DGroup x={325} y={22} w={190} h={286} label="Tracking" order={2} />
      <DNode x={345} y={45} w={150} label="DeepSORT" order={2} />
      <DNode x={345} y={135} w={150} label="ByteTrack" order={2} />
      <DNode x={345} y={230} w={150} label="Kalman filter" sub="motion prediction" order={3} />
      <DNode x={550} y={110} w={140} label="Speed estimation" sub="OpenCV" tone="accent" order={4} />
      <DGroup x={720} y={22} w={225} h={286} label="Docker" order={5} />
      <DNode x={738} y={60} w={190} label="FastAPI" sub="inference service" order={5} />
      <DNode x={738} y={185} w={190} label="Streamlit" sub="real-time dashboard" tone="accent" order={6} />
      <DEdge d="M130 138 H163" order={1} />
      <DEdge d="M295 138 C320 138 320 73 343 73" order={2} />
      <DEdge d="M295 138 C320 138 320 163 343 163" order={2} />
      <DEdge d="M420 230 V193" dashed order={3} />
      <DEdge d="M495 73 C522 73 522 138 548 138" tone="accent" order={4} />
      <DEdge d="M495 163 C522 163 522 138 548 138" tone="accent" order={4} />
      <DEdge d="M690 138 C712 138 712 88 736 88" tone="accent" order={5} />
      <DEdge d="M833 116 V183" tone="accent" order={6} />
    </Diagram>
  );
}

function CodingDuel({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={340}
      label="Coding Duel System architecture. The Next.js client submits code to an Express API, which enqueues judging jobs in BullMQ backed by Redis; each job runs in a Docker sandbox for isolated execution; verdicts stream back to players over Socket.io; a 16-table PostgreSQL schema, accessed through Prisma ORM, stores ELO rankings."
    >
      <DNode x={20} y={130} w={140} label="Next.js client" sub="duel interface" tone="muted" order={0} />
      <DNode x={220} y={50} w={160} label="Express API" sub="submissions" order={1} />
      <DNode x={220} y={200} w={160} label="Socket.io" sub="live verdicts" order={6} />
      <DNode x={440} y={50} w={170} label="BullMQ" sub="job queue · Redis" order={2} />
      <DNode x={670} y={50} w={180} label="Docker sandbox" sub="isolated execution" tone="accent" order={3} />
      <DNode x={440} y={190} w={210} label="PostgreSQL" sub="Prisma ORM · 16 tables · ELO" order={4} />
      <DEdge d="M160 158 C190 158 190 78 218 78" order={1} label="submit" labelAt={{ x: 150, y: 110 }} />
      <DEdge d="M380 78 H438" tone="accent" order={2} />
      <DEdge d="M610 78 H668" tone="accent" order={3} />
      <DEdge d="M760 106 V300 H300 V258" tone="accent" order={5} label="verdict" labelAt={{ x: 540, y: 318 }} />
      <DEdge d="M380 100 C410 100 410 218 438 218" order={4} />
      <DEdge d="M220 228 C190 228 190 170 162 170" tone="accent" order={6} />
    </Diagram>
  );
}

function DeepRl({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={330}
      label="Deep RL trading architecture. OHLCV price data is engineered into RSI and MACD features that form the state; DQN and DDPG agents act in a custom trading environment, which returns rewards; grid-searched agents are backtested against Buy-and-Hold and Moving Average Crossover baselines."
    >
      <DNode x={20} y={140} w={120} label="OHLCV" sub="price data" tone="muted" order={0} />
      <DNode x={175} y={140} w={150} label="Features" sub="RSI · MACD" tone="accent" order={1} />
      <DGroup x={360} y={40} w={230} h={260} label="Agents" order={2} />
      <DNode x={380} y={75} w={190} label="DQN" order={2} />
      <DNode x={380} y={205} w={190} label="DDPG" order={2} />
      <DNode x={625} y={140} w={150} label="Trading env" sub="custom pipeline" order={3} />
      <DNode x={810} y={95} w={135} label="Backtest" sub="grid search" tone="accent" order={5} />
      <DNode x={810} y={210} w={135} label="Baselines" sub="Buy-and-Hold · MA cross" tone="muted" order={5} />
      <DEdge d="M140 168 H173" order={1} />
      <DEdge d="M325 168 C352 168 352 103 378 103" tone="accent" order={2} />
      <DEdge d="M325 168 C352 168 352 233 378 233" tone="accent" order={2} />
      <DEdge d="M570 103 C598 103 598 160 623 160" order={3} label="actions" labelAt={{ x: 628, y: 104 }} />
      <DEdge d="M570 233 C598 233 598 176 623 176" order={3} />
      <DEdge d="M700 140 C700 12 475 12 475 73" dashed order={4} label="reward · next state" labelAt={{ x: 590, y: 24 }} />
      <DEdge d="M775 168 C792 168 792 123 808 123" tone="accent" order={5} />
      <DEdge d="M877 210 V153" order={6} />
    </Diagram>
  );
}

const registry: Record<DiagramId, (p: DiagramProps) => React.JSX.Element> = {
  graphrag: GraphRag,
  vlm: Vlm,
  mot: Mot,
  'coding-duel': CodingDuel,
  'deep-rl': DeepRl,
};

export function ProjectDiagram({ id, className, minWidth }: { id: DiagramId; className?: string; minWidth?: number }) {
  const D = registry[id];
  return <D className={className} minWidth={minWidth} />;
}
