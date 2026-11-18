/**
 * ============================================================================
 * INCLUSIONKIT - Cloud Database & Auth Layer (Supabase + Local Fallback)
 * ============================================================================
 * Connects to Supabase PostgreSQL + Auth when configured, and falls back
 * gracefully to localStorage so the app works offline or before cloud setup.
 */
window.InclusionKit = window.InclusionKit || {};

(function () {
  'use strict';

  const LOCAL_KEYS = {
    voiceCommands: 'ik_local_voice_commands',
    readingDocs: 'ik_local_reading_docs',
    analytics: 'ik_local_analytics',
    domainPresets: 'ik_local_domain_presets',
    reports: 'ik_local_reports',
    profile: 'ik_local_profile'
  };

  function readLocal(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('[InclusionKit DB] localStorage write failed:', err);
    }
  }

  function uid() {
    return (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  class DatabaseService {
    constructor() {
      this.client = null;
      this.user = null;
      this.mode = 'local'; // 'cloud' | 'local'
      this.authListeners = [];
      this.initClient();
    }

    initClient() {
      const cfg = window.InclusionKit.Config;
      if (cfg && cfg.isConfigured() && window.supabase && window.supabase.createClient) {
        const { url, anonKey } = cfg.getCredentials();
        this.client = window.supabase.createClient(url, anonKey);
        this.mode = 'cloud';
        this.client.auth.onAuthStateChange((_event, session) => {
          this.user = session ? session.user : null;
          this.authListeners.forEach(cb => cb(this.user));
        });
      } else {
        this.client = null;
        this.mode = 'local';
      }
      return this.mode;
    }

    reinitialize() {
      const mode = this.initClient();
      this.authListeners.forEach(cb => cb(this.user));
      return mode;
    }

    onAuthChange(cb) {
      this.authListeners.push(cb);
    }

    isCloudActive() {
      return this.mode === 'cloud' && Boolean(this.client);
    }

    async getSession() {
      if (!this.isCloudActive()) return null;
      const { data } = await this.client.auth.getSession();
      this.user = data?.session?.user || null;
      return data?.session || null;
    }

    async signUp(email, password, displayName) {
      if (!this.isCloudActive()) {
        throw new Error('Cloud database is not configured yet. Add Supabase credentials first.');
      }
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split('@')[0] } }
      });
      if (error) throw error;
      this.user = data.user;
      return data;
    }

    async signIn(email, password) {
      if (!this.isCloudActive()) {
        throw new Error('Cloud database is not configured yet. Add Supabase credentials first.');
      }
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.user = data.user;
      return data;
    }

    async signOut() {
      if (this.isCloudActive()) {
        await this.client.auth.signOut();
      }
      this.user = null;
      this.authListeners.forEach(cb => cb(null));
    }

    // ── 1. Personalized Accessibility Profiles ─────────────────────────────
    async getProfile() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('accessibility_profiles')
          .select('*')
          .eq('user_id', this.user.id)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      return readLocal(LOCAL_KEYS.profile, null);
    }

    async saveProfile({ displayName, disabilityPreset, settings }) {
      const payload = {
        display_name: displayName || 'Default User',
        disability_preset: disabilityPreset || 'custom',
        settings: settings || {},
        updated_at: new Date().toISOString()
      };

      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('accessibility_profiles')
          .upsert({ user_id: this.user.id, ...payload }, { onConflict: 'user_id' })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      writeLocal(LOCAL_KEYS.profile, payload);
      return payload;
    }

    // ── 2. Custom Voice Commands & Macros ──────────────────────────────────
    async getVoiceCommands() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('voice_commands')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return readLocal(LOCAL_KEYS.voiceCommands, []);
    }

    async addVoiceCommand(phrase, actionKey) {
      const cleanPhrase = (phrase || '').trim().toLowerCase();
      if (!cleanPhrase || !actionKey) throw new Error('Phrase and action are required.');

      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('voice_commands')
          .insert({ user_id: this.user.id, phrase: cleanPhrase, action_key: actionKey })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const list = readLocal(LOCAL_KEYS.voiceCommands, []);
      const item = { id: uid(), phrase: cleanPhrase, action_key: actionKey, created_at: new Date().toISOString() };
      list.unshift(item);
      writeLocal(LOCAL_KEYS.voiceCommands, list);
      return item;
    }

    async deleteVoiceCommand(id) {
      if (this.isCloudActive() && this.user) {
        const { error } = await this.client.from('voice_commands').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      const list = readLocal(LOCAL_KEYS.voiceCommands, []).filter(c => c.id !== id);
      writeLocal(LOCAL_KEYS.voiceCommands, list);
    }

    // ── 3. Saved TTS & Reading History ─────────────────────────────────────
    async getReadingDocs() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('reading_history')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return readLocal(LOCAL_KEYS.readingDocs, []);
    }

    async saveReadingDoc({ id, title, content, lastPosition = 0, ttsRate = 1.0 }) {
      const record = {
        title: (title || 'Untitled Document').trim(),
        content: (content || '').trim(),
        last_position: lastPosition,
        tts_rate: ttsRate,
        updated_at: new Date().toISOString()
      };

      if (this.isCloudActive() && this.user) {
        if (id) {
          const { data, error } = await this.client
            .from('reading_history')
            .update(record)
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
        const { data, error } = await this.client
          .from('reading_history')
          .insert({ user_id: this.user.id, ...record })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const docs = readLocal(LOCAL_KEYS.readingDocs, []);
      if (id) {
        const idx = docs.findIndex(d => d.id === id);
        if (idx >= 0) {
          docs[idx] = { ...docs[idx], ...record };
          writeLocal(LOCAL_KEYS.readingDocs, docs);
          return docs[idx];
        }
      }
      const item = { id: uid(), ...record };
      docs.unshift(item);
      writeLocal(LOCAL_KEYS.readingDocs, docs);
      return item;
    }

    async deleteReadingDoc(id) {
      if (this.isCloudActive() && this.user) {
        const { error } = await this.client.from('reading_history').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      const docs = readLocal(LOCAL_KEYS.readingDocs, []).filter(d => d.id !== id);
      writeLocal(LOCAL_KEYS.readingDocs, docs);
    }

    // ── 4. HCI Usability Analytics ─────────────────────────────────────────
    async logAnalyticsEvent(featureKey, eventType = 'toggle', durationSec = 0, metadata = {}) {
      const entry = {
        feature_key: featureKey,
        event_type: eventType,
        duration_sec: durationSec,
        metadata,
        created_at: new Date().toISOString()
      };

      if (this.isCloudActive() && this.user) {
        const { error } = await this.client
          .from('usage_analytics')
          .insert({ user_id: this.user.id, ...entry });
        if (error) console.warn('[InclusionKit Analytics] Insert error:', error.message);
        return;
      }

      const logs = readLocal(LOCAL_KEYS.analytics, []);
      logs.unshift({ id: uid(), ...entry });
      if (logs.length > 250) logs.length = 250;
      writeLocal(LOCAL_KEYS.analytics, logs);
    }

    async getAnalyticsEvents() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('usage_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data || [];
      }
      return readLocal(LOCAL_KEYS.analytics, []);
    }

    // ── 5. Domain-Specific Presets ─────────────────────────────────────────
    async getDomainPresets() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('domain_presets')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return readLocal(LOCAL_KEYS.domainPresets, []);
    }

    async saveDomainPreset({ domain, presetName, settings }) {
      const cleanDomain = (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (!cleanDomain) throw new Error('Domain name is required.');

      const record = {
        domain: cleanDomain,
        preset_name: (presetName || cleanDomain).trim(),
        settings: settings || {},
        updated_at: new Date().toISOString()
      };

      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('domain_presets')
          .insert({ user_id: this.user.id, ...record })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const list = readLocal(LOCAL_KEYS.domainPresets, []);
      const item = { id: uid(), ...record };
      list.unshift(item);
      writeLocal(LOCAL_KEYS.domainPresets, list);
      return item;
    }

    async deleteDomainPreset(id) {
      if (this.isCloudActive() && this.user) {
        const { error } = await this.client.from('domain_presets').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      const list = readLocal(LOCAL_KEYS.domainPresets, []).filter(p => p.id !== id);
      writeLocal(LOCAL_KEYS.domainPresets, list);
    }

    // ── 6. Accessibility Feedback & Bug Reports ────────────────────────────
    async getReports() {
      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('accessibility_reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return readLocal(LOCAL_KEYS.reports, []);
    }

    async submitReport({ pageSection, severity, description }) {
      if (!description || !description.trim()) throw new Error('Issue description is required.');
      const record = {
        page_section: (pageSection || 'General').trim(),
        severity: severity || 'medium',
        description: description.trim(),
        status: 'open',
        created_at: new Date().toISOString()
      };

      if (this.isCloudActive() && this.user) {
        const { data, error } = await this.client
          .from('accessibility_reports')
          .insert({ user_id: this.user.id, ...record })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const list = readLocal(LOCAL_KEYS.reports, []);
      const item = { id: uid(), ...record };
      list.unshift(item);
      writeLocal(LOCAL_KEYS.reports, list);
      return item;
    }

    async updateReportStatus(id, status) {
      if (this.isCloudActive() && this.user) {
        const { error } = await this.client
          .from('accessibility_reports')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
        return;
      }
      const list = readLocal(LOCAL_KEYS.reports, []).map(r => r.id === id ? { ...r, status } : r);
      writeLocal(LOCAL_KEYS.reports, list);
    }
  }

  window.InclusionKit.DB = new DatabaseService();
})();
