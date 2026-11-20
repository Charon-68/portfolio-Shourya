/**
 * Projects — the single source for the Work index and every case study.
 *
 * Source of truth: Shourya-Resume.pdf. Every metric, technology, role, date and club is taken
 * from it verbatim or near-verbatim. Explanatory framing ("problem", "implementation") only
 * restates what the resume says in readable prose — it adds no new facts, numbers or claims.
 * Unknowns are typed TODOs (ids map to docs/CONTENT-TODO.md). Never fill them by guessing.
 */
import type { MaybeLink } from './profile';

export type ProjectTier = 'flagship' | 'selected' | 'field';
export type DiagramId =
  | 'graphrag'
  | 'vlm'
  | 'mot'
  | 'coding-duel'
  | 'deep-rl'
  | 'sih-tariff'
  | 'neural-retrieval'
  | 'fatigue'
  | 'forensics'
  | 'ugac'
  | 'airship';

export type Metric = {
  /** Exact value as on the resume. */
  value: string;
  label: string;
  context?: string | { todo: string };
  tone?: 'default' | 'before';
};

export type Project = {
  slug: string;
  no: string;
  tier: ProjectTier;
  title: string;
  category: string;
  /** Programme / club / course / organisation — as on the resume. */
  context: string;
  period: string;
  /** One sentence for the index. */
  summary: string;
  /** Lead paragraph on the case study. */
  intro: string;
  problem: string;
  architecture: { diagram: DiagramId | null; title: string; caption: string };
  /** What Shourya built — resume bullets, lightly edited for reading. */
  contribution: string[];
  implementation: { heading: string; body: string }[];
  stack: { group: string; items: string[] }[];
  metrics: Metric[];
  /** Shown instead of / alongside metrics when results are qualitative or values are missing. */
  resultsNote?: string;
  links: { repo: MaybeLink; demo: MaybeLink };
  /** Content gaps specific to this project (CONTENT-TODO ids). */
  todos: string[];
};

const noLinks = (): Project['links'] => ({ repo: { href: null, todo: 'C5' }, demo: { href: null, todo: 'C5' } });
/** Public repo on github.com/Charon-68 (matched to the project, 2026-11-20); no live demo known. */
const repo = (href: string): Project['links'] => ({ repo: { href, todo: 'C5' }, demo: { href: null, todo: 'C5' } });

export const projects: Project[] = [
  // ───────────────────────────── Flagship ─────────────────────────────
  {
    slug: 'legal-graphrag',
    no: '01',
    tier: 'flagship',
    title: 'Legal GraphRAG System',
    category: 'Retrieval-Augmented Generation',
    context: 'Summer of Science · Maths and Physics Club',
    period: 'May’26 – Jul’26',
    summary:
      'Hybrid retrieval and a Neo4j knowledge graph over 11.5K legal contract chunks, answered with citations by a local Qwen3-8B.',
    intro:
      'A retrieval system for legal contracts that combines keyword search, dense embeddings and a knowledge graph, then answers with citation-grounded responses from a model running locally.',
    problem:
      'Contract questions hinge on exact clause wording and on how clauses, parties and documents relate to each other. Keyword search alone misses paraphrases, embeddings alone blur exact terms, and neither follows relationships across chunks. The system needed to retrieve the right passages, connect them, and generate answers that cite their sources.',
    architecture: {
      diagram: 'graphrag',
      title: 'Hybrid retrieval and graph expansion',
      caption:
        'Sparse (BM25) and dense (MiniLM in ChromaDB) retrieval are fused with Reciprocal Rank Fusion; a Cross-Encoder reranks, a Neo4j knowledge graph with vector search adds multi-hop context, and LangChain hands the result to Qwen3-8B on Ollama.',
    },
    contribution: [
      'Built a hybrid retrieval pipeline over 11.5K legal contract chunks using BM25, MiniLM, ChromaDB and Reciprocal Rank Fusion.',
      'Designed a Neo4j knowledge graph with vector search and multi-hop retrieval, reaching 5.5 s end-to-end query latency.',
      'Integrated Cross-Encoder (ms-marco-MiniLM-L-6-v2) reranking, LangChain orchestration, ChromaDB and a local Ollama (Qwen3-8B) model for citation-grounded GraphRAG responses — Recall@5 = 0.80, MRR = 1.00.',
    ],
    implementation: [
      {
        heading: 'Two retrievers, one ranking',
        body: 'BM25 catches exact clause language; MiniLM embeddings stored in ChromaDB catch paraphrase. Reciprocal Rank Fusion merges their rankings so a passage that either retriever ranks highly can surface.',
      },
      {
        heading: 'Following relationships',
        body: 'A Neo4j knowledge graph with vector search supports multi-hop retrieval — moving from a retrieved passage to related entities and passages instead of treating every chunk in isolation.',
      },
      {
        heading: 'Precision before generation',
        body: 'A Cross-Encoder (ms-marco-MiniLM-L-6-v2) reranks candidates before LangChain passes the context to Qwen3-8B served locally through Ollama, which produces citation-grounded answers.',
      },
    ],
    stack: [
      { group: 'Retrieval', items: ['BM25', 'MiniLM', 'ChromaDB', 'Reciprocal Rank Fusion'] },
      { group: 'Knowledge graph', items: ['Neo4j', 'Vector search', 'Multi-hop retrieval'] },
      { group: 'Reranking', items: ['Cross-Encoder', 'ms-marco-MiniLM-L-6-v2'] },
      { group: 'Generation', items: ['LangChain', 'Ollama', 'Qwen3-8B'] },
    ],
    metrics: [
      { value: '0.80', label: 'Recall@5' },
      { value: '1.00', label: 'MRR' },
      { value: '5.5s', label: 'End-to-end query latency' },
      { value: '11.5K', label: 'Legal contract chunks indexed' },
    ],
    links: noLinks(),
    todos: ['C5'],
  },
  {
    slug: 'vision-meets-transformers',
    no: '02',
    tier: 'flagship',
    title: 'Vision Meets Transformers',
    category: 'Vision-Language Models · From Scratch',
    context: 'Seasons of Code · Web and Coding Club',
    period: 'May’26 – Jul’26',
    summary:
      'A 5.6M-parameter vision-language model built from scratch, a CLIP-style dual encoder, and an ablation study of gradient collapse in deep Transformers.',
    intro:
      'Building a vision-language model from first principles — attention, cross-attention and contrastive alignment — with every module unit-tested, alongside an ablation study of gradient collapse in deep Transformers.',
    problem:
      'Pretrained vision-language models hide their mechanics. Implementing one from scratch — and testing each module in isolation — makes it possible to see how image and text representations are aligned, and to diagnose what breaks as Transformer stacks get deeper.',
    architecture: {
      diagram: 'vlm',
      title: 'Dual encoder and cross-attending decoder',
      caption:
        'A CLIP-style dual encoder aligns image and text embeddings with an InfoNCE loss; a Transformer decoder with multi-head self-attention and cross-attention to image features generates text.',
    },
    contribution: [
      'Built a 5.6M-parameter VLM from scratch using a Transformer decoder, multi-head self-attention and cross-attention.',
      'Trained a CLIP-style dual encoder with InfoNCE loss on Flickr8k with cosine learning-rate scheduling, with 8/8 modules unit-tested.',
      'Diagnosed gradient collapse in deep Transformers through residual-connection ablation, measuring 49% loss degradation.',
      'Benchmarked Vision Transformers on CIFAR-10, reaching 67.5% validation accuracy through end-to-end training.',
    ],
    implementation: [
      {
        heading: 'The model',
        body: 'A Transformer decoder built from multi-head self-attention and cross-attention — 5.6M parameters in total, written from scratch.',
      },
      {
        heading: 'Contrastive alignment',
        body: 'A CLIP-style dual encoder trained on Flickr8k with an InfoNCE loss and cosine learning-rate scheduling pulls matching image–caption pairs together in a shared embedding space. All 8 modules are covered by unit tests.',
      },
      {
        heading: 'Why deep stacks collapse',
        body: 'Gradient collapse in deep Transformers was diagnosed with a residual-connection ablation, which measured a 49% degradation in loss.',
      },
      {
        heading: 'Benchmarking ViTs',
        body: 'Vision Transformers trained end to end on CIFAR-10 reached 67.5% validation accuracy.',
      },
    ],
    stack: [
      { group: 'Architecture', items: ['Transformer decoder', 'Multi-head self-attention', 'Cross-attention', 'Vision Transformer'] },
      { group: 'Training', items: ['CLIP-style dual encoder', 'InfoNCE loss', 'Cosine LR scheduling', 'Unit tests'] },
      { group: 'Data', items: ['Flickr8k', 'CIFAR-10'] },
    ],
    metrics: [
      { value: '5.6M', label: 'Parameters, built from scratch' },
      { value: '8/8', label: 'Modules unit-tested' },
      { value: '49%', label: 'Loss degradation without residual connections' },
      { value: '67.5%', label: 'ViT validation accuracy on CIFAR-10' },
    ],
    links: repo('https://github.com/Charon-68/SOC_MultiModal_Transformer_24b2222'),
    todos: ['C5'],
  },
  {
    slug: 'traffic-analytics-mot',
    no: '03',
    tier: 'flagship',
    title: 'Traffic Analytics and Multi-Object Tracking',
    category: 'Computer Vision · Real-Time Systems',
    context: 'WiDS · Analytics Club',
    period: 'Nov’25 – Dec’25',
    summary:
      'Real-time vehicle detection, tracking and speed estimation from traffic video, served through a FastAPI and Streamlit dashboard in Docker.',
    intro:
      'A real-time traffic analytics platform: detect vehicles, keep a consistent identity for each across frames, predict their motion, and estimate speed — then serve it as an interactive dashboard.',
    problem:
      'Measuring traffic from video means detecting every vehicle in every frame and keeping each one’s identity stable across frames before speed can be estimated. All of it has to run fast enough for live inference.',
    architecture: {
      diagram: 'mot',
      title: 'Detect, track, measure, serve',
      caption:
        'YOLOv8 detects vehicles per frame; DeepSORT and ByteTrack associate detections into tracks, with Kalman-filter motion prediction; OpenCV-based logic estimates speed; FastAPI serves results to a Streamlit dashboard, packaged with Docker.',
    },
    contribution: [
      'Developed a real-time traffic analytics platform using YOLOv8, DeepSORT and ByteTrack for vehicle detection and tracking.',
      'Implemented Kalman-filter-based motion prediction and OpenCV-based traffic intelligence for speed estimation.',
      'Deployed an interactive analytics dashboard on Streamlit using FastAPI and Docker, enabling real-time inference.',
    ],
    implementation: [
      { heading: 'Detection', body: 'YOLOv8 finds vehicles in each frame of the traffic video.' },
      {
        heading: 'Tracking',
        body: 'DeepSORT and ByteTrack link detections into persistent tracks so each vehicle keeps one identity; a Kalman filter predicts motion between frames.',
      },
      { heading: 'Speed estimation', body: 'OpenCV-based traffic intelligence turns tracked motion into speed estimates.' },
      {
        heading: 'Serving',
        body: 'A FastAPI backend and a Streamlit dashboard, containerised with Docker, provide real-time inference and interactive analytics.',
      },
    ],
    stack: [
      { group: 'Detection & tracking', items: ['YOLOv8', 'DeepSORT', 'ByteTrack', 'Kalman filter'] },
      { group: 'Vision', items: ['OpenCV'] },
      { group: 'Serving', items: ['FastAPI', 'Streamlit', 'Docker'] },
    ],
    metrics: [],
    resultsNote: 'Real-time inference through the deployed dashboard.',
    links: noLinks(),
    todos: ['C5', 'C18'],
  },
  {
    slug: 'coding-duel-system',
    no: '04',
    tier: 'flagship',
    title: 'Coding Duel System',
    category: 'Full-Stack Architecture',
    context: 'Self-directed project',
    period: 'May’26 – Jul’26',
    summary:
      'A real-time competitive programming platform with an asynchronous, Docker-sandboxed judging pipeline, live verdicts and ELO rankings.',
    intro:
      'A platform for real-time coding duels: submissions are judged asynchronously in isolated Docker sandboxes, verdicts stream back live, and results feed ELO rankings.',
    problem:
      'Running untrusted code safely, judging it without blocking the application, and pushing results to both players the moment they are ready are the core problems of any live competitive-programming system.',
    architecture: {
      diagram: 'coding-duel',
      title: 'Asynchronous judging with live verdicts',
      caption:
        'The Next.js client talks to an Express API; submissions enter a BullMQ queue backed by Redis and run in Docker sandboxes; verdicts stream back over Socket.io, and results persist in PostgreSQL through Prisma.',
    },
    contribution: [
      'Built a competitive programming platform (Next.js, Express, PostgreSQL, Redis, Socket.io) for real-time duels.',
      'Designed an asynchronous code-judging pipeline using BullMQ and Docker-sandboxed execution for secure, isolated evaluation.',
      'Implemented a 16-table PostgreSQL schema with Prisma ORM to manage ELO rankings and stream live verdicts.',
    ],
    implementation: [
      {
        heading: 'Judging off the request path',
        body: 'Submissions are queued with BullMQ (on Redis) instead of being executed inside the API request, so the platform stays responsive while code runs.',
      },
      {
        heading: 'Isolation',
        body: 'Each submission executes in a Docker sandbox — secure, isolated evaluation of untrusted code.',
      },
      { heading: 'Live verdicts', body: 'Socket.io streams verdicts to players as soon as judging completes.' },
      {
        heading: 'Data model',
        body: 'A 16-table PostgreSQL schema, managed with Prisma ORM, underpins ELO rankings and the live verdict stream.',
      },
    ],
    stack: [
      { group: 'Frontend', items: ['Next.js'] },
      { group: 'Backend', items: ['Express', 'Socket.io'] },
      { group: 'Judging', items: ['BullMQ', 'Redis', 'Docker'] },
      { group: 'Data', items: ['PostgreSQL', 'Prisma ORM'] },
    ],
    metrics: [{ value: '16', label: 'Tables in the PostgreSQL schema' }],
    resultsNote: 'Secure, isolated evaluation, with verdicts streamed live and ELO rankings managed in PostgreSQL.',
    links: repo('https://github.com/Charon-68/CodeDuel'),
    todos: ['C5'],
  },
  {
    slug: 'deep-rl-trading',
    no: '05',
    tier: 'flagship',
    title: 'Deep RL for Stock Trading',
    category: 'Reinforcement Learning · Quantitative Finance',
    context: 'FinSearch’26 · Finance Club, IIT Bombay',
    period: 'Jul’26 – Aug’26',
    summary:
      'DQN and DDPG trading agents on engineered OHLCV, RSI and MACD features: 49.4% return, 0.66 Sharpe, ahead of Buy-and-Hold and MA Crossover baselines.',
    intro:
      'A custom reinforcement-learning trading pipeline in which DQN and DDPG agents learn from engineered market features, tuned by grid search and evaluated by backtesting against classic strategies.',
    problem:
      'A trading agent is only as good as the market state it observes and the baselines it is judged against. The work was to represent the market well, train agents that improve risk-adjusted returns, and compare them honestly with simple strategies.',
    architecture: {
      diagram: 'deep-rl',
      title: 'From market data to backtested policy',
      caption:
        'OHLCV prices are engineered into RSI and MACD features that form the agent’s state; DQN and DDPG agents act in a custom trading environment; grid-searched configurations are backtested against Buy-and-Hold and Moving Average Crossover.',
    },
    contribution: [
      'Built a custom RL trading pipeline using DQN and DDPG, achieving a 49.4% return and a 0.66 Sharpe ratio.',
      'Engineered OHLCV, RSI and MACD feature representations that reduced maximum drawdown from 19.4% to 18.2%.',
      'Beat Buy-and-Hold and Moving Average Crossover by 12.3% and 38.7% after grid-search tuning and backtesting.',
    ],
    implementation: [
      { heading: 'State', body: 'OHLCV data with RSI and MACD indicators forms the observation the agents act on.' },
      { heading: 'Agents', body: 'Two deep RL methods — DQN and DDPG — trained in a custom trading pipeline.' },
      {
        heading: 'Evaluation',
        body: 'Grid-search tuning and backtesting against Buy-and-Hold and a Moving Average Crossover strategy.',
      },
    ],
    stack: [
      { group: 'Agents', items: ['DQN', 'DDPG'] },
      { group: 'Features', items: ['OHLCV', 'RSI', 'MACD'] },
      { group: 'Evaluation', items: ['Grid search', 'Backtesting', 'Sharpe ratio', 'Max drawdown'] },
    ],
    metrics: [
      { value: '49.4%', label: 'Return' },
      { value: '0.66', label: 'Sharpe ratio' },
      { value: '19.4%', label: 'Max drawdown · before feature engineering', tone: 'before' },
      { value: '18.2%', label: 'Max drawdown · after' },
      { value: '+12.3%', label: 'Over Buy-and-Hold' },
      { value: '+38.7%', label: 'Over Moving Average Crossover' },
    ],
    links: repo('https://github.com/Charon-68/DeepRL-StockTrading'),
    todos: ['C5'],
  },

  // ───────────────────────────── Selected ─────────────────────────────
  {
    slug: 'sih-tariff-simulator',
    no: '06',
    tier: 'selected',
    title: 'AI Tariff Simulator',
    category: 'Forecasting · Policy Analytics',
    context: 'Smart India Hackathon (Nationals) · Government of India',
    period: 'Apr’26 – May’26',
    summary:
      'Tariff-scenario forecasting with SARIMAX, XGBoost and LSTM over 15+ years of trade data — selected among the top 33 pre-finalists.',
    intro:
      'An AI-powered tariff simulator and policy analytics dashboard built for the Smart India Hackathon, representing IIT Bombay at the pan-India event.',
    problem:
      'Policy makers need to see how tariff changes might play out before making them. That calls for forecasting models over long trade histories and a way to compare many scenarios side by side.',
    architecture: {
      diagram: 'sih-tariff',
      title: 'Forecasting and scenario modelling',
      caption: 'SARIMAX, XGBoost and LSTM models forecast macroeconomic outcomes; a dashboard models 100+ tariff scenarios on 15+ years of past trade data.',
    },
    contribution: [
      'Selected among the top 33 pre-finalists and secured ₹10K funding from IIC to represent IIT Bombay at the pan-India Smart India Hackathon.',
      'Built an AI-powered tariff simulator using SARIMAX, XGBoost and LSTM for macroeconomic scenario forecasting.',
      'Developed and deployed a policy analytics dashboard modelling 100+ tariff scenarios on 15+ years of past trade data.',
    ],
    implementation: [
      { heading: 'Forecasting', body: 'Three model families — SARIMAX, XGBoost and LSTM — for macroeconomic scenario forecasting.' },
      { heading: 'Scenarios', body: 'A deployed policy analytics dashboard models 100+ tariff scenarios over 15+ years of historical trade data.' },
    ],
    stack: [
      { group: 'Models', items: ['SARIMAX', 'XGBoost', 'LSTM'] },
      { group: 'Product', items: ['Policy analytics dashboard'] },
    ],
    metrics: [
      { value: '33', label: 'Top pre-finalists, Smart India Hackathon' },
      { value: '₹10K', label: 'Funding from IIC' },
      { value: '100+', label: 'Tariff scenarios modelled' },
      { value: '15+', label: 'Years of trade data' },
    ],
    links: noLinks(),
    todos: ['C5'],
  },
  {
    slug: 'neural-retrieval',
    no: '07',
    tier: 'selected',
    title: 'Neural Retrieval Project',
    category: 'NLP · Retrieval & Fine-Tuning',
    context: 'NLP Bootcamp (Advanced Track) · Analytics Club',
    period: 'Oct’25 – Nov’25',
    summary:
      'An NLP framework spanning parameter-efficient fine-tuning (LoRA/QLoRA), FAISS semantic retrieval with Cross-Encoder reranking, MCP and RAG.',
    intro:
      'An NLP framework covering transformer embeddings, text classification, efficient LLM fine-tuning and a semantic retrieval pipeline evaluated with standard ranking metrics.',
    problem:
      'Fine-tuning language models efficiently calls for parameter-efficient methods and memory-saving techniques, and retrieval quality needs to be measured with standard ranking metrics rather than assumed.',
    architecture: {
      diagram: 'neural-retrieval',
      title: 'Fine-tuning and semantic retrieval',
      caption: 'Hugging Face Transformers with PEFT (LoRA/QLoRA) for fine-tuning; FAISS retrieval with Cross-Encoder reranking; MCP and RAG integration.',
    },
    contribution: [
      'Built an NLP framework with Hugging Face Transformers, PEFT (LoRA/QLoRA), FAISS, MCP and RAG.',
      'Implemented transformer embeddings, text classification, and LLM fine-tuning with Flash Attention and gradient checkpointing.',
      'Built a semantic retrieval pipeline with Cross-Encoder reranking and FAISS, evaluated with Recall@K, MRR and MAP.',
    ],
    implementation: [
      { heading: 'Efficient fine-tuning', body: 'PEFT with LoRA and QLoRA, plus Flash Attention and gradient checkpointing, for LLM fine-tuning.' },
      { heading: 'Retrieval', body: 'A FAISS-based semantic retrieval pipeline with Cross-Encoder reranking, evaluated with Recall@K, MRR and MAP.' },
    ],
    stack: [
      { group: 'Models', items: ['Hugging Face Transformers', 'PEFT', 'LoRA', 'QLoRA'] },
      { group: 'Efficiency', items: ['Flash Attention', 'Gradient checkpointing'] },
      { group: 'Retrieval', items: ['FAISS', 'Cross-Encoder', 'RAG', 'MCP'] },
    ],
    metrics: [],
    resultsNote: 'Evaluated with Recall@K, MRR and MAP.',
    links: repo('https://github.com/Charon-68/NLP_Bootcamp'),
    todos: ['C5', 'C19'],
  },
  {
    slug: 'fatigue-strength-predictor',
    no: '08',
    tier: 'selected',
    title: 'Fatigue Strength Predictor',
    category: 'Machine Learning · Materials',
    context: 'Course Project (ME228)',
    period: 'Jan’26 – Apr’26',
    summary:
      'A mixture-of-experts regressor for fatigue strength — R² = 0.973 on holdout data after VIF and SHAP analysis removed data leakage.',
    intro:
      'Predicting fatigue strength with an interpretable, leakage-free pipeline, deployed as an interactive Streamlit application.',
    problem:
      'With many correlated input features, a model can look accurate while learning from leakage. The work was to prune the feature space defensibly and then build a model that generalises better than standard baselines.',
    architecture: {
      diagram: 'fatigue',
      title: 'Feature pruning and mixture of experts',
      caption: 'VIF filtering and SHAP analysis reduce the feature space; a mixture of Gradient Boosting and Random Forest experts is validated with 5-fold cross-validation.',
    },
    contribution: [
      'Applied VIF filtering and SHAP analysis to eliminate data leakage, reducing the feature space from 26 to 16 (NC) and 7 (C).',
      'Built a mixture-of-experts pipeline (Gradient Boosting and Random Forest) that reduced overfitting and outperformed Ridge and MLP.',
      'Achieved R² = 0.973 on holdout data using 5-fold cross-validation, and deployed an interactive Streamlit application.',
    ],
    implementation: [
      { heading: 'Leakage-free features', body: 'VIF filtering and SHAP analysis cut the feature space from 26 to 16 (NC) and 7 (C).' },
      { heading: 'Mixture of experts', body: 'Gradient Boosting and Random Forest experts reduced overfitting and outperformed Ridge and MLP baselines.' },
      { heading: 'Delivery', body: 'Validated with 5-fold cross-validation and deployed as an interactive Streamlit application.' },
    ],
    stack: [
      { group: 'Analysis', items: ['VIF filtering', 'SHAP'] },
      { group: 'Models', items: ['Gradient Boosting', 'Random Forest', 'Ridge', 'MLP'] },
      { group: 'Delivery', items: ['5-fold cross-validation', 'Streamlit'] },
    ],
    metrics: [
      { value: '0.973', label: 'R² on holdout data' },
      { value: '26 → 16 / 7', label: 'Features after VIF + SHAP (NC / C)' },
      { value: '5-fold', label: 'Cross-validation' },
    ],
    links: repo('https://github.com/Charon-68/fatigue-strength-predictor'),
    todos: ['C5'],
  },
  {
    slug: 'ai-image-forensics',
    no: '09',
    tier: 'selected',
    title: 'Cross-Generator AI Image Forensics',
    category: 'Computer Vision · Detection',
    context: 'Self-directed project',
    period: 'Oct’25 – Nov’25',
    summary:
      'An AI-generated image detector across 10 generators — out-of-distribution AUROC raised from 0.71 to 0.90, holding 0.87 under JPEG-50 compression.',
    intro:
      'A detector for AI-generated images that has to work on generators it has not seen, and on images that have been compressed, served as a sub-second CPU API.',
    problem:
      'Detectors that work on known generators often fail on new ones and on re-compressed images. The aim was robust detection across generators and under compression, cheap enough to run on CPU.',
    architecture: {
      diagram: 'forensics',
      title: 'Features to verdict',
      caption: 'Image metadata and CLIP features feed a LightGBM classifier, served through a Flask API for CPU inference and validated with pytest.',
    },
    contribution: [
      'Built an AI image detector using LightGBM and a dataset of 1,700+ images from 10 different generative models.',
      'Improved out-of-distribution AUROC from 0.71 to 0.90, retaining 0.87 AUROC under JPEG-50 compression.',
      'Deployed a sub-second Flask API for CPU inference using image metadata and CLIP features, validated with pytest.',
    ],
    implementation: [
      { heading: 'Signals', body: 'Image metadata combined with CLIP features as inputs to a LightGBM classifier.' },
      { heading: 'Robustness', body: 'Out-of-distribution AUROC improved from 0.71 to 0.90, with 0.87 retained under JPEG-50 compression.' },
      { heading: 'Serving', body: 'A sub-second Flask API for CPU inference, validated with pytest.' },
    ],
    stack: [
      { group: 'Model', items: ['LightGBM', 'CLIP features', 'Image metadata'] },
      { group: 'Serving', items: ['Flask', 'pytest'] },
    ],
    metrics: [
      { value: '0.71', label: 'OOD AUROC · before', tone: 'before' },
      { value: '0.90', label: 'OOD AUROC · after' },
      { value: '0.87', label: 'AUROC under JPEG-50 compression' },
      { value: '1,700+', label: 'Images from 10 generative models' },
    ],
    links: repo('https://github.com/Charon-68/Cross-Generator-AI-Image-Forensics-'),
    todos: ['C5'],
  },

  // ─────────────────────────── In the field ───────────────────────────
  {
    slug: 'ugac-project-allocation',
    no: '10',
    tier: 'field',
    title: 'UGAC Project Allocation Platform',
    category: 'Full-Stack · Built for 6,000+ students',
    context: 'Web Convener · Undergraduate Academic Council (UGAC), IIT Bombay',
    period: 'May’25 – Apr’26',
    summary:
      'A full-stack project allocation platform for 6,000+ undergraduates — SOP uploads, preference ranking and OAuth — deployed on Institute Gymkhana servers.',
    intro:
      'A project allocation platform built for IIT Bombay undergraduates: statement-of-purpose uploads, preference ranking, global filtering and application management.',
    problem:
      'Matching thousands of students to projects needs one place to browse, apply, rank preferences and manage applications — with OAuth sign-in, deployed on Institute Gymkhana servers.',
    architecture: {
      diagram: 'ugac',
      title: 'Next.js frontend, Django REST backend',
      caption: 'A React/Next.js frontend with Tailwind CSS talks to a Django REST Framework backend over REST APIs with CORS and OAuth, deployed on Institute Gymkhana servers.',
    },
    contribution: [
      'Developed a full-stack Project Allocation Platform for 6,000+ undergraduates, supporting SOP uploads and preference ranking.',
      'Built the frontend with React.js, Next.js and Tailwind CSS, implementing global filtering and application management.',
      'Built a Django REST Framework backend with SQL, REST APIs, OAuth authentication and MVT architecture.',
      'Integrated frontend and backend through REST APIs and CORS, and deployed the application on Institute Gymkhana servers.',
    ],
    implementation: [
      { heading: 'Frontend', body: 'React.js, Next.js and Tailwind CSS, with global filtering and application management.' },
      { heading: 'Backend', body: 'Django REST Framework with SQL, REST APIs, OAuth authentication and MVT architecture.' },
      { heading: 'Deployment', body: 'Frontend and backend integrated over REST and CORS, deployed on Institute Gymkhana servers.' },
    ],
    stack: [
      { group: 'Frontend', items: ['React.js', 'Next.js', 'Tailwind CSS'] },
      { group: 'Backend', items: ['Django REST Framework', 'SQL', 'REST APIs', 'OAuth'] },
      { group: 'Deployment', items: ['Institute Gymkhana servers'] },
    ],
    metrics: [{ value: '6,000+', label: 'Undergraduates the platform was built for' }],
    links: noLinks(),
    todos: ['C5'],
  },
  {
    slug: 'solar-airship-route-planner',
    no: '11',
    tier: 'field',
    title: 'Solar Airship Route Planner',
    category: 'Path Planning · Meteorological Data',
    context: 'Avionics Engineer · Solar Powered Airship Research Team, IIT Bombay',
    period: 'Feb’25 – Present',
    summary:
      'Cost-function route planning with A* and Dijkstra over GRIB weather data, for a solar-powered airship targeting a 6,000+ km transatlantic autonomous flight.',
    intro:
      'Route planning for a solar-powered airship designed by a 4-tier technical team for a 6,000+ km transatlantic autonomous flight challenge at WSAR.',
    problem:
      'A solar airship’s best route depends on weather: wind fields, cloud cover and solar flux change along the way and act as dynamic obstacles. Planning has to weigh them, not just distance.',
    architecture: {
      diagram: 'airship',
      title: 'Weather-aware path planning',
      caption: 'GRIB meteorological data (wind fields, cloud cover, solar flux) becomes dynamic obstacle constraints for a cost-function-driven planner using A* and Dijkstra’s algorithm.',
    },
    contribution: [
      'Analysed GRIB meteorological data — wind fields, cloud cover and solar flux — to model dynamic obstacle constraints.',
      'Designed a cost-function-driven route planner using A* and Dijkstra’s algorithm for efficient heuristic path planning.',
    ],
    implementation: [
      { heading: 'Weather as constraints', body: 'Wind fields, cloud cover and solar flux from GRIB data are modelled as dynamic obstacle constraints.' },
      { heading: 'Planning', body: 'A cost function drives A* and Dijkstra’s algorithm for efficient heuristic path planning.' },
    ],
    stack: [
      { group: 'Data', items: ['GRIB', 'Wind fields', 'Cloud cover', 'Solar flux'] },
      { group: 'Planning', items: ['A*', 'Dijkstra’s algorithm', 'Cost functions'] },
    ],
    metrics: [{ value: '6,000+ km', label: 'Transatlantic autonomous flight challenge (WSAR)' }],
    links: noLinks(),
    todos: [],
  },
];

export const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p])) as Record<string, Project>;

export const tierIntro: Record<ProjectTier, string> = {
  flagship: 'Full case studies: problem, architecture, implementation and outcomes.',
  selected: 'Shorter studies — forecasting, retrieval, interpretable ML and forensics.',
  field: 'Systems built for teams and students at IIT Bombay.',
};

export const tierLabel: Record<ProjectTier, string> = {
  flagship: 'Flagship',
  selected: 'Selected',
  field: 'In the field',
};
