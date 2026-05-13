import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sxmtdqktimpwxjtudtfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bXRkcWt0aW1wd3hqdHVkdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDYzODIsImV4cCI6MjA5NDIyMjM4Mn0.hI7C3mvEm3ROLO8-mlb6O5xL5P32rfx1roTALgA7AjM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
