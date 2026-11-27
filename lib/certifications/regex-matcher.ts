/**
 * Regex matching engine for certification names, aliases, and exam codes in job postings.
 * Ensures word boundary isolation, acronym safety, and prevents false positives
 * (e.g., "CKA" inside "trackable", "PCA" inside "pcar", etc.).
 */

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface CertMatchTerm {
  term: string;
  isAcronym: boolean; // e.g. CKA, CKAD, CISSP, AWS SAA, AZ-900
}

export function buildSafeTermPattern(term: string): RegExp {
  const trimmed = term.trim();
  const isAcronym = /^[A-Z0-9-]{2,8}$/.test(trimmed);

  if (isAcronym) {
    // Acronyms require strict word boundaries and case sensitivity if short (<= 4 chars)
    // to prevent words like "cka" or "pca" in lower-case URLs or identifiers matching.
    return new RegExp(`(?<![a-zA-Z0-9_-])${escapeRegex(trimmed)}(?![a-zA-Z0-9_-])`, 'g');
  }

  // Multi-word phrases like "Certified Kubernetes Administrator" or "AWS Solutions Architect"
  // Can be matched case-insensitively with flexible whitespace/hyphen handling
  const words = trimmed.split(/[\s-]+/).filter(Boolean);
  const patternStr = words.map(escapeRegex).join('[\\s-]+');
  return new RegExp(`(?<![a-zA-Z0-9])${patternStr}(?![a-zA-Z0-9])`, 'gi');
}

export function matchCertificationInText(
  certTerms: { name: string; examCode?: string | null; aliases?: string[]; skills?: string[] },
  text: string
): { matched: boolean; matchedTerm?: string } {
  if (!text || text.length === 0) {
    return { matched: false };
  }

  // 1. Check Exam Code first (highest precision, e.g. "SAA-C03", "AZ-204")
  if (certTerms.examCode && certTerms.examCode.trim().length >= 3) {
    const examCode = certTerms.examCode.trim();
    const examRegex = new RegExp(`(?<![a-zA-Z0-9_-])${escapeRegex(examCode)}(?![a-zA-Z0-9_-])`, 'i');
    if (examRegex.test(text)) {
      return { matched: true, matchedTerm: examCode };
    }
  }

  // 2. Check full certification name
  const nameRegex = buildSafeTermPattern(certTerms.name);
  if (nameRegex.test(text)) {
    return { matched: true, matchedTerm: certTerms.name };
  }

  // 3. Check aliases
  if (certTerms.aliases && certTerms.aliases.length > 0) {
    for (const alias of certTerms.aliases) {
      if (alias.trim().length < 2) continue;
      const aliasRegex = buildSafeTermPattern(alias);
      if (aliasRegex.test(text)) {
        return { matched: true, matchedTerm: alias };
      }
    }
  }

  return { matched: false };
}
