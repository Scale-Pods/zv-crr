import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key-for-client-build';

// Public client (anon key)
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);

// Admin client (service role key) — server-side only, bypasses RLS
export const supabaseAdmin = createClient<any>(
    supabaseUrl,
    typeof window === 'undefined' ? supabaseServiceRoleKey : 'dummy-key-for-client-build',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);


