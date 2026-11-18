/**
 * InclusionKit Cloud Configuration
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your Supabase project credentials
 * before deploying to GitHub Pages, or configure them directly in the Cloud Setup UI.
 */
window.InclusionKit = window.InclusionKit || {};

window.InclusionKit.Config = {
  SUPABASE_URL: 'https://iizwptwdedkqdeccnmuu.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_aLAZxjICZmIPJdeG3FJyUg_nMHs_cjM',

  getCredentials() {
    const lsUrl = localStorage.getItem('ik_supabase_url') || '';
    const lsKey = localStorage.getItem('ik_supabase_key') || '';
    return {
      url: (this.SUPABASE_URL || lsUrl).trim(),
      anonKey: (this.SUPABASE_ANON_KEY || lsKey).trim()
    };
  },

  setCredentials(url, anonKey) {
    localStorage.setItem('ik_supabase_url', (url || '').trim());
    localStorage.setItem('ik_supabase_key', (anonKey || '').trim());
  },

  isConfigured() {
    const { url, anonKey } = this.getCredentials();
    return Boolean(url && anonKey && url.startsWith('https://'));
  }
};
