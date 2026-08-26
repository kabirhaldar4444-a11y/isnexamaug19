import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dpmzigojfwqiffleligg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXppZ29qZndxaWZmbGVsaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzg1ODEsImV4cCI6MjA5NjY1NDU4MX0.WPrgf0AjwV9D2Bbs45CcZa8eHoxaugVvNAV1zSrNBXc';

// Generate a unique tab ID to isolate auth sessions across tabs
let tabId = null;
if (typeof window !== 'undefined') {
  const storedTabId = window.sessionStorage.getItem('sb_tab_id');
  if (storedTabId && window.name === `tab_${storedTabId}`) {
    tabId = storedTabId;
  } else {
    tabId = Math.random().toString(36).substring(2, 15);
    window.sessionStorage.setItem('sb_tab_id', tabId);
    window.name = `tab_${tabId}`;
  }
}

const storageKey = tabId ? `sb-${tabId}-auth-token` : 'sb-auth-token';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: storageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;
