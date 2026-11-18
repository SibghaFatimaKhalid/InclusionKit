/**
 * ============================================================================
 * INCLUSIONKIT - Accessibility Management System Workspace Controller
 * ============================================================================
 * Manages:
 * 1. Personalized Accessibility Profiles & Presets
 * 2. Reading & Text-to-Speech (TTS) Studio with Resume History
 * 3. Custom Voice Command Macros
 * 4. HCI Usability Analytics & Domain-Specific Presets
 * 5. Accessibility Issue Reporter & Cloud Auth Modal
 */
window.InclusionKit = window.InclusionKit || {};

(function () {
  'use strict';

  const State = window.InclusionKit.State;
  const DB = window.InclusionKit.DB;
  const Config = window.InclusionKit.Config;

  const PRESETS = {
    'low-vision': {
      name: 'Low Vision',
      settings: {
        contrastMode: 'high',
        fontFamily: 'hyperlegible',
        fontScale: 1.5,
        letterSpacing: 'wide',
        lineHeight: 'relaxed',
        enhancedFocus: true,
        focusStyle: 'high-contrast-yellow',
        activePreset: 'low-vision'
      }
    },
    'dyslexia': {
      name: 'Dyslexia Support',
      settings: {
        fontFamily: 'dyslexic',
        fontScale: 1.25,
        letterSpacing: 'wide',
        lineHeight: 'loose',
        readingRuler: true,
        contrastMode: 'normal',
        activePreset: 'dyslexia'
      }
    },
    'color-blind': {
      name: 'Color Blindness (Protanopia)',
      settings: {
        colorFilter: 'protanopia',
        focusStyle: 'high-contrast-yellow',
        enhancedFocus: true,
        activePreset: 'color-blind'
      }
    },
    'motor': {
      name: 'Motor & Switch Access',
      settings: {
        visualHapticsEnabled: true,
        hapticSound: true,
        reducedMotion: true,
        enhancedFocus: true,
        fontScale: 1.25,
        activePreset: 'motor'
      }
    }
  };

  class WorkspaceController {
    constructor() {
      this.currentView = 'store';
      this.activeDocId = null;
      this.ttsUtterance = null;
      this.ttsCharIndex = 0;
      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', async () => {
        this.bindNavigation();
        this.bindPresets();
        this.bindReadingStudio();
        this.bindVoiceMacros();
        this.bindDomainPresets();
        this.bindReports();
        this.bindAuthModal();

        DB.onAuthChange(async (user) => {
          this.updateAuthUI(user);
          if (user) {
            await this.loadUserCloudData();
          } else {
            await this.refreshAllViews();
          }
        });

        await DB.getSession();
        this.updateAuthUI(DB.user);
        if (DB.user) {
          await this.loadUserCloudData();
        } else {
          await this.refreshAllViews();
        }
      });
    }

    // ── View Switching ─────────────────────────────────────────────────────
    bindNavigation() {
      const navBtns = document.querySelectorAll('[data-nav-view]');
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.switchView(btn.getAttribute('data-nav-view'));
        });
      });
    }

    switchView(viewName) {
      this.currentView = viewName;
      document.querySelectorAll('[data-view-panel]').forEach(panel => {
        const isTarget = panel.getAttribute('data-view-panel') === viewName;
        panel.classList.toggle('hidden', !isTarget);
      });
      document.querySelectorAll('[data-nav-view]').forEach(btn => {
        const active = btn.getAttribute('data-nav-view') === viewName;
        btn.setAttribute('aria-current', active ? 'page' : 'false');
        btn.classList.toggle('bg-sky-600', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('text-slate-700', !active);
        btn.classList.toggle('hover:bg-slate-100', !active);
      });

      if (viewName === 'admin') {
        this.renderAnalytics();
        this.renderReports();
        window.InclusionKit?.Store?.renderAdminProductsList();
      }
      if (viewName === 'settings') {
        this.updateActivePresetUI();
      }
      State.announce(`Switched to ${viewName} view`);
    }

    async loadUserCloudData() {
      try {
        const profile = await DB.getProfile();
        if (profile && profile.settings && Object.keys(profile.settings).length > 0) {
          State.loadSettings(profile.settings);
          this.showToast(`Loaded profile settings for ${profile.display_name}`);
        }
      } catch (err) {
        console.warn('[Workspace] Profile load warning:', err.message);
      }
      await this.refreshAllViews();
    }

    async refreshAllViews() {
      await Promise.all([
        this.renderVoiceCommands(),
        this.renderReadingDocs(),
        this.renderAnalytics(),
        this.renderDomainPresets(),
        this.renderReports()
      ]);
      this.updateActivePresetUI();
    }

    async syncProfileSettings() {
      if (!DB.isCloudActive() || !DB.user) return;
      try {
        const displayName = DB.user.user_metadata?.display_name || DB.user.email?.split('@')[0] || 'User';
        await DB.saveProfile({
          displayName,
          disabilityPreset: State.get('activePreset') || 'custom',
          settings: { ...State.state }
        });
      } catch (err) {
        console.warn('[Workspace] Profile auto-sync failed:', err.message);
      }
    }

    // ── 1. Accessibility Presets ───────────────────────────────────────────
    bindPresets() {
      document.querySelectorAll('[data-apply-preset]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.getAttribute('data-apply-preset');
          if (key === 'default') {
            State.resetAll();
            this.updateActivePresetUI();
            this.showToast('Restored default accessibility settings');
            return;
          }
          const preset = PRESETS[key];
          if (!preset) return;
          State.loadSettings(preset.settings);
          this.updateActivePresetUI();
          await DB.logAnalyticsEvent(`preset_${key}`, 'preset_applied');
          await this.syncProfileSettings();
          this.showToast(`Applied "${preset.name}" profile`);
        });
      });

      const saveProfileBtn = document.getElementById('btn-save-profile-now');
      if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
          const displayName = DB.user?.user_metadata?.display_name || DB.user?.email?.split('@')[0] || 'Local User';
          await DB.saveProfile({
            displayName,
            disabilityPreset: State.get('activePreset') || 'custom',
            settings: { ...State.state }
          });
          this.showToast(DB.isCloudActive() && DB.user ? 'Profile synced to cloud database' : 'Profile saved locally');
        });
      }
    }

    updateActivePresetUI() {
      const current = State.get('activePreset') || 'custom';
      const label = document.getElementById('active-preset-label');
      if (label) {
        label.textContent = PRESETS[current]?.name || 'Custom Configuration';
      }
      const summary = document.getElementById('dashboard-settings-summary');
      if (summary) {
        summary.innerHTML = `
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Vision Filter</span>
            <strong class="text-sm text-slate-900 capitalize">${State.get('colorFilter')}</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Contrast</span>
            <strong class="text-sm text-slate-900 capitalize">${State.get('contrastMode')}</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Font & Scale</span>
            <strong class="text-sm text-slate-900 capitalize">${State.get('fontFamily')} (${Math.round((State.get('fontScale') || 1) * 100)}%)</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Haptics & Ruler</span>
            <strong class="text-sm text-slate-900">${State.get('visualHapticsEnabled') ? 'Haptics On' : 'Haptics Off'} / ${State.get('readingRuler') ? 'Ruler On' : 'Ruler Off'}</strong>
          </div>
        `;
      }
    }

    // ── 2. Reading & TTS Studio ────────────────────────────────────────────
    bindReadingStudio() {
      const titleInput = document.getElementById('tts-doc-title');
      const contentInput = document.getElementById('tts-doc-content');
      const rateSlider = document.getElementById('tts-rate-slider');
      const rateLabel = document.getElementById('tts-rate-label');
      const playBtn = document.getElementById('btn-tts-play');
      const pauseBtn = document.getElementById('btn-tts-pause');
      const stopBtn = document.getElementById('btn-tts-stop');
      const saveBtn = document.getElementById('btn-tts-save');
      const newBtn = document.getElementById('btn-tts-new');
      const progressText = document.getElementById('tts-progress-status');

      if (rateSlider && rateLabel) {
        rateSlider.value = State.get('ttsRate') || 1.0;
        rateLabel.textContent = `${rateSlider.value}x`;
        rateSlider.addEventListener('input', () => {
          rateLabel.textContent = `${rateSlider.value}x`;
          State.set('ttsRate', parseFloat(rateSlider.value));
        });
      }

      if (playBtn && contentInput) {
        playBtn.addEventListener('click', () => {
          const fullText = contentInput.value.trim();
          if (!fullText) {
            this.showToast('Please enter or load text to read aloud.');
            return;
          }
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            if (progressText) progressText.textContent = 'Reading resumed...';
            return;
          }
          window.speechSynthesis.cancel();
          const slice = fullText.slice(this.ttsCharIndex);
          const utter = new SpeechSynthesisUtterance(slice || fullText);
          utter.rate = parseFloat(rateSlider?.value || '1.0');
          utter.onboundary = (e) => {
            if (typeof e.charIndex === 'number') {
              const pos = (slice ? this.ttsCharIndex : 0) + e.charIndex;
              this.ttsCharIndex = pos;
              const pct = Math.min(100, Math.round((pos / fullText.length) * 100));
              if (progressText) progressText.textContent = `Reading: ${pct}% (${pos}/${fullText.length} chars)`;
            }
          };
          utter.onend = () => {
            this.ttsCharIndex = 0;
            if (progressText) progressText.textContent = 'Completed reading.';
          };
          this.ttsUtterance = utter;
          window.speechSynthesis.speak(utter);
          DB.logAnalyticsEvent('tts_playback', 'tts_start');
          if (progressText) progressText.textContent = 'Reading aloud...';
        });
      }

      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            if (progressText) progressText.textContent = `Paused at character ${this.ttsCharIndex}`;
          }
        });
      }

      if (stopBtn) {
        stopBtn.addEventListener('click', () => {
          window.speechSynthesis.cancel();
          if (progressText) progressText.textContent = `Stopped (saved position: ${this.ttsCharIndex})`;
        });
      }

      if (saveBtn && titleInput && contentInput) {
        saveBtn.addEventListener('click', async () => {
          const content = contentInput.value.trim();
          if (!content) {
            this.showToast('Document content cannot be empty.');
            return;
          }
          const saved = await DB.saveReadingDoc({
            id: this.activeDocId,
            title: titleInput.value.trim() || 'Untitled Reading',
            content,
            lastPosition: this.ttsCharIndex,
            ttsRate: parseFloat(rateSlider?.value || '1.0')
          });
          this.activeDocId = saved.id;
          this.showToast('Reading document & progress saved');
          await DB.logAnalyticsEvent('reading_history', 'doc_saved');
          await this.renderReadingDocs();
        });
      }

      if (newBtn && titleInput && contentInput) {
        newBtn.addEventListener('click', () => {
          this.activeDocId = null;
          this.ttsCharIndex = 0;
          titleInput.value = '';
          contentInput.value = '';
          if (progressText) progressText.textContent = 'Ready';
        });
      }
    }

    async renderReadingDocs() {
      const container = document.getElementById('tts-saved-list');
      if (!container) return;
      const docs = await DB.getReadingDocs();
      if (!docs.length) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No saved documents yet. Save an article to resume reading anytime.</p>`;
        return;
      }
      container.innerHTML = docs.map(doc => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-slate-900 truncate">${this.escapeHtml(doc.title)}</h4>
            <p class="text-xs text-slate-500">Resume pos: ${doc.last_position || 0} chars &bull; Speed: ${doc.tts_rate || 1}x</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" data-load-doc="${doc.id}" class="px-2.5 py-1 text-xs font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-700">Load</button>
            <button type="button" data-del-doc="${doc.id}" class="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">Delete</button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('[data-load-doc]').forEach(btn => {
        btn.addEventListener('click', () => {
          const doc = docs.find(d => d.id === btn.getAttribute('data-load-doc'));
          if (!doc) return;
          this.activeDocId = doc.id;
          this.ttsCharIndex = doc.last_position || 0;
          document.getElementById('tts-doc-title').value = doc.title;
          document.getElementById('tts-doc-content').value = doc.content;
          const slider = document.getElementById('tts-rate-slider');
          const label = document.getElementById('tts-rate-label');
          if (slider) slider.value = doc.tts_rate || 1.0;
          if (label) label.textContent = `${doc.tts_rate || 1.0}x`;
          document.getElementById('tts-progress-status').textContent = `Loaded (resume from char ${this.ttsCharIndex})`;
          this.showToast(`Loaded "${doc.title}"`);
        });
      });

      container.querySelectorAll('[data-del-doc]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await DB.deleteReadingDoc(btn.getAttribute('data-del-doc'));
          await this.renderReadingDocs();
        });
      });
    }

    // ── 3. Custom Voice Macros ─────────────────────────────────────────────
    bindVoiceMacros() {
      const form = document.getElementById('voice-macro-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phrase = document.getElementById('macro-phrase-input').value.trim();
        const actionKey = document.getElementById('macro-action-select').value;
        if (!phrase) return;
        await DB.addVoiceCommand(phrase, actionKey);
        document.getElementById('macro-phrase-input').value = '';
        await DB.logAnalyticsEvent('voice_macro', 'created');
        await this.renderVoiceCommands();
        this.showToast(`Voice macro "${phrase}" saved`);
      });
    }

    async renderVoiceCommands() {
      const list = await DB.getVoiceCommands();
      if (window.InclusionKit.VoiceEngine?.setCustomCommands) {
        window.InclusionKit.VoiceEngine.setCustomCommands(list);
      }
      const container = document.getElementById('voice-macros-list');
      if (!container) return;
      if (!list.length) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No custom voice macros saved yet. Add one above (e.g., "open reading" or "contrast mode").</p>`;
        return;
      }
      container.innerHTML = list.map(cmd => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">"${this.escapeHtml(cmd.phrase)}"</span>
            <span class="text-xs text-slate-600 ml-2">&rarr; ${this.escapeHtml(cmd.action_key)}</span>
          </div>
          <button type="button" data-del-macro="${cmd.id}" class="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">Remove</button>
        </div>
      `).join('');

      container.querySelectorAll('[data-del-macro]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await DB.deleteVoiceCommand(btn.getAttribute('data-del-macro'));
          await this.renderVoiceCommands();
        });
      });
    }

    // ── 4. Analytics & Domain Presets ──────────────────────────────────────
    async renderAnalytics() {
      const events = await DB.getAnalyticsEvents();
      const totalEl = document.getElementById('analytics-total-events');
      const topEl = document.getElementById('analytics-top-features');
      const recentEl = document.getElementById('analytics-recent-log');
      if (totalEl) totalEl.textContent = String(events.length);

      const counts = {};
      events.forEach(ev => {
        counts[ev.feature_key] = (counts[ev.feature_key] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const maxCount = sorted.length ? sorted[0][1] : 1;

      if (topEl) {
        topEl.innerHTML = sorted.length
          ? sorted.map(([key, count]) => {
              const pct = Math.round((count / maxCount) * 100);
              return `
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-700">${this.escapeHtml(key)}</span>
                    <span class="text-sky-700">${count} events</span>
                  </div>
                  <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-sky-600 rounded-full" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')
          : `<p class="text-xs text-slate-500 italic">Use any accessibility feature to record HCI usability metrics.</p>`;
      }

      if (recentEl) {
        recentEl.innerHTML = events.slice(0, 8).map(ev => `
          <div class="text-xs py-1.5 border-b border-slate-100 flex justify-between">
            <span class="font-medium text-slate-800">${this.escapeHtml(ev.feature_key)}</span>
            <span class="text-slate-400">${new Date(ev.created_at).toLocaleTimeString()}</span>
          </div>
        `).join('') || `<p class="text-xs text-slate-500 italic">No recent activity.</p>`;
      }
    }

    bindDomainPresets() {
      const form = document.getElementById('domain-preset-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const domain = document.getElementById('domain-name-input').value.trim();
        const presetName = document.getElementById('domain-label-input').value.trim();
        if (!domain) return;
        await DB.saveDomainPreset({ domain, presetName, settings: { ...State.state } });
        document.getElementById('domain-name-input').value = '';
        document.getElementById('domain-label-input').value = '';
        await this.renderDomainPresets();
        this.showToast(`Saved preset for ${domain}`);
      });
    }

    async renderDomainPresets() {
      const container = document.getElementById('domain-presets-list');
      if (!container) return;
      const list = await DB.getDomainPresets();
      if (!list.length) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No domain presets saved yet (e.g., youtube.com, wikipedia.org).</p>`;
        return;
      }
      container.innerHTML = list.map(p => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <h4 class="font-bold text-sm text-slate-900">${this.escapeHtml(p.domain)}</h4>
            <p class="text-xs text-slate-500">${this.escapeHtml(p.preset_name)}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-apply-domain="${p.id}" class="px-2.5 py-1 text-xs font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-700">Apply</button>
            <button type="button" data-del-domain="${p.id}" class="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">Delete</button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('[data-apply-domain]').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = list.find(x => x.id === btn.getAttribute('data-apply-domain'));
          if (item?.settings) {
            State.loadSettings(item.settings);
            this.updateActivePresetUI();
            this.showToast(`Applied settings for ${item.domain}`);
          }
        });
      });

      container.querySelectorAll('[data-del-domain]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await DB.deleteDomainPreset(btn.getAttribute('data-del-domain'));
          await this.renderDomainPresets();
        });
      });
    }

    // ── 5. Accessibility Issue Reporter ────────────────────────────────────
    bindReports() {
      const form = document.getElementById('issue-report-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pageSection = document.getElementById('report-section-input').value;
        const severity = document.getElementById('report-severity-select').value;
        const description = document.getElementById('report-desc-input').value.trim();
        if (!description) return;
        await DB.submitReport({ pageSection, severity, description });
        document.getElementById('report-desc-input').value = '';
        await DB.logAnalyticsEvent('issue_report', 'submitted');
        await this.renderReports();
        this.showToast('Accessibility issue report submitted');
      });
    }

    async renderReports() {
      const container = document.getElementById('reports-list');
      if (!container) return;
      const list = await DB.getReports();
      if (!list.length) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No accessibility issues reported yet.</p>`;
        return;
      }
      container.innerHTML = list.map(r => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-slate-900">${this.escapeHtml(r.page_section)}</span>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">${this.escapeHtml(r.severity)}</span>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}">${this.escapeHtml(r.status)}</span>
            </div>
            <p class="text-xs text-slate-700">${this.escapeHtml(r.description)}</p>
          </div>
          <button type="button" data-toggle-report="${r.id}" data-next-status="${r.status === 'open' ? 'resolved' : 'open'}"
                  class="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shrink-0">
            ${r.status === 'open' ? 'Mark Resolved' : 'Reopen'}
          </button>
        </div>
      `).join('');

      container.querySelectorAll('[data-toggle-report]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await DB.updateReportStatus(btn.getAttribute('data-toggle-report'), btn.getAttribute('data-next-status'));
          await this.renderReports();
        });
      });
    }

    // ── 6. Auth & Cloud Connection Modal ───────────────────────────────────
    bindAuthModal() {
      const modal = document.getElementById('account-modal');
      const openBtn = document.getElementById('btn-open-account');
      const closeBtn = document.getElementById('btn-close-account');
      const authForm = document.getElementById('auth-form');
      const signupBtn = document.getElementById('btn-auth-signup');
      const signoutBtn = document.getElementById('btn-auth-signout');
      const cloudForm = document.getElementById('cloud-config-form');

      if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
          const creds = Config.getCredentials();
          const urlInput = document.getElementById('cfg-supabase-url');
          const keyInput = document.getElementById('cfg-supabase-key');
          if (urlInput) urlInput.value = creds.url;
          if (keyInput) keyInput.value = creds.anonKey;
          modal.classList.remove('hidden');
        });
      }
      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      }

      const helpModal = document.getElementById('help-modal');
      const openHelpBtn = document.getElementById('btn-open-help');
      const closeHelpBtn = document.getElementById('btn-close-help');
      if (openHelpBtn && helpModal) {
        openHelpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
      }
      if (closeHelpBtn && helpModal) {
        closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
      }

      if (authForm) {
        authForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('auth-email').value.trim();
          const password = document.getElementById('auth-password').value;
          try {
            await DB.signIn(email, password);
            modal.classList.add('hidden');
            this.showToast('Signed in & synced with cloud');
          } catch (err) {
            this.showToast(err.message, true);
          }
        });
      }

      if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
          const email = document.getElementById('auth-email').value.trim();
          const password = document.getElementById('auth-password').value;
          const name = document.getElementById('auth-name').value.trim();
          if (!email || !password || password.length < 6) {
            this.showToast('Please enter a valid email and password (min 6 characters).', true);
            return;
          }
          try {
            await DB.signUp(email, password, name);
            modal.classList.add('hidden');
            this.showToast('Account created & signed in!');
          } catch (err) {
            this.showToast(err.message, true);
          }
        });
      }

      if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
          await DB.signOut();
          this.showToast('Signed out');
        });
      }

      if (cloudForm) {
        cloudForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('cfg-supabase-url').value.trim();
          const key = document.getElementById('cfg-supabase-key').value.trim();
          Config.setCredentials(url, key);
          const mode = DB.reinitialize();
          this.updateAuthUI(DB.user);
          this.showToast(mode === 'cloud' ? 'Supabase connected!' : 'Invalid Supabase URL/Key', mode !== 'cloud');
        });
      }
    }

    updateAuthUI(user) {
      const badge = document.getElementById('cloud-status-badge');
      const authBtnLabel = document.getElementById('account-btn-label');
      const signedInBox = document.getElementById('auth-signed-in-box');
      const authForm = document.getElementById('auth-form');
      const userEmailEl = document.getElementById('auth-user-email');

      if (badge) {
        if (DB.isCloudActive() && user) {
          badge.textContent = 'Cloud Synced';
          badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        } else if (DB.isCloudActive()) {
          badge.textContent = 'Cloud Ready (Sign In)';
          badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-300';
        } else {
          badge.textContent = 'Local Mode';
          badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300';
        }
      }

      if (authBtnLabel) {
        authBtnLabel.textContent = user ? (user.email?.split('@')[0] || 'Account') : 'Sign In / Cloud';
      }
      if (signedInBox && authForm) {
        signedInBox.classList.toggle('hidden', !user);
        authForm.classList.toggle('hidden', Boolean(user));
        if (userEmailEl && user) userEmailEl.textContent = user.email;
      }
    }

    showToast(message, isError = false) {
      const toast = document.getElementById('ik-toast');
      if (!toast) return;
      toast.textContent = message;
      toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
        isError ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
      }`;
      toast.classList.remove('hidden');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
    }

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  window.InclusionKit.Workspace = new WorkspaceController();
})();
