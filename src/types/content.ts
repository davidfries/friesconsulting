export type AudienceKey = "non-profits" | "schools" | "small-business";

export type ServiceCategory =
  | "Network & Compliance"
  | "Virtualization & Cloud"
  | "Observability & Operations"
  | "Automation & Local AI";

export interface AudienceProfile {
  id: AudienceKey;
  label: string;
  schemaType: string;
  detail: string;
}

export interface EngagementShape {
  title: string;
  description: string;
}

export interface EngagementStep {
  step: string;
  title: string;
  description: string;
}

export interface NonProfitReality {
  title: string;
  detail: string;
}

export interface ContactChecklistItem {
  title: string;
  description: string;
}

export interface TechGroup {
  category: string;
  items: string[];
}

export interface BusinessProfile {
  legalName: string;
  name: string;
  shortName: string;
  founder: string;
  baseUrl: string;
  language: string;
  github: string;
  formspreeAction: string;
  contactPath: string;
  ogImage: string;
  title: string;
  tagline: string;
  description: string;
  overview: string;
  sectorFocus: string;
  eRateSummary: string;
  cipaSummary: string;
  openSourceRationale: string;
  engagementModel: string;
  pricingModel: string;
  responsePromise: string;
  contactChannelNote: string;
  serviceArea: {
    summary: string;
    onSite: string[];
    remote: string;
  };
  audiences: AudienceProfile[];
  engagementShapes: EngagementShape[];
  engagementSteps: EngagementStep[];
  nonProfitRealities: NonProfitReality[];
  contactChecklist: ContactChecklistItem[];
  technologies: TechGroup[];
  knowsAbout: string[];
  aiCrawlers: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  shortName: string;
  category: ServiceCategory;
  audiences: AudienceKey[];
  primaryUrl: string;
  relatedPost?: string;
  summary: string;
  tags: string[];
  detailsMarkdown: string;
  detailsHtml: string;
}

export interface FaqItem {
  q: string;
  a: string;
  answerHtml: string;
  answerPlain: string;
}

export interface HeadingItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface PostItem {
  slug: string;
  url: string;
  title: string;
  date: string;
  lastmod: string;
  dateFormatted: string;
  lastmodFormatted?: string;
  description: string;
  summary: string;
  keywords: string[];
  wordCount: number;
  readingMinutes: number;
  toc: HeadingItem[];
  markdown: string;
  html: string;
  featuredImage?: string;
}
