import { createClient } from '@supabase/supabase-js';

// Environment variables from build or runtime (.env / Netlify Environment Variables)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Authoritative fallback to verified public project credentials (browser-safe anon role only)
const DEFAULT_URL = 'https://tffhdzctkfdmzamwqxal.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo';

export const SUPABASE_URL = envUrl || DEFAULT_URL;
export const SUPABASE_ANON_KEY = envAnonKey || DEFAULT_ANON_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;
