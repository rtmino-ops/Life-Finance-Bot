// supabase.js — Подключение к Supabase
const SUPABASE_URL = "https://xhqwramasmjdhhbperyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXdyYW1hc21qZGhoYnBlcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODY0MzgsImV4cCI6MjA4OTI2MjQzOH0.SuVut2SHKb35oikISjahBkzrbDgLR65mlMg-YK-RrRg";

let supabaseClient;

try {
  if (!window.supabase) {
    throw new Error("Supabase SDK не загружен. Проверьте подключение CDN.");
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("Ошибка инициализации Supabase:", e.message);
  document.getElementById("userInfo").textContent = "Ошибка подключения к базе данных";
}