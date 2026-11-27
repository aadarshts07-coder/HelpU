import { DiscoveredCertification, GoalUnderstanding } from '../types';

export interface CertificationAdapter {
  name: string;
  sourceUrl: string;
  timeoutMs?: number;
  fetchCertifications(understanding: GoalUnderstanding): Promise<DiscoveredCertification[]>;
}

export async function runAdapterSafely(
  adapter: CertificationAdapter,
  understanding: GoalUnderstanding
): Promise<DiscoveredCertification[]> {
  const timeoutMs = adapter.timeoutMs || 4500;

  try {
    const timeoutPromise = new Promise<DiscoveredCertification[]>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Adapter "${adapter.name}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    const fetchPromise = adapter.fetchCertifications(understanding);
    const results = await Promise.race([fetchPromise, timeoutPromise]);
    return Array.isArray(results) ? results : [];
  } catch (err: any) {
    console.warn(`[Adapter Isolation] ${adapter.name} failed gracefully:`, err?.message || err);
    return [];
  }
}
