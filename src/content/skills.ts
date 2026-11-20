/**
 * Technical arsenal — groups and names exactly as on the resume (grouping per the brief).
 * Evidence (which projects / roles used a skill) is DERIVED from projects.ts and experience.ts
 * stacks by name matching — never asserted by hand, so a skill only shows evidence that the
 * resume itself states.
 */
import { experience } from './experience';
import { projects } from './projects';

export type Skill = { name: string; /** lowercase substrings to look for in stack items */ match?: string[] };
export type SkillGroup = { id: string; title: string; skills: Skill[] };

export const skillGroups: SkillGroup[] = [
  {
    id: 'fullstack',
    title: 'Full-stack development',
    skills: [
      { name: 'Python' },
      { name: 'C++' },
      { name: 'JavaScript' },
      { name: 'TypeScript' },
      { name: 'React.js', match: ['react'] },
      { name: 'Next.js' },
      { name: 'Express.js', match: ['express'] },
      { name: 'Node.js' },
      { name: 'Django' },
      { name: 'FastAPI' },
      { name: 'REST APIs' },
      { name: 'SQL', match: ['sql'] },
      { name: 'PostgreSQL' },
      { name: 'MongoDB' },
      { name: 'Redux Toolkit' },
      { name: 'Socket.io' },
      { name: 'HTML' },
      { name: 'CSS', match: ['tailwind css', ' css'] },
      { name: 'Tailwind CSS' },
    ],
  },
  {
    id: 'ml',
    title: 'Machine learning & AI',
    skills: [
      { name: 'PyTorch' },
      { name: 'TensorFlow' },
      { name: 'Scikit-learn' },
      { name: 'Hugging Face Transformers', match: ['hugging face', 'hf transformers'] },
      { name: 'LangChain' },
      { name: 'RAG' },
      { name: 'PEFT' },
      { name: 'LoRA' },
      { name: 'QLoRA' },
      { name: 'Keras' },
      { name: 'PyTorch Lightning' },
      { name: 'XGBoost' },
      { name: 'Ollama' },
      { name: 'FAISS' },
      { name: 'OpenCV' },
      { name: 'YOLOv8' },
      { name: 'DeepSORT' },
      { name: 'Flash Attention' },
      { name: 'MCP' },
    ],
  },
  {
    id: 'data',
    title: 'Data & scientific computing',
    skills: [
      { name: 'NumPy' },
      { name: 'Pandas' },
      { name: 'SciPy' },
      { name: 'Matplotlib' },
      { name: 'Seaborn' },
      { name: 'Apache Parquet', match: ['parquet'] },
      { name: 'PyArrow' },
    ],
  },
  {
    id: 'infra',
    title: 'Infrastructure & tools',
    skills: [
      { name: 'AWS', match: ['aws'] },
      { name: 'Docker' },
      { name: 'Apache Kafka', match: ['kafka'] },
      { name: 'Git' },
      { name: 'GitHub' },
      { name: 'Vercel' },
      { name: 'Power BI' },
      { name: 'Tableau' },
      { name: 'Postman' },
      { name: 'Bash' },
      { name: 'Linux' },
    ],
  },
];

export type Evidence = { kind: 'project' | 'role'; id: string; label: string; href: string };

const sources: Array<Evidence & { stack: string[] }> = [
  ...projects.map((p) => ({
    kind: 'project' as const,
    id: p.slug,
    label: p.title,
    href: `/work/${p.slug}`,
    stack: p.stack.flatMap((g) => g.items),
  })),
  ...experience.map((e) => ({
    kind: 'role' as const,
    id: e.id,
    label: `${e.role} · ${e.org.split(',')[0]}`,
    href: `#exp-${e.id}`,
    stack: e.stack,
  })),
];

const terms = (s: Skill) => s.match ?? [s.name.toLowerCase()];

/** Projects and roles whose stated stack mentions the skill. */
export function evidenceFor(skill: Skill): Evidence[] {
  const t = terms(skill);
  return sources
    .filter((src) => src.stack.some((item) => t.some((term) => (' ' + item.toLowerCase()).includes(term))))
    .map(({ stack: _stack, ...ev }) => ev);
}
