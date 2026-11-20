/**
 * Experience + positions of responsibility. Source: Shourya-Resume.pdf (verbatim facts).
 * Dates are month-precise ("YYYY-MM"); `end: null` = Present.
 */

export type ExperienceMetric = { value: string; label: string };

export type ExperienceEntry = {
  id: string;
  lane: 'work' | 'leadership';
  role: string;
  org: string;
  team?: string;
  start: string;
  end: string | null;
  /** The italic summary line on the resume, where present. */
  summary?: string;
  bullets: string[];
  stack: string[];
  metrics: ExperienceMetric[];
  /** Related case study slug. */
  caseStudy?: string;
  note?: string;
};

/** Timeline "now" — the resume's "Present". */
export const TIMELINE_NOW = '2026-11';
export const TIMELINE_START = '2025-02';

export const experience: ExperienceEntry[] = [
  {
    id: 'ola-krutrim',
    lane: 'work',
    role: 'Software Developer Intern',
    org: 'OLA Krutrim',
    team: 'Maps & Mobility',
    start: '2026-06',
    end: null,
    summary:
      'Worked on Ola Mobility’s geospatial pipeline, processing 5M+ GPS pings per second using Kafka and AWS S3 for ETA prediction.',
    bullets: [
      'Retrieved Apache Spark datasets from AWS S3 to process 11.5K+ Way IDs with 99.4% modified traffic metrics.',
      'Implemented an ETL pipeline for 11K+ Apache Spark partitions (part-*) using regular expressions and file I/O.',
      'Worked with Spark Streaming and Valhalla Map Matching for distributed GPS telemetry and traffic analytics pipelines.',
      'Used OSM, OSRM, routing engines and A*/Dijkstra’s algorithms for Ola Maps’ traffic-aware ETA prediction.',
    ],
    stack: ['Apache Kafka', 'AWS S3', 'Apache Spark', 'Spark Streaming', 'Valhalla Map Matching', 'OSM', 'OSRM', 'A*', 'Dijkstra', 'ETL'],
    metrics: [
      { value: '5M+', label: 'GPS pings per second' },
      { value: '11.5K+', label: 'Way IDs processed' },
      { value: '11K+', label: 'Spark partitions in the ETL' },
    ],
  },
  {
    id: 'petsgo-petsdoor',
    lane: 'work',
    role: 'Machine Learning Intern',
    org: 'PetsGo & PetsDoor Pvt Ltd',
    team: 'PINN & LLM',
    start: '2026-05',
    end: null,
    bullets: [
      'Optimised PINN training with mixed precision (BF16/FP32), mini-batching and L-BFGS, achieving a 5× speedup.',
      'Built metadata ingestion for 500M+ entities using Apache Parquet and PyArrow to support surrogate modelling.',
      'Built a knowledge-graph intrinsic generation pipeline for 10K+ entities using JSON Schema parsing and heuristic scoring.',
      'Developed a PDE-to-loss generator for modular PINNs across 13+ domains using SymPy and PyTorch autograd.',
    ],
    stack: ['PINNs', 'BF16/FP32 mixed precision', 'L-BFGS', 'Apache Parquet', 'PyArrow', 'JSON Schema', 'SymPy', 'PyTorch autograd'],
    metrics: [
      { value: '5×', label: 'PINN training speedup' },
      { value: '500M+', label: 'Entities in metadata ingestion' },
      { value: '13+', label: 'PDE domains in the loss generator' },
    ],
  },
  {
    id: 'sdotj',
    lane: 'work',
    role: 'Data Analytics Intern',
    org: 'SDOTJ Hospitality',
    start: '2026-06',
    end: '2026-07',
    summary: 'Awarded a Letter of Recommendation for excellent performance, strong work ethic and analytical skills.',
    bullets: [
      'Conducted market research on tourism, aviation and hospitality datasets using SQL for data extraction and EDA.',
      'Designed interactive dashboards in Power BI and Tableau to visualise KPIs, market trends and operational metrics.',
    ],
    stack: ['SQL', 'EDA', 'Power BI', 'Tableau'],
    metrics: [],
    note: 'Letter of Recommendation',
  },
  {
    id: 'ugac',
    lane: 'leadership',
    role: 'Web Convener',
    org: 'Undergraduate Academic Council (UGAC), IIT Bombay',
    start: '2025-05',
    end: '2026-04',
    bullets: [
      'Developed a full-stack Project Allocation Platform for 6,000+ undergraduates, supporting SOP uploads and preference ranking.',
      'Built the frontend with React.js, Next.js and Tailwind CSS; the backend with Django REST Framework, SQL, REST APIs and OAuth.',
      'Integrated frontend and backend over REST and CORS and deployed on Institute Gymkhana servers.',
    ],
    stack: ['React.js', 'Next.js', 'Tailwind CSS', 'Django REST Framework', 'SQL', 'REST APIs', 'OAuth'],
    metrics: [{ value: '6,000+', label: 'Undergraduates the platform was built for' }],
    caseStudy: 'ugac-project-allocation',
  },
  {
    id: 'airship',
    lane: 'leadership',
    role: 'Avionics Engineer',
    org: 'Solar Powered Airship Research Team, IIT Bombay',
    start: '2025-02',
    end: null,
    summary:
      '4-tier technical team designing a solar-powered airship for a 6,000+ km transatlantic autonomous flight challenge at WSAR.',
    bullets: [
      'Analysed GRIB meteorological data (wind fields, cloud cover, solar flux) to model dynamic obstacle constraints.',
      'Designed a cost-function-driven route planner using A* and Dijkstra’s algorithm for efficient heuristic path planning.',
    ],
    stack: ['GRIB', 'A*', 'Dijkstra', 'Cost functions'],
    metrics: [{ value: '6,000+ km', label: 'Autonomous flight challenge' }],
    caseStudy: 'solar-airship-route-planner',
  },
];

/** "Upcoming AI/ML Intern at American Express" — no dates on the resume (CONTENT-TODO C11). */
export const incoming = { role: 'AI/ML Intern', org: 'American Express', todo: 'C11' } as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-06" → "Jun’26" (resume style). */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]}’${String(y).slice(2)}`;
}

export function formatPeriod(e: Pick<ExperienceEntry, 'start' | 'end'>): string {
  return `${formatMonth(e.start)} – ${e.end ? formatMonth(e.end) : 'Present'}`;
}

/** Months since TIMELINE_START (inclusive start, so a 1-month role has width 1). */
export function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  const [y0, m0] = TIMELINE_START.split('-').map(Number);
  return (y - y0) * 12 + (m - m0);
}
