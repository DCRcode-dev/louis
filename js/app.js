/**
 * Main Application Controller for MedHoldings Executive Mobile Dashboard
 * Initializes views, navigation, pull-to-refresh, calendar, and data sync.
 */

import { dataService } from './data-service.js';
import { ExpandableCalendar } from '../components/calendar.js';
import { PullToRefresh } from '../components/pull-to-refresh.js';
import { SettingsModal } from '../components/modal.js';
import { DailyView } from '../views/daily-view.js';
import { SynthesisView } from '../views/synthesis-view.js';

class App {
  constructor() {
    this.currentViewId = 'view-daily';
    this.selectedDate = dataService.getLatestDate();

    this.dailyView = new DailyView({
      containerId: 'daily-content-mount',
      dataService: dataService
    });

    this.synthesisView = new SynthesisView({
      containerId: 'synthesis-content-mount',
      dataService: dataService
    });

    this.calendar = null;
    this.modal = null;
    this.ptr = null;

    this.init();
  }

  async init() {
    // 1. Initialize views
    this.initCalendar();
    this.dailyView.render(this.selectedDate);
    this.synthesisView.render();

    // 2. Initialize pull-to-refresh
    const scrollContainer = document.getElementById('main-scroll-container');
    this.ptr = new PullToRefresh(scrollContainer, async () => {
      await this.refreshData(true);
    });

    // 3. Initialize Settings Bottom Sheet Modal
    this.modal = new SettingsModal({
      dataService: dataService,
      onSyncTriggered: async (force) => {
        await this.refreshData(force);
      }
    });

    // 4. Bind top bar & bottom tab events
    this.bindNavigation();

    // 5. Check if background sync is possible or if cached
    this.updateHeaderSyncIndicator();

    // 6. Register Service Worker for PWA
    this.registerServiceWorker();

    // Expose app instance globally for cross-component triggers
    window.__app = this;
  }

  initCalendar() {
    this.calendar = new ExpandableCalendar({
      containerId: 'calendar-mount',
      initialDate: this.selectedDate,
      getAvailableDates: () => dataService.getAllDates(),
      onDateSelect: (newDateStr) => {
        this.selectedDate = newDateStr;
        this.dailyView.render(this.selectedDate);
      }
    });
  }

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    if (this.calendar) {
      this.calendar.setSelectedDate(dateStr);
    } else {
      this.dailyView.render(this.selectedDate);
    }
  }

  bindNavigation() {
    // Top bar settings button
    const settingsBtn = document.getElementById('btn-open-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (this.modal) this.modal.open();
      });
    }

    // Bottom tab bar switching
    const tabDaily = document.getElementById('tab-daily');
    const tabSynthesis = document.getElementById('tab-synthesis');

    if (tabDaily) {
      tabDaily.addEventListener('click', () => this.switchView('view-daily'));
    }
    if (tabSynthesis) {
      tabSynthesis.addEventListener('click', () => this.switchView('view-synthesis'));
    }
  }

  switchView(targetViewId) {
    if (this.currentViewId === targetViewId) {
      // Tap on active tab scrolls to top
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.currentViewId = targetViewId;

    // Toggle view containers
    const dailyViewEl = document.getElementById('view-daily');
    const synthViewEl = document.getElementById('view-synthesis');
    const tabDaily = document.getElementById('tab-daily');
    const tabSynthesis = document.getElementById('tab-synthesis');

    if (targetViewId === 'view-daily') {
      dailyViewEl.classList.add('is-active');
      synthViewEl.classList.remove('is-active');
      tabDaily.classList.add('is-active');
      tabSynthesis.classList.remove('is-active');
      tabDaily.setAttribute('aria-selected', 'true');
      tabSynthesis.setAttribute('aria-selected', 'false');
      // Scroll to top
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) scrollContainer.scrollTop = 0;
    } else {
      synthViewEl.classList.add('is-active');
      dailyViewEl.classList.remove('is-active');
      tabSynthesis.classList.add('is-active');
      tabDaily.classList.remove('is-active');
      tabSynthesis.setAttribute('aria-selected', 'true');
      tabDaily.setAttribute('aria-selected', 'false');
      this.synthesisView.render();
      // Scroll to top
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) scrollContainer.scrollTop = 0;
    }
  }

  async refreshData(force = false) {
    const res = await dataService.fetchData(force);
    
    // Update active views with fresh data
    if (this.calendar) {
      this.calendar.render();
    }
    this.dailyView.render(this.selectedDate);
    this.synthesisView.render();
    this.updateHeaderSyncIndicator();

    return res;
  }

  updateHeaderSyncIndicator() {
    const indicator = document.getElementById('header-sync-indicator');
    if (!indicator) return;

    const hasUrl = !!dataService.config.appsScriptUrl;
    if (hasUrl) {
      indicator.style.backgroundColor = '#059669'; // Emerald = Live
      indicator.title = 'Live Sync Configured';
    } else {
      indicator.style.backgroundColor = '#2563EB'; // Blue = Local Cache
      indicator.title = 'Running on Executive Cache';
    }
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) return;

    let swReg = null;
    let updateAccepted = false;

    const showUpdateChip = (reg) => {
      if (document.getElementById('update-chip')) return;
      const chip = document.createElement('button');
      chip.id = 'update-chip';
      chip.setAttribute('aria-label', 'New update ready, tap to reload');
      chip.innerHTML = '<span class="uc-dot"></span><span>Updated · Tap to restart</span>';
      chip.onclick = () => {
        updateAccepted = true;
        if (navigator.vibrate) navigator.vibrate(12);
        chip.innerHTML = '<span class="uc-dot"></span><span>Restarting…</span>';
        chip.disabled = true;
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      };
      document.body.appendChild(chip);
      requestAnimationFrame(() => {
        chip.classList.add('on');
      });
    };

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then((reg) => {
          swReg = reg;
          this.swReg = reg;
          console.log('MedHoldings PWA Service Worker registered:', reg.scope);

          // If a new worker is already waiting, show update pill immediately
          if (reg.waiting) {
            showUpdateChip(reg);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateChip(reg);
              }
            });
          });
        })
        .catch((err) => {
          console.log('Service Worker registration skipped:', err);
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateAccepted) {
        window.location.reload();
      }
    });

    // Check for updates whenever user returns to the app
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastCheck < 60 * 1000) return; // 1 min throttle
      lastCheck = Date.now();
      if (swReg) swReg.update().catch(() => {});
    });

    window.__checkAppUpdate = () => {
      if (swReg) {
        swReg.update().then(() => {
          setTimeout(() => {
            if (swReg.waiting || swReg.installing) {
              showUpdateChip(swReg);
            }
          }, 800);
        }).catch(() => {});
      }
    };
  }
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
