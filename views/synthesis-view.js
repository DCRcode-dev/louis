/**
 * Weekly Synthesis & Trends View
 * Presents weekly rollups, emerging operational patterns, and portfolio insights
 * synthesized by Claude from weekly transcripts.
 */

import { renderMarkdown } from '../js/markdown.js';

export class SynthesisView {
  constructor({ containerId, dataService }) {
    this.container = document.getElementById(containerId);
    this.dataService = dataService;
    this.selectedWeekIndex = 0;
  }

  render() {
    if (!this.container) return;

    const syntheses = this.dataService.getWeeklySyntheses();
    if (!syntheses || syntheses.length === 0) {
      this.renderEmpty();
      return;
    }

    const current = syntheses[this.selectedWeekIndex] || syntheses[0];

    // Build week switcher pills
    const weekTabsHtml = syntheses.map((item, idx) => `
      <button class="ios-week-pill ${idx === this.selectedWeekIndex ? 'is-active' : ''}" data-week-idx="${idx}">
        <span class="ios-week-range">${this.escape(item.weekRange)}</span>
        <span class="ios-week-badge">${this.escape(item.status || `W${idx + 1}`)}</span>
      </button>
    `).join('');

    // Emerging trends
    const trendsHtml = (current.emergingTrends || []).map(trend => {
      const isPositive = trend.sentiment === 'positive';
      const badgeClass = isPositive ? 'trend-badge-positive' : 'trend-badge-watch';
      const badgeText = isPositive ? 'Tailwind / Positive' : 'Operational Watch';

      return `
        <div class="ios-trend-item">
          <div class="ios-trend-header">
            <span class="ios-trend-badge ${badgeClass}">${badgeText}</span>
            <h4 class="ios-trend-title">${this.escape(trend.title)}</h4>
          </div>
          <p class="ios-trend-detail">${renderMarkdown(trend.detail)}</p>
        </div>
      `;
    }).join('');

    // Key accomplishments
    const accomplishmentsHtml = (current.keyAccomplishments || []).map(item => `
      <li class="ios-accomplishment-item">
        <div class="ios-check-bullet">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#059669" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="ios-accomplishment-text">${renderMarkdown(item)}</div>
      </li>
    `).join('');

    // Executive Watchlist
    const watchlistHtml = (current.executiveWatchlist || []).map(item => `
      <li class="ios-watchlist-item">
        <div class="ios-watch-bullet">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#D97706" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="ios-watchlist-text">${renderMarkdown(item)}</div>
      </li>
    `).join('');

    this.container.innerHTML = `
      <div class="ios-synthesis-content">
        <!-- Week Selector Carousel / Bar -->
        <div class="ios-week-selector-bar">
          ${weekTabsHtml}
        </div>

        <!-- Weekly Executive Rollup Card -->
        <section class="ios-card ios-synthesis-card">
          <div class="ios-pulse-header">
            <div class="ios-pulse-badge ios-badge-navy">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              PORTFOLIO SYNTHESIS
            </div>
            <span class="ios-pulse-meta">${this.escape(current.weekRange)}</span>
          </div>

          <h2 class="ios-card-title">${this.escape(current.headline)}</h2>

          <div class="ios-synthesis-body">
            ${renderMarkdown(current.executiveSummary)}
          </div>
        </section>

        <!-- Key Strategic Accomplishments -->
        <section class="ios-card">
          <div class="ios-section-header">
            <div class="ios-section-title-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 class="ios-section-title">Key Accomplishments Logged</h3>
            </div>
            <span class="ios-badge-subtle">${(current.keyAccomplishments || []).length} Logged</span>
          </div>

          <ul class="ios-accomplishments-list">
            ${accomplishmentsHtml}
          </ul>
        </section>

        <!-- Emerging Operational Patterns & Trends -->
        <section class="ios-card">
          <div class="ios-section-header">
            <div class="ios-section-title-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563EB" stroke-width="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <h3 class="ios-section-title">Emerging Operational Trends</h3>
            </div>
            <span class="ios-badge-subtle">Claude Analysis</span>
          </div>

          <div class="ios-trends-stack">
            ${trendsHtml}
          </div>
        </section>

        <!-- Executive Watchlist / Attention Required -->
        ${current.executiveWatchlist && current.executiveWatchlist.length > 0 ? `
        <section class="ios-card ios-watchlist-card">
          <div class="ios-section-header">
            <div class="ios-section-title-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D97706" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 class="ios-section-title">Executive Strategic Watchlist</h3>
            </div>
            <span class="ios-badge-subtle">VP Action Focus</span>
          </div>

          <ul class="ios-watchlist-list">
            ${watchlistHtml}
          </ul>
        </section>` : ''}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const pills = this.container.querySelectorAll('.ios-week-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.dataset.weekIdx, 10);
        if (!isNaN(idx) && idx !== this.selectedWeekIndex) {
          this.selectedWeekIndex = idx;
          this.render();
        }
      });
    });
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="ios-empty-state-card">
        <h3 class="ios-empty-title">No Weekly Rollup Synthesized Yet</h3>
        <p class="ios-empty-desc">Weekly trends and cross-facility syntheses are compiled by Claude at the end of each operational cycle.</p>
      </div>
    `;
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
