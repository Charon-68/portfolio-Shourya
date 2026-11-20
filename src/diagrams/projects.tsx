/**
 * Architecture diagrams for flagship case studies. Every node names a component from the
 * resume; the drawn data flow was confirmed by Shourya (2026-11-20).
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

function SihTariff({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={320}
      label="AI Tariff Simulator architecture. Fifteen-plus years of historical trade data feed three forecasting models — SARIMAX, XGBoost and LSTM — whose macroeconomic forecasts drive a deployed policy analytics dashboard that models more than 100 tariff scenarios."
    >
      <DNode x={20} y={132} w={160} label="Trade data" sub="15+ years · historical" tone="muted" order={0} />
      <DGroup x={230} y={22} w={260} h={276} label="Forecasting models" order={1} />
      <DNode x={255} y={50} w={210} label="SARIMAX" sub="seasonal time series" order={1} />
      <DNode x={255} y={132} w={210} label="XGBoost" sub="gradient boosting" order={2} />
      <DNode x={255} y={214} w={210} label="LSTM" sub="recurrent network" order={3} />
      <DNode x={560} y={132} w={190} label="Scenario forecasts" sub="macroeconomic" order={4} />
      <DNode x={790} y={122} w={150} h={76} label="Policy dashboard" sub="100+ tariff scenarios" tone="accent" order={5} />
      <DEdge d="M180 160 C205 160 205 78 253 78" order={1} />
      <DEdge d="M180 160 H253" order={2} />
      <DEdge d="M180 160 C205 160 205 242 253 242" order={3} />
      <DEdge d="M465 78 C510 78 510 160 558 160" tone="accent" order={4} />
      <DEdge d="M465 160 H558" tone="accent" order={4} />
      <DEdge d="M465 242 C510 242 510 160 558 160" tone="accent" order={4} />
      <DEdge d="M750 160 H788" tone="accent" order={5} />
    </Diagram>
  );
}

function NeuralRetrieval({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={360}
      label="Neural Retrieval framework. Top lane, fine-tuning: Hugging Face Transformers models are adapted with PEFT using LoRA and QLoRA, trained with Flash Attention and gradient checkpointing, for embeddings, text classification and LLM fine-tuning. Bottom lane, retrieval: a query is embedded, searched in a FAISS index, reranked by a Cross-Encoder and passed into RAG with MCP, and the pipeline is evaluated with Recall@K, MRR and MAP."
    >
      <DGroup x={10} y={22} w={930} h={140} label="Fine-tuning" order={0} />
      <DNode x={30} y={64} w={190} label="HF Transformers" sub="pretrained models" tone="muted" order={0} />
      <DNode x={265} y={64} w={190} label="PEFT" sub="LoRA · QLoRA" tone="accent" order={1} />
      <DNode x={500} y={64} w={200} label="Efficient training" sub="Flash Attention · checkpointing" order={2} />
      <DNode x={745} y={64} w={175} label="Fine-tuned models" sub="embedding · classification" order={3} />
      <DEdge d="M220 92 H263" order={1} />
      <DEdge d="M455 92 H498" tone="accent" order={2} />
      <DEdge d="M700 92 H743" order={3} />

      <DGroup x={10} y={196} w={930} h={150} label="Retrieval" order={3} />
      <DNode x={30} y={244} w={130} label="Query" tone="muted" order={3} />
      <DNode x={200} y={244} w={150} label="FAISS" sub="semantic search" order={4} />
      <DNode x={390} y={244} w={170} label="Cross-Encoder" sub="reranking" tone="accent" order={5} />
      <DNode x={600} y={244} w={130} label="RAG · MCP" sub="generation" order={6} />
      <DNode x={770} y={244} w={150} label="Evaluation" sub="Recall@K · MRR · MAP" tone="accent" order={7} />
      <DEdge d="M160 272 H198" order={4} />
      <DEdge d="M350 272 H388" tone="accent" order={5} />
      <DEdge d="M560 272 H598" order={6} />
      <DEdge d="M730 272 H768" order={7} />
      <DEdge d="M832 120 C832 180 275 180 275 242" dashed order={4} label="embeddings" labelAt={{ x: 560, y: 174 }} />
    </Diagram>
  );
}

function Fatigue({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={330}
      label="Fatigue Strength Predictor pipeline. Input data with 26 features is filtered with VIF and analysed with SHAP to remove data leakage, leaving 16 (NC) and 7 (C) features. A mixture of experts — Gradient Boosting and Random Forest — is compared against Ridge and MLP baselines, validated with 5-fold cross-validation to R-squared 0.973 on holdout data, and deployed as a Streamlit application."
    >
      <DNode x={20} y={130} w={130} label="Input data" sub="26 features" tone="muted" order={0} />
      <DGroup x={180} y={60} w={200} h={200} label="Leakage removal" order={1} />
      <DNode x={200} y={90} w={160} label="VIF filtering" sub="multicollinearity" order={1} />
      <DNode x={200} y={180} w={160} label="SHAP analysis" sub="attribution" order={2} />
      <DNode x={410} y={130} w={130} label="Features" sub="16 (NC) · 7 (C)" tone="accent" order={3} />
      <DGroup x={568} y={22} w={204} h={200} label="Mixture of experts" order={4} />
      <DNode x={584} y={52} w={172} label="Gradient Boosting" order={4} />
      <DNode x={584} y={142} w={172} label="Random Forest" order={4} />
      <DNode x={584} y={250} w={172} label="Ridge · MLP" sub="baselines" tone="muted" order={4} />
      <DNode x={790} y={60} w={150} label="R² = 0.973" sub="holdout · 5-fold CV" tone="accent" order={6} />
      <DNode x={790} y={170} w={150} label="Streamlit app" sub="interactive" order={7} />
      <DEdge d="M150 158 C168 158 168 118 198 118" order={1} />
      <DEdge d="M280 146 V178" order={2} />
      <DEdge d="M360 208 C385 208 385 158 408 158" order={3} />
      <DEdge d="M540 158 C556 158 556 80 582 80" tone="accent" order={4} />
      <DEdge d="M540 158 C556 158 556 170 582 170" tone="accent" order={4} />
      <DEdge d="M540 158 C556 158 556 278 582 278" dashed order={5} />
      <DEdge d="M772 120 C780 120 780 88 788 88" tone="accent" order={6} />
      <DEdge d="M865 116 V168" order={7} />
    </Diagram>
  );
}

function Forensics({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={330}
      label="Cross-Generator AI Image Forensics architecture. A LightGBM classifier is trained on 1,700+ images from 10 generative models. At inference, an image's metadata and CLIP features are extracted and scored by LightGBM inside a sub-second Flask API running on CPU, validated with pytest; it reached 0.90 out-of-distribution AUROC and 0.87 under JPEG-50 compression."
    >
      <DNode x={20} y={30} w={200} label="Training set" sub="1,700+ images · 10 generators" tone="muted" order={0} />
      <DNode x={20} y={180} w={130} label="Image" tone="muted" order={1} />
      <DGroup x={185} y={120} w={570} h={190} label="Flask API · CPU inference · pytest" order={1} />
      <DNode x={210} y={150} w={170} label="Image metadata" order={2} />
      <DNode x={210} y={240} w={170} label="CLIP features" sub="embedding" order={2} />
      <DNode x={440} y={180} w={150} label="LightGBM" sub="classifier" tone="accent" order={3} />
      <DNode x={630} y={180} w={110} label="Verdict" sub="sub-second" order={4} />
      <DNode x={790} y={150} w={150} label="OOD AUROC" sub="0.71 → 0.90" tone="accent" order={5} />
      <DNode x={790} y={240} w={150} label="JPEG-50" sub="AUROC 0.87" order={5} />
      <DEdge d="M220 58 C430 58 515 90 515 178" dashed order={1} label="train" labelAt={{ x: 400, y: 50 }} />
      <DEdge d="M150 208 C175 208 175 178 208 178" order={2} />
      <DEdge d="M150 208 C175 208 175 268 208 268" order={2} />
      <DEdge d="M380 178 C410 178 410 208 438 208" tone="accent" order={3} />
      <DEdge d="M380 268 C410 268 410 208 438 208" tone="accent" order={3} />
      <DEdge d="M590 208 H628" tone="accent" order={4} />
      <DEdge d="M740 208 C765 208 765 178 788 178" dashed arrow={false} order={5} />
      <DEdge d="M740 208 C765 208 765 268 788 268" dashed arrow={false} order={5} />
    </Diagram>
  );
}

function Ugac({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={340}
      label="UGAC Project Allocation Platform architecture. Undergraduates use a React and Next.js frontend styled with Tailwind CSS for SOP uploads, preference ranking, global filtering and application management. It talks over REST APIs with CORS to a Django REST Framework backend using MVT architecture, OAuth authentication and a SQL database, all deployed on Institute Gymkhana servers."
    >
      <DNode x={20} y={140} w={130} label="Students" sub="6,000+ UGs" tone="muted" order={0} />
      <DGroup x={185} y={22} w={755} h={300} label="Institute Gymkhana servers" order={1} />
      <DNode x={210} y={60} w={230} label="Next.js · React" sub="Tailwind CSS" tone="accent" order={1} />
      <DGroup x={210} y={160} w={230} h={120} label="Student features" order={2} />
      <text x={325} y={200} textAnchor="middle" fontSize={12} fill="var(--ink-1)">SOP uploads</text>
      <text x={325} y={222} textAnchor="middle" fontSize={12} fill="var(--ink-1)">Preference ranking</text>
      <text x={325} y={244} textAnchor="middle" fontSize={12} fill="var(--ink-1)">Global filtering</text>
      <text x={325} y={266} textAnchor="middle" fontSize={12} fill="var(--ink-1)">Application management</text>
      <DNode x={500} y={60} w={150} label="REST APIs" sub="CORS" order={3} />
      <DNode x={710} y={60} w={210} label="Django REST" sub="Framework · MVT" tone="accent" order={4} />
      <DNode x={710} y={160} w={210} label="OAuth" sub="authentication" order={5} />
      <DNode x={710} y={250} w={210} label="SQL database" order={5} />
      <DEdge d="M150 168 C175 168 175 88 208 88" order={1} />
      <DEdge d="M325 116 V152" dashed arrow={false} order={2} />
      <DEdge d="M440 88 H498" tone="accent" order={3} />
      <DEdge d="M650 88 H708" tone="accent" order={4} />
      <DEdge d="M815 116 V158" order={5} />
      <DEdge d="M920 96 C934 96 934 270 922 270" order={5} />
    </Diagram>
  );
}

function Airship({ className, minWidth }: DiagramProps) {
  return (
    <Diagram
      className={className}
      minWidth={minWidth}
      height={320}
      label="Solar airship route planner. GRIB meteorological data provides wind fields, cloud cover and solar flux, which are modelled as dynamic obstacle constraints; a cost function over those constraints drives A* and Dijkstra's algorithm to produce a route for the 6,000+ km transatlantic autonomous flight challenge."
    >
      <DNode x={20} y={132} w={120} label="GRIB data" sub="meteorological" tone="muted" order={0} />
      <DGroup x={170} y={22} w={200} h={276} label="Weather fields" order={1} />
      <DNode x={190} y={50} w={160} label="Wind fields" order={1} />
      <DNode x={190} y={132} w={160} label="Cloud cover" order={1} />
      <DNode x={190} y={214} w={160} label="Solar flux" order={1} />
      <DNode x={405} y={132} w={170} label="Dynamic obstacles" sub="constraints" order={2} />
      <DNode x={610} y={132} w={130} label="Cost function" tone="accent" order={3} />
      <DGroup x={770} y={60} w={170} h={200} label="Planner" order={4} />
      <DNode x={790} y={90} w={130} label="A*" sub="heuristic search" tone="accent" order={4} />
      <DNode x={790} y={180} w={130} label="Dijkstra" sub="shortest path" order={4} />
      <DEdge d="M140 160 C162 160 162 78 188 78" order={1} />
      <DEdge d="M140 160 H188" order={1} />
      <DEdge d="M140 160 C162 160 162 242 188 242" order={1} />
      <DEdge d="M350 78 C380 78 380 160 403 160" order={2} />
      <DEdge d="M350 160 H403" order={2} />
      <DEdge d="M350 242 C380 242 380 160 403 160" order={2} />
      <DEdge d="M575 160 H608" tone="accent" order={3} />
      <DEdge d="M740 160 C760 160 760 118 788 118" tone="accent" order={4} />
      <DEdge d="M740 160 C760 160 760 208 788 208" order={4} />
      <text x={855} y={296} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)">
        route · 6,000+ km challenge
      </text>
    </Diagram>
  );
}

const registry: Record<DiagramId, (p: DiagramProps) => React.JSX.Element> = {
  graphrag: GraphRag,
  vlm: Vlm,
  mot: Mot,
  'coding-duel': CodingDuel,
  'deep-rl': DeepRl,
  'sih-tariff': SihTariff,
  'neural-retrieval': NeuralRetrieval,
  fatigue: Fatigue,
  forensics: Forensics,
  ugac: Ugac,
  airship: Airship,
};

export function ProjectDiagram({ id, className, minWidth }: { id: DiagramId; className?: string; minWidth?: number }) {
  const D = registry[id];
  return <D className={className} minWidth={minWidth} />;
}
