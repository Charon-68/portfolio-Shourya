/**
 * Site chapters — drives the nav, the journal order and (from M4) camera waypoints.
 * Copy is factual and derived from the resume.
 */

export type ChapterId = 'work' | 'experience' | 'about' | 'beyond' | 'contact';

export type Chapter = {
  id: ChapterId;
  index: string;
  /** Nav label. */
  label: string;
  /** Chapter opener title. */
  title: string;
  lead: string;
};

export const chapters: Chapter[] = [
  {
    id: 'work',
    index: '01',
    label: 'Work',
    title: 'Selected Work',
    lead: 'Retrieval systems, models built from scratch, real-time platforms and learning agents — each told as an engineering case study.',
  },
  {
    id: 'experience',
    index: '02',
    label: 'Experience',
    title: 'Experience',
    lead: 'Internships at OLA Krutrim, PetsGo & PetsDoor and SDOTJ Hospitality, alongside engineering roles at IIT Bombay.',
  },
  {
    id: 'about',
    index: '03',
    label: 'About',
    title: 'About',
    lead: 'B.Tech at IIT Bombay with a Minor in Computer Science and Engineering — and a habit of building the whole system.',
  },
  {
    id: 'beyond',
    index: '04',
    label: 'Beyond Code',
    title: 'Beyond Code',
    lead: 'Mentoring, competitive programming, Ultimate Frisbee and a year of keyboard.',
  },
  {
    id: 'contact',
    index: '05',
    label: 'Contact',
    title: 'Let’s build what’s next',
    lead: 'Open to conversations about software engineering, applied machine learning and systems work.',
  },
];

export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c])) as Record<ChapterId, Chapter>;
