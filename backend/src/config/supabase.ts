import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = (): boolean => {
  return (
    !!process.env.SUPABASE_URL &&
    !process.env.SUPABASE_URL.includes('placeholder') &&
    ((!!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) ||
     (!!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('placeholder')))
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: WebSocket as any
  }
});

