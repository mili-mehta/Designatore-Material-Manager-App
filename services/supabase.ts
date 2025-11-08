import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasmvpexkbjtliovwqpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc212cGV4a2JqdGxpb3Z3cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Njk1MTgsImV4cCI6MjA3ODE0NTUxOH0.m4V5vWn-YjCDHS-CKnG79Ye1ixplwV7DNAbvNuXdm-s';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);