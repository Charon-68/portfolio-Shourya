/**
 * Identity + contact. Source of truth: Shourya-Resume.pdf.
 * `null` = not supplied yet; see docs/CONTENT-TODO.md (IDs in `todo`). Never invent values.
 */

export type MaybeLink = { href: string | null; todo: string };

export const profile = {
  name: 'Shourya Saxena',
  /** C13: option 1 from the blueprint (default until Shourya picks). */
  tagline: ['Building intelligent systems —', 'from first principles to production.'],
  disciplines: ['Software Engineering', 'Applied Machine Learning', 'Systems'],
  /** Same disciplines, compact form for narrow screens. */
  disciplinesShort: ['Software', 'Applied ML', 'Systems'],
  affiliation: 'IIT Bombay',
  degree: 'B.Tech, Mechanical Engineering',
  minor: 'Minor in Computer Science and Engineering',

  /** Public site (CONTENT-TODO C15). */
  siteUrl: 'https://shouryasaxena.vercel.app',

  links: {
    email: { href: 'mailto:24b2222@iitb.ac.in', todo: 'C1' } as MaybeLink,
    linkedin: { href: 'https://www.linkedin.com/in/shourya-saxena-490b183b8/', todo: 'C2' } as MaybeLink,
    github: { href: 'https://github.com/Charon-68', todo: 'C3' } as MaybeLink,
    /** Must be the redacted PDF (no DOB / gender / roll number). */
    resume: { href: '/Shourya-Saxena-Resume.pdf', todo: 'C4' } as MaybeLink,
  },
} as const;
