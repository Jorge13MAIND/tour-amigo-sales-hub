import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://vffwtlmbwiizynzxpxnv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnd0bG1id2lpenluenhweG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNjcsImV4cCI6MjA4ODkxNzA2N30.v2oYHrN-jOqj4-_kJH3rb0E3nqU2cluRhd9QsQ6Osws';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
