import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoalAnalysisRecord, GoalCertificationRecord } from './types';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client if environment variables are present,
 * or null if Supabase is not configured yet.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === '' || supabaseKey.trim() === '') {
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Fetch the latest goal analysis for a given user from Supabase.
 */
export async function fetchGoalAnalysisFromSupabase(userId: string): Promise<GoalAnalysisRecord | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('goal_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] fetchGoalAnalysis error (falling back to local store):', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      user_id: data.user_id,
      goal: data.goal,
      timeline: data.timeline,
      result: typeof data.result === 'string' ? JSON.parse(data.result) : data.result,
      completed_steps: Array.isArray(data.completed_steps)
        ? data.completed_steps
        : typeof data.completed_steps === 'string'
        ? JSON.parse(data.completed_steps)
        : [],
      created_at: data.created_at,
    };
  } catch (err) {
    console.warn('[Supabase] Unexpected error in fetchGoalAnalysis:', err);
    return null;
  }
}

/**
 * Save a goal analysis record to Supabase.
 */
export async function saveGoalAnalysisToSupabase(record: GoalAnalysisRecord): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('goal_analyses').upsert({
      id: record.id,
      user_id: record.user_id,
      goal: record.goal,
      timeline: record.timeline,
      result: record.result,
      completed_steps: record.completed_steps,
      created_at: record.created_at,
    });

    if (error) {
      console.warn('[Supabase] saveGoalAnalysis error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Unexpected error in saveGoalAnalysis:', err);
    return false;
  }
}

/**
 * Update completed steps for a specific goal analysis in Supabase.
 */
export async function updateSupabaseCompletedSteps(id: string, completedSteps: string[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from('goal_analyses')
      .update({ completed_steps: completedSteps })
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] updateCompletedSteps error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Unexpected error in updateCompletedSteps:', err);
    return false;
  }
}

/**
 * Fetch goal certification statuses for a user.
 */
export async function fetchGoalCertificationsFromSupabase(
  userId: string,
  analysisId?: string
): Promise<GoalCertificationRecord[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    let query = client
      .from('goal_certifications')
      .select('*')
      .eq('user_id', userId);

    if (analysisId) {
      query = query.eq('analysis_id', analysisId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] fetchGoalCertifications error:', error.message);
      return [];
    }
    return (data || []) as GoalCertificationRecord[];
  } catch (err) {
    console.warn('[Supabase] Unexpected error in fetchGoalCertifications:', err);
    return [];
  }
}

/**
 * Upsert a goal certification status in Supabase.
 */
export async function upsertGoalCertificationToSupabase(
  record: GoalCertificationRecord
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('goal_certifications').upsert({
      id: record.id,
      user_id: record.user_id,
      analysis_id: record.analysis_id,
      cert_key: record.cert_key,
      status: record.status,
      target_date: record.target_date || null,
      earned_date: record.earned_date || null,
      credential_url: record.credential_url || null,
      created_at: record.created_at,
      updated_at: record.updated_at,
    });

    if (error) {
      console.warn('[Supabase] upsertGoalCertification error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Unexpected error in upsertGoalCertification:', err);
    return false;
  }
}
