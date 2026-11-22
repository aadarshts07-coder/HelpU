/**
 * Centralized Brand Configuration for HELP U / helpu.ai
 * All user-facing brand labels and text must reference this config.
 */
export const BRAND = {
  name: 'helpu.ai',
  displayName: 'HELP U',
  fullBrand: 'HELP U – helpu.ai',
  tagline: 'AI Auto Apply',
  portalName: 'helpu.ai (Live Global ATS Index)',
  jobsLabel: 'helpu.ai Jobs',
  atsLabel: 'helpu.ai ATS',
  liveDataLabel: 'helpu.ai live job data',
  searchPlaceholder: 'Search jobs & internships (helpu.ai, Cisco, Red Hat, Bosch)…',
  mobilePlaceholder: 'Search jobs & internships (helpu.ai)…',
  dropdownHeader: 'helpu.ai live job data',
  liveSuggestionsLabel: 'helpu.ai Live Suggestions',
  livePostingsLabel: 'Live Postings on helpu.ai',
  dropdownFooter: 'Live indexing: helpu.ai + Cisco, Red Hat, Bosch',
  poweredBy: 'helpu.ai',
} as const;

/**
 * Display name mapper for portal source IDs.
 * Preserves internal identifiers (e.g. 'freehire', 'cisco', 'redhat') while
 * providing clean branded labels for the UI without requiring database migrations.
 */
export function getPortalSourceLabel(sourceId: string): string {
  const norm = (sourceId || '').toLowerCase().trim();
  switch (norm) {
    case 'freehire':
      return BRAND.atsLabel;
    case 'cisco':
      return 'Cisco Careers';
    case 'redhat':
      return 'Red Hat Careers';
    case 'bosch':
      return 'Bosch Careers';
    case 'pricol':
      return 'Pricol Careers';
    case 'linkedin':
      return 'LinkedIn';
    case 'indeed':
      return 'Indeed';
    case 'naukri':
      return 'Naukri';
    case 'greenhouse':
      return 'Greenhouse';
    case 'lever':
      return 'Lever';
    default:
      return sourceId || BRAND.name;
  }
}
