import { CertificationAdapter, runAdapterSafely } from './base';
import { MicrosoftLearnAdapter } from './microsoft';
import { OfficialCloudIssuersAdapter } from './cloud-issuers';
import { LearningPlatformsAdapter } from './learning-platforms';
import { CredlyAdapter } from './credly';
import { DiscoveredCertification, DiscoveredCertificationSchema, GoalUnderstanding } from '../types';
import { CERTIFICATION_CATALOG } from '@/lib/data/certifications-catalog';

export class AdapterRegistry {
  private adapters: CertificationAdapter[] = [];

  constructor() {
    // Register default pluggable adapters
    this.register(new OfficialCloudIssuersAdapter());
    this.register(new MicrosoftLearnAdapter());
    this.register(new LearningPlatformsAdapter());
    this.register(new CredlyAdapter());
  }

  public register(adapter: CertificationAdapter): void {
    this.adapters.push(adapter);
  }

  public getAdapters(): CertificationAdapter[] {
    return [...this.adapters];
  }

  /**
   * Execute all registered adapters concurrently with full isolation.
   * Merges, deduplicates, and validates results against Zod schema.
   */
  public async discoverAll(understanding: GoalUnderstanding): Promise<DiscoveredCertification[]> {
    const rawResults = await Promise.allSettled(
      this.adapters.map((adapter) => runAdapterSafely(adapter, understanding))
    );

    const merged: DiscoveredCertification[] = [];

    // Also include existing base catalog entries
    const now = new Date().toISOString();
    CERTIFICATION_CATALOG.forEach((cat) => {
      merged.push({
        key: cat.key,
        name: cat.name,
        issuer: cat.issuer,
        level: cat.level,
        exam_code: cat.exam_code,
        category: cat.category,
        skills: cat.skills,
        aliases: cat.aliases,
        cost_usd_min: cat.cost_usd_min,
        cost_usd_max: cat.cost_usd_max,
        cost_currency: 'USD',
        is_free: cat.is_free,
        study_weeks: cat.study_weeks,
        validity_years: cat.validity_years,
        difficulty: cat.difficulty,
        official_url: cat.official_url,
        source_name: 'Verified Official Catalog',
        source_url: cat.official_url,
        fetched_at: now,
        last_verified_at: cat.last_verified_at || now,
        confidence: 0.99,
        common_employers: cat.common_employers,
      });
    });

    for (const res of rawResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const item of res.value) {
          const parsed = DiscoveredCertificationSchema.safeParse(item);
          if (parsed.success) {
            merged.push(parsed.data);
          } else {
            console.warn('[AdapterRegistry] Skipped invalid certification:', parsed.error.format());
          }
        }
      }
    }

    // Deduplicate by key, normalized name, and exam_code
    return this.deduplicateCertifications(merged);
  }

  /**
   * Deduplicate certifications by key, name, and exam code using normalized fuzzy keying.
   */
  public deduplicateCertifications(items: DiscoveredCertification[]): DiscoveredCertification[] {
    const seenKeys = new Set<string>();
    const seenNames = new Set<string>();
    const seenExamCodes = new Set<string>();
    const unique: DiscoveredCertification[] = [];

    for (const item of items) {
      const normKey = item.key.toLowerCase().trim();
      const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normExam = item.exam_code ? item.exam_code.toUpperCase().replace(/[^A-Z0-9]/g, '') : null;

      if (seenKeys.has(normKey)) continue;
      if (seenNames.has(normName)) continue;
      if (normExam && seenExamCodes.has(normExam)) continue;

      seenKeys.add(normKey);
      seenNames.add(normName);
      if (normExam) seenExamCodes.add(normExam);

      unique.push(item);
    }

    return unique;
  }
}

export const defaultAdapterRegistry = new AdapterRegistry();
