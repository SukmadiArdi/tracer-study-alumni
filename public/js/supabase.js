import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// GANTI DENGAN KREDENSIAL SUPABASE ANDA NANTI
const SUPABASE_URL = 'https://htfhyjcmldrxpbguhutn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Zmh5amNtbGRyeHBiZ3VodXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODk2ODMsImV4cCI6MjA5MjI2NTY4M30.vdWgtKu-qGWKta8yuWMjEgM_AibFpOAD78Vcxn7lDF4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
