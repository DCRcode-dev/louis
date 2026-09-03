/**
 * iOS Slide-Up Bottom Sheet Modal Controller
 * Handles Google Sheets / Apps Script connection settings,
 * manual sync triggers, and data source management.
 */

export class SettingsModal {
  constructor({ dataService, onSyncTriggered }) {
    this.dataService = dataService;
    this.onSyncTriggered = onSyncTriggered;
    this.overlay = document.getElementById('settings-overlay');
    this.sheet = document.getElementById('settings-sheet');
    this.closeBtn = document.getElementById('btn-close-settings');
    this.saveBtn = document.getElementById('btn-save-settings');
    this.syncBtn = document.getElementById('btn-sync-now');
    this.otaBtn = document.getElementById('btn-check-ota');
    this.resetBtn = document.getElementById('btn-reset-sample');
    this.urlInput = document.getElementById('input-appscript-url');
    this.syncStatusText = document.getElementById('sync-status-display');
    this.lastSyncText = document.getElementById('sync-timestamp-display');

    this.isOpen = false;
    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.handleSave());
    }
    if (this.syncBtn) {
      this.syncBtn.addEventListener('click', () => this.handleManualSync());
    }
    if (this.otaBtn) {
      this.otaBtn.addEventListener('click', () => {
        this.showFeedback('Checking for updates…');
        if (window.__checkAppUpdate) {
          window.__checkAppUpdate();
          setTimeout(() => {
            this.showFeedback('App is up to date');
          }, 1200);
        }
      });
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.handleResetData());
    }

    // Touch gesture swipe-down to dismiss modal
    let startY = 0;
    if (this.sheet) {
      this.sheet.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
      }, { passive: true });

      this.sheet.addEventListener('touchmove', (e) => {
        const diff = e.touches[0].clientY - startY;
        if (diff > 0 && this.sheet.scrollTop <= 0) {
          this.sheet.style.transform = `translateY(${diff}px)`;
        }
      }, { passive: true });

      this.sheet.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].clientY - startY;
        if (diff > 120) {
          this.close();
        } else {
          this.sheet.style.transform = '';
        }
      }, { passive: true });
    }
  }

  open() {
    this.isOpen = true;
    const config = this.dataService.config;
    if (this.urlInput) {
      this.urlInput.value = config.appsScriptUrl || '';
    }
    this.updateStatusDisplay();

    if (this.overlay && this.sheet) {
      this.overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        this.sheet.style.transform = 'translateY(0)';
      }, 10);
    }
  }

  close() {
    this.isOpen = false;
    if (this.sheet) {
      this.sheet.style.transform = 'translateY(100%)';
    }
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.classList.remove('is-visible');
      }
      document.body.style.overflow = '';
      if (this.sheet) this.sheet.style.transform = '';
    }, 300);
  }

  updateStatusDisplay() {
    const lastSync = this.dataService.loadLastSync();
    const hasUrl = !!this.dataService.config.appsScriptUrl;

    if (this.syncStatusText) {
      this.syncStatusText.textContent = hasUrl ? 'Connected: Google Sheets Live' : 'Active: High-Fidelity Local Cache';
      this.syncStatusText.className = hasUrl ? 'status-pill status-live' : 'status-pill status-cached';
    }

    if (this.lastSyncText) {
      if (lastSync) {
        const dt = new Date(lastSync);
        this.lastSyncText.textContent = `Last sync: ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${dt.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      } else {
        this.lastSyncText.textContent = 'Last sync: Instant cache loaded';
      }
    }
  }

  handleSave() {
    const url = this.urlInput ? this.urlInput.value.trim() : '';
    this.dataService.saveConfig({ appsScriptUrl: url });
    this.updateStatusDisplay();
    this.showFeedback('Settings saved successfully');
    
    if (url && this.onSyncTriggered) {
      this.onSyncTriggered(true);
    }
  }

  async handleManualSync() {
    if (this.syncBtn) {
      this.syncBtn.disabled = true;
      this.syncBtn.textContent = 'Syncing...';
    }
    
    try {
      if (this.onSyncTriggered) {
        await this.onSyncTriggered(true);
      }
      this.updateStatusDisplay();
      this.showFeedback('Synced successfully');
    } catch (e) {
      this.showFeedback('Sync issue: ' + e.message, true);
    } finally {
      if (this.syncBtn) {
        this.syncBtn.disabled = false;
        this.syncBtn.textContent = 'Sync Now';
      }
    }
  }

  handleResetData() {
    if (confirm('Reset to standard MedHoldings executive sample briefings?')) {
      this.dataService.resetToDefaultData();
      if (this.urlInput) this.urlInput.value = '';
      this.dataService.saveConfig({ appsScriptUrl: '' });
      this.updateStatusDisplay();
      if (this.onSyncTriggered) this.onSyncTriggered(false);
      this.showFeedback('Reset to default briefings');
    }
  }

  showFeedback(msg, isError = false) {
    const note = document.getElementById('modal-toast-note');
    if (note) {
      note.textContent = msg;
      note.style.color = isError ? '#DC2626' : '#059669';
      note.style.opacity = '1';
      setTimeout(() => {
        note.style.opacity = '0';
      }, 3000);
    }
  }
}
