/**
 * Sample mentors from the Claude Design mock-ups. These are not real people:
 * replace them with approved mentors from the database before launch.
 */
export type Mentor = {
  initials: string;
  name: string;
  /** University, course and year, as shown under the name. */
  study: string;
  university: University;
  /** Where they're from and where they live now. */
  from: string;
  /** First-person line for the Mentors page. */
  quote: string;
  /** Third-person line for the home page, for the mentors featured there. */
  summary?: string;
};

export const UNIVERSITIES = ["Oxford", "Cambridge", "LSE", "UCL", "Imperial", "Edinburgh"] as const;
export type University = (typeof UNIVERSITIES)[number];

export const mentors: Mentor[] = [
  {
    initials: "AW",
    name: "Amani Wanjiku",
    study: "LSE, Economics, 2022",
    university: "LSE",
    from: "From Nairobi. Now working in London.",
    quote: "I rewrote my personal statement eleven times. I can help you get yours right sooner.",
    summary: "Grew up in Nairobi. Rewrote her personal statement eleven times and will help you get yours right sooner.",
  },
  {
    initials: "BK",
    name: "Brian Kamau",
    study: "UCL, Engineering, final year",
    university: "UCL",
    from: "From Nakuru. Living in London.",
    quote: "I can tell you which halls are worth the price, and which modules are worth the stress.",
    summary: "From Nakuru. Can tell you which halls are worth the price.",
  },
  {
    initials: "NO",
    name: "Njeri Odhiambo",
    study: "Oxford, PPE, 2021",
    university: "Oxford",
    from: "Alliance Girls alumna. Now in Oxford.",
    quote: "The interview is less scary once you have practised it with someone who has sat it.",
    summary: "Went to Alliance Girls. Helps with interview practice and choosing a college.",
  },
  {
    initials: "KM",
    name: "Kevin Mutua",
    study: "Cambridge, Natural Sciences, 2023",
    university: "Cambridge",
    from: "From Mombasa. PhD student in Cambridge.",
    quote: "I applied from Mombasa with no one to ask about college choice. Now you have someone.",
  },
  {
    initials: "FA",
    name: "Faith Achieng",
    study: "Edinburgh, Medicine, year 4",
    university: "Edinburgh",
    from: "From Kisumu. Living in Edinburgh.",
    quote: "Medicine applications have extra steps. I will walk you through each one.",
  },
  {
    initials: "DN",
    name: "David Njoroge",
    study: "UCL, Law, 2020",
    university: "UCL",
    from: "From Thika. Lawyer in London.",
    quote: "I help with the LNAT, choosing between London universities and finding your people.",
  },
];
