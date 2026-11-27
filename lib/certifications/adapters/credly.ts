import { CertificationAdapter } from './base';
import { DiscoveredCertification, GoalUnderstanding } from '../types';

export class CredlyAdapter implements CertificationAdapter {
  name = 'Credly Badge API';
  sourceUrl = 'https://api.credly.com/v1/';
  timeoutMs = 4000;

  async fetchCertifications(understanding: GoalUnderstanding): Promise<DiscoveredCertification[]> {
    const credlyToken = process.env.CREDLY_API_TOKEN;

    // If an official token is provided, query the Credly API
    if (credlyToken) {
      try {
        const query = encodeURIComponent(understanding.roleFamily || 'cloud');
        const res = await fetch(`https://api.credly.com/v1/organizations/badges?query=${query}`, {
          headers: {
            Authorization: `Bearer ${credlyToken}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            return json.data.map((b: any) => ({
              key: `credly-${b.id || b.badge_template?.id}`,
              name: b.name || b.badge_template?.name,
              issuer: b.issuer?.name || 'Industry Standard',
              level: 'Associate',
              exam_code: null,
              category: understanding.roleFamily,
              skills: Array.isArray(b.skills) ? b.skills.map((s: any) => s.name || s) : [],
              aliases: [b.name],
              cost_usd_min: 0,
              cost_usd_max: 0,
              cost_currency: 'USD',
              is_free: false,
              study_weeks: 4,
              validity_years: 2,
              difficulty: 3,
              official_url: b.badge_template?.url || 'https://www.credly.com/',
              source_name: 'Credly API',
              source_url: 'https://api.credly.com/',
              fetched_at: new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
              confidence: 0.95,
            }));
          }
        }
      } catch (err) {
        console.warn('[CredlyAdapter] Live API call failed, falling back gracefully:', err);
      }
    }

    // Default: Credly provides verified badge verification metadata for industry certifications
    return [];
  }
}
