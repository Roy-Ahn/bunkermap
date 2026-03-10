import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldmscoqhgutbsorhwhrr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbXNjb3FoZ3V0YnNvcmh3aHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjA3MDAsImV4cCI6MjA4ODA5NjcwMH0.KH3JDc7HXPDiKJGH_lpd43zZ8-eD9e4McAbhfDlwL1g';
// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
