/**
 * Job Quality, Anti-Scam Filter, and Sanitizer
 */

export interface QualityValidationResult {
  isValid: boolean;
  reason?: string;
  qualityScore: number; // 0 - 100
  cleanDescription: string;
}

const SCAM_PATTERNS: RegExp[] = [
  /pay\s+(registration|application|processing|training)\s+fee/i,
  /processing\s+charge(s)?/i,
  /security\s+deposit\s+required/i,
  /wire\s+(money|transfer)\s+before/i,
  /crypto\s+wallet\s+transfer/i,
  /telegram\s+(only|interview|chat)\s*[:@-]/i,
  /whatsapp\s+interview\s+only/i,
  /send\s+money\s+to\s+receive\s+laptop/i,
  /work\s+from\s+home\s+typing\s+registration\s+fee/i,
  /100%\s+guaranteed\s+visa\s+for\s+cash/i,
];

export function cleanHtmlDescription(html: string = ''): string {
  if (!html) return '';
  return html
    // Remove scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove tracking pixels
    .replace(/<img[^>]+(width=["']?1["']?|height=["']?1["']?)[^>]*>/gi, '')
    // Strip other HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateJobQuality(
  title: string,
  company: string,
  rawDescription: string,
  applyUrl: string
): QualityValidationResult {
  const cleanDescription = cleanHtmlDescription(rawDescription);

  // 1. Mandatory Fields Check
  if (!title || title.trim().length < 3) {
    return { isValid: false, reason: 'Job title is missing or too short', qualityScore: 0, cleanDescription };
  }

  if (!company || company.trim().length < 2) {
    return { isValid: false, reason: 'Company name is missing', qualityScore: 0, cleanDescription };
  }

  if (!applyUrl || !applyUrl.startsWith('http')) {
    return { isValid: false, reason: 'Invalid or missing official application URL', qualityScore: 0, cleanDescription };
  }

  // 2. Minimum Content Length Check
  if (cleanDescription.length < 50) {
    return { isValid: false, reason: 'Job description is too sparse (< 50 characters)', qualityScore: 20, cleanDescription };
  }

  // 3. Scam Patterns & Fee Solicitation Checks
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(cleanDescription) || pattern.test(title)) {
      return {
        isValid: false,
        reason: 'Listing flagged for suspicious recruitment practices (upfront fees or unverified channels)',
        qualityScore: 10,
        cleanDescription,
      };
    }
  }

  // 4. Calculate Quality Score (50 - 100)
  let score = 70;
  if (cleanDescription.length > 300) score += 10;
  if (cleanDescription.length > 800) score += 10;
  if (/requirements|qualifications|skills|responsibilities/i.test(cleanDescription)) score += 10;

  return {
    isValid: true,
    qualityScore: Math.min(100, score),
    cleanDescription,
  };
}
