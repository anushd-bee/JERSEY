import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 CRITICAL ERROR: Supabase environment variables are missing! 🚨\n' +
    'Please rename .env.example to .env and add your URL and ANON KEY.'
  );
}

// Provide fallback values to prevent the app from crashing on load
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
