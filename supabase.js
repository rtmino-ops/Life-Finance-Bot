const SUPABASE_URL = "https://xhqwramasmjdhhbperyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXdyYW1hc21qZGhoYnBlcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODY0MzgsImV4cCI6MjA4OTI2MjQzOH0.SuVut2SHKb35oikISjahBkzrbDgLR65mlMg-YK-RrRg";

console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!SUPABASE_ANON_KEY);

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("supabaseClient created:", !!supabaseClient);