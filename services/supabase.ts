import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgrwsqdezyunwwmjefla.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncndzcWRlenl1bnd3bWplZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzgwMjUsImV4cCI6MjA3NzkxNDAyNX0.fkNhZs95Ec1nKt2kHHrEvHCGo0p2iG5DCm4VyCLU1qU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);