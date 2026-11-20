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
  /**
   * Camera position on the valley loop (0..1) while this chapter is read. Chosen from a
   * 16-point survey of the loop (M4): forward order, so scrolling down = flying forward.
   */
  waypoint: number;
};

/** Hero resting place: golden valley with the horizon in frame. */
export const HOME_WAYPOINT = 0.06;

export const chapters: Chapter[] = [
  {
    id: 'work',
    waypoint: 0.19, // lushest warm field
    index: '01',
    label: 'Work',
    title: 'Selected Work',
    lead: 'Retrieval systems, models built from scratch, real-time platforms and learning agents — each told as an engineering case study.',
  },
  {
    id: 'experience',
    waypoint: 0.31, // cooler violet/blue drift
    index: '02',
    label: 'Experience',
    title: 'Experience',
    lead: 'Internships at OLA Krutrim, PetsGo & PetsDoor and SDOTJ Hospitality, alongside engineering roles at IIT Bombay.',
  },
  {
    id: 'about',
    waypoint: 0.56, // golden ridge
    index: '03',
    label: 'About',
    title: 'About',
    lead: 'B.Tech at IIT Bombay with a Minor in Computer Science and Engineering — and a habit of building the whole system.',
  },
  {
    id: 'beyond',
    waypoint: 0.69, // calmer, darker meadow
    index: '04',
    label: 'Beyond Code',
    title: 'Beyond Code',
    lead: 'Mentoring, competitive programming, Ultimate Frisbee and a year of keyboard.',
  },
  {
    id: 'contact',
    waypoint: 0.92, // open slope; camera also rises (contact mode)
    index: '05',
    label: 'Contact',
    title: 'Let’s build what’s next',
    lead: 'Open to conversations about software engineering, applied machine learning and systems work.',
  },
];

export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c])) as Record<ChapterId, Chapter>;
