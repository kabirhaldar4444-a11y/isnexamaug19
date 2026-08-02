import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dpmzigojfwqiffleligg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PLACEHOLDER_KEY';

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
