/**
 * Daily Briefing Feed View
 * Renders executive daily recording summaries ingested from Google Sheets via Claude.
 */

import { renderMarkdown } from '../js/markdown.js';

export class DailyView {
  constructor({ containerId, dataService }) {
    this.container = document.getElementById(containerId);
    this.dataService = dataService;
  }

  render(dateStr) {
    if (!this.container) return;

    const summary = this.dataService.getSummaryByDate(dateStr);

    if (!summary) {
      this.renderEmptyState(dateStr);
      return;
    }

    const tagsHtml = (summary.tags || []).map(tag => `
      <span class="ios-tag-pill">${this.escape(tag)}</span>
    `).join('');

    this.container.innerHTML = `
      <div class="ios-daily-content">
        <!-- Top Executive Pulse Card -->
        <section class="ios-card ios-pulse-card">
          <div class="ios-pulse-header">
            <div class="ios-pulse-badge">
              <span class="ios-pulse-dot"></span>
              EXECUTIVE PULSE
            </div>
            <span class="ios-pulse-meta">${this.escape(summary.meetingType || 'Daily Session')}</span>
          </div>
          
          <h2 class="ios-card-title">${this.escape(summary.title)}</h2>

          <div class="ios-pulse-body">
            ${renderMarkdown(summary.executivePulse)}
          </div>

          <div class="ios-session-meta-strip">
            <div class="ios-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${this.escape(summary.duration || 'Session')}</span>
            </div>
            <div class="ios-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Claude MCP Transcript</span>
            </div>
            ${summary.processedAt ? `
            <div class="ios-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Processed: ${this.escape(summary.processedAt)}</span>
            </div>` : ''}
          </div>

          <div class="ios-tags-row">
            ${tagsHtml}
          </div>
        </section>

        <!-- Detailed Recording Summary Section -->
        <section class="ios-card ios-summary-card">
          <div class="ios-section-header">
            <div class="ios-section-title-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#B68628" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h3 class="ios-section-title">Recording Briefing & Operational Notes</h3>
            </div>
            <span class="ios-badge-subtle">Full Summary</span>
          </div>

          <div class="ios-markdown-container">
            ${renderMarkdown(summary.recordingSummary)}
          </div>
        </section>
      </div>
    `;
  }

  renderEmptyState(dateStr) {
    const availableDates = this.dataService.getAllDates();
    let formattedDate = dateStr;
    try {
      const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
      formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}

    this.container.innerHTML = `
      <div class="ios-empty-state-card">
        <div class="ios-empty-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#B8A99A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h3 class="ios-empty-title">No Recording Logged for ${this.escape(formattedDate)}</h3>
        <p class="ios-empty-desc">
          Claude did not process any executive recording transcripts for this date, or the session has not yet synced to Google Sheets.
        </p>
        <div class="ios-empty-action">
          <button class="ios-btn-pill" id="btn-jump-latest">
            Jump to Latest Briefing (${availableDates[0] || 'Today'})
          </button>
        </div>
      </div>
    `;

    const jumpBtn = this.container.querySelector('#btn-jump-latest');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        const latest = this.dataService.getLatestDate();
        if (window.__app && window.__app.selectDate) {
          window.__app.selectDate(latest);
        }
      });
    }
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
