/**
 * About, achievements, certifications and Beyond Code. Source: Shourya-Resume.pdf.
 * The bio is first-person prose that only restates resume facts (CONTENT-TODO C20: Shourya to approve the voice).
 */

export const bio: string[] = [
  'I’m studying Mechanical Engineering at IIT Bombay, with a Minor in Computer Science and Engineering. Most of what I build sits where software engineering meets machine learning — retrieval systems, models written from scratch, real-time platforms, and the data pipelines underneath them.',
  'In 2026 that has meant geospatial pipelines for traffic-aware ETA prediction at OLA Krutrim, faster physics-informed neural network training at PetsGo & PetsDoor, and next, an AI/ML internship at American Express. On campus I built the project allocation platform for 6,000+ undergraduates as UGAC’s Web Convener, and I plan routes for a solar-powered airship.',
  'I like to understand a system from first principles — a vision-language model written from scratch, a GraphRAG pipeline measured with Recall@5 and MRR — and then make it hold up outside a notebook.',
];

export const education = {
  institution: 'Indian Institute of Technology Bombay',
  degree: 'B.Tech, Mechanical Engineering',
  minor: 'Minor in Computer Science and Engineering (CSE Department)',
  graduation: '2028',
  /** C10: CPI 8.15 — hidden until Shourya confirms it should be shown. */
  cpi: { value: '8.15', show: false, todo: 'C10' },
};

export type Achievement = {
  figure: string;
  /** Small trailing context after the figure, e.g. "of 600K+". */
  of?: string;
  title: string;
  detail: string;
};

/** Headline achievements — big figures (Achievements sub-section). */
export const achievements: Achievement[] = [
  {
    figure: '140',
    of: 'of 600K+',
    title: 'H.S.C. Board Merit List · District Topper',
    detail: 'Ranked 140th among 600K+ students in the official H.S.C. Board Merit List, and District Topper.',
  },
  {
    figure: 'Top 0.1%',
    title: 'CBSE Science · Merit Certificate',
    detail: 'Awarded the Merit Certificate for ranking among the top 0.1% of candidates nationwide in the CBSE Science Board Exam.',
  },
  {
    figure: '1450+',
    title: 'Codeforces Specialist',
    detail: 'Specialist rating of 1450+; rank 1,342 in Codeforces Round 1104 (Div. 1 + Div. 2) among 24K+ programmers.',
  },
  {
    figure: 'Top 1%',
    title: 'INSPIRE-SHE Scholarship',
    detail: 'Qualified for the INSPIRE-SHE Scholarship for ranking among the top 1% of students in Class XII State Boards.',
  },
];

/** Further honours — a quieter list under the figures. */
export const honours: string[] = [
  'Declared Medhavi Chhatra and awarded the Excellence Medal by the MSME Minister for academic distinction.',
  'Selected among the top 33 pre-finalists at Smart India Hackathon (Nationals), with ₹10K funding from IIC.',
  'Ranked 17th among 500+ participants in the CodeWars V5 hackathon (Web and Coding Club).',
  'Stood 4th in Web Brawl GC, building with the Next.js 14 App Router, TypeScript, Three.js and Framer Motion.',
];

export const certifications: { title: string; detail: string }[] = [
  { title: 'AWS Cloud certification', detail: 'Amazon S3, EC2, IAM and VPC.' },
  { title: 'Google Cloud MLOps', detail: 'Kubeflow Pipelines, TensorFlow Extended (TFX) and CI/CD.' },
  {
    title: 'JPMorgan Chase Quantitative Research job simulation',
    detail: 'Credit-risk models with dynamic programming and maximum log-likelihood optimisation on 10K+ loan records, reaching 99%+ ROC-AUC.',
  },
  {
    title: 'GenAI Data Analytics · Tata Group',
    detail: 'EDA, data imputation, SHAP-based interpretability and delinquency classification across 5+ financial risk stages, evaluated by precision, recall and F1.',
  },
];

export type BeyondItem = {
  id: 'mentoring' | 'frisbee' | 'keyboard' | 'competitions';
  figure: string;
  title: string;
  lines: string[];
};

export const beyond: BeyondItem[] = [
  {
    id: 'mentoring',
    figure: '10+',
    title: 'Mentoring',
    lines: [
      'Mentored 3 teams and 10+ students in the CodeWars V6 hackathon, guiding competitive-programming strategy.',
      'Guided 10+ mentees through technical projects in WiDS’25 (Analytics Club) and SoS’26 (Maths and Physics Club).',
    ],
  },
  {
    id: 'frisbee',
    figure: '2nd × 2',
    title: 'Ultimate Frisbee',
    lines: ['Second place at both Freshiesta’25 and the Institute Sports General Championship’26.'],
  },
  {
    id: 'keyboard',
    figure: '1 year',
    title: 'Keyboard',
    lines: ['A year of keyboard training under the National Sports Organization, as a compulsory non-credit course.'],
  },
  {
    id: 'competitions',
    figure: '17th',
    title: 'Hackathons & contests',
    lines: [
      '17th of 500+ in CodeWars V5; 4th in Web Brawl GC with a Next.js, TypeScript and Three.js build.',
      'Codeforces Round 1104: rank 1,342 among 24K+ programmers.',
    ],
  },
];
