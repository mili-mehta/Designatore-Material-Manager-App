import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config'; // Import from the new config file

const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

// The error message now checks for the placeholder text from config.ts
// This ensures that if the user hasn't configured the file, the ErrorBoundary
// will catch this specific message and display helpful instructions.
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("YOUR_SUPABASE_URL_HERE") || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE")) {
  throw new Error("FATAL ERROR: Supabase keys are not configured in config.ts.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);