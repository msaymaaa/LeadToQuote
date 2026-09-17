import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both standard Vite (VITE_) and Next/Universal (NEXT_PUBLIC_) environment variable prefixes
const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[key]) return import.meta.env[key];
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    if (import.meta.env[`NEXT_PUBLIC_${key}`]) return import.meta.env[`NEXT_PUBLIC_${key}`];
  }
  return undefined;
};

const supabaseUrl =
  getEnvVar('SUPABASE_URL') ||
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  getEnvVar('SUPABASE_ANON_KEY') ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key') &&
    supabaseUrl.startsWith('http')
  );
};

export interface SupabaseConfigDiagnostics {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
  engine: 'live_supabase' | 'local_storage_engine';
  sourcePrefix: 'VITE' | 'NEXT_PUBLIC' | 'NONE';
}

export const getSupabaseDiagnostics = (): SupabaseConfigDiagnostics => {
  const configured = isSupabaseConfigured();
  const prefix = import.meta.env.VITE_SUPABASE_URL
    ? 'VITE'
    : (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL
    ? 'NEXT_PUBLIC'
    : 'NONE';

  return {
    isConfigured: configured,
    url: configured ? (supabaseUrl as string) : null,
    hasAnonKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon')),
    engine: configured ? 'live_supabase' : 'local_storage_engine',
    sourcePrefix: prefix,
  };
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Ping Supabase to verify connectivity
export async function testSupabaseConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase URL or Anon Key not configured in environment variables.',
    };
  }

  const start = performance.now();
  try {
    const { error } = await supabase.from('businesses').select('id').limit(1);
    const latency = Math.round(performance.now() - start);

    if (error) {
      // If table does not exist yet, still reachable
      if (error.code === '42P01') {
        return {
          success: true,
          latencyMs: latency,
          error: 'Connection successful, but schema not yet applied. Run /supabase/schema.sql in SQL Editor.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, latencyMs: latency };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error pinging Supabase.' };
  }
}
