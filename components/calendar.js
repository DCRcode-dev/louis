/**
 * Native iOS Expandable Calendar Component
 * Smoothly toggles between a compact date bar and a full monthly calendar grid.
 * Highlights dates that have Claude recording summaries with dot badges.
 */

export class ExpandableCalendar {
  constructor({ containerId, onDateSelect, getAvailableDates, initialDate }) {
    this.container = document.getElementById(containerId);
    this.onDateSelect = onDateSelect;
    this.getAvailableDates = getAvailableDates;
    
    // Parse initial date (YYYY-MM-DD)
    this.selectedDateStr = initialDate || new Date().toISOString().split('T')[0];
    const [year, month, day] = this.selectedDateStr.split('-').map(n => parseInt(n, 10));
    this.currentViewDate = new Date(year, month - 1, day);
    
    this.isExpanded = false;
    this.render();
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    const gridContainer = this.container.querySelector('.ios-cal-expandable');
    const toggleIcon = this.container.querySelector('.ios-cal-toggle-chevron');
    
    if (this.isExpanded) {
      gridContainer.classList.add('is-open');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
    } else {
      gridContainer.classList.remove('is-open');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    }
  }

  setSelectedDate(dateStr) {
    this.selectedDateStr = dateStr;
    const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
    this.currentViewDate = new Date(year, month - 1, day);
    this.render();
    if (this.onDateSelect) {
      this.onDateSelect(dateStr);
    }
  }

  nextMonth() {
    this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
    this.renderCalendarGrid();
  }

  prevMonth() {
    this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
    this.renderCalendarGrid();
  }

  render() {
    if (!this.container) return;

    const availableDates = this.getAvailableDates ? this.getAvailableDates() : [];
    const formattedSelected = this.formatSelectedLabel(this.selectedDateStr);

    this.container.innerHTML = `
      <div class="ios-calendar-wrapper">
        <!-- Compact Bar: Selected Date + Quick Scrubber + Expand Button -->
        <div class="ios-cal-header-bar">
          <div class="ios-cal-selected-info">
            <span class="ios-cal-subheading">SELECTED BRIEFING</span>
            <div class="ios-cal-date-title" id="cal-selected-title">${formattedSelected}</div>
          </div>
          
          <button class="ios-cal-toggle-btn" id="btn-toggle-calendar" aria-label="Toggle Full Calendar">
            <svg class="ios-cal-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="ios-cal-toggle-label">${this.isExpanded ? 'Hide' : 'Calendar'}</span>
            <svg class="ios-cal-toggle-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: ${this.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <!-- Quick Horizontal Date Scrubber -->
        <div class="ios-cal-scrubber" id="cal-scrubber">
          ${this.renderQuickScrubber(availableDates)}
        </div>

        <!-- Expandable Full Month Drawer -->
        <div class="ios-cal-expandable ${this.isExpanded ? 'is-open' : ''}">
          <div class="ios-cal-drawer-inner">
            <div class="ios-cal-month-nav">
              <button class="ios-cal-nav-arrow" id="cal-prev-month" aria-label="Previous Month">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <div class="ios-cal-month-title" id="cal-month-title">
                ${this.currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button class="ios-cal-nav-arrow" id="cal-next-month" aria-label="Next Month">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <!-- Days of Week Header -->
            <div class="ios-cal-weekdays">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            <!-- Days Grid -->
            <div class="ios-cal-grid" id="cal-grid">
              ${this.buildGridHtml(availableDates)}
            </div>

            <div class="ios-cal-legend">
              <div class="ios-legend-item">
                <span class="ios-legend-dot has-data"></span>
                <span>Recording Briefing Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderQuickScrubber(availableDates) {
    if (!availableDates || availableDates.length === 0) return '';
    
    // Sort dates ascending for horizontal timeline feel
    const sorted = [...availableDates].sort();
    
    return sorted.map(dateStr => {
      const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
      const dt = new Date(y, m - 1, d);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dt.getDate();
      const monthShort = dt.toLocaleDateString('en-US', { month: 'short' });
      const isSelected = dateStr === this.selectedDateStr;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = dateStr === todayStr;

      return `
        <button class="ios-scrub-pill ${isSelected ? 'is-active' : ''}" data-date="${dateStr}">
          <span class="ios-scrub-weekday">${isToday ? 'Today' : dayName}</span>
          <span class="ios-scrub-day">${dayNum}</span>
          <span class="ios-scrub-month">${monthShort}</span>
          <span class="ios-scrub-dot"></span>
        </button>
      `;
    }).join('');
  }

  buildGridHtml(availableDates) {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    let html = '';

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="ios-cal-day is-empty"></div>`;
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasData = availableDates.includes(dateStr);
      const isSelected = dateStr === this.selectedDateStr;
      const isToday = dateStr === todayStr;

      const classes = ['ios-cal-day'];
      if (hasData) classes.push('has-briefing');
      if (isSelected) classes.push('is-selected');
      if (isToday) classes.push('is-today');
      if (!hasData) classes.push('no-briefing');

      html += `
        <button class="${classes.join(' ')}" data-date="${dateStr}" ${!hasData ? 'title="No recording logged"' : ''}>
          <span class="ios-cal-number">${d}</span>
          ${hasData ? '<span class="ios-cal-dot"></span>' : ''}
        </button>
      `;
    }

    return html;
  }

  renderCalendarGrid() {
    const availableDates = this.getAvailableDates ? this.getAvailableDates() : [];
    const grid = this.container.querySelector('#cal-grid');
    const monthTitle = this.container.querySelector('#cal-month-title');
    
    if (grid) {
      grid.innerHTML = this.buildGridHtml(availableDates);
    }
    if (monthTitle) {
      monthTitle.textContent = this.currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    this.attachGridListeners();
  }

  attachEventListeners() {
    const toggleBtn = this.container.querySelector('#btn-toggle-calendar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    const prevBtn = this.container.querySelector('#cal-prev-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevMonth());
    }

    const nextBtn = this.container.querySelector('#cal-next-month');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMonth());
    }

    // Scrubber buttons
    const scrubber = this.container.querySelector('#cal-scrubber');
    if (scrubber) {
      scrubber.addEventListener('click', (e) => {
        const pill = e.target.closest('.ios-scrub-pill');
        if (pill && pill.dataset.date) {
          this.setSelectedDate(pill.dataset.date);
        }
      });
    }

    this.attachGridListeners();
  }

  attachGridListeners() {
    const grid = this.container.querySelector('#cal-grid');
    if (!grid) return;

    grid.querySelectorAll('.ios-cal-day[data-date]').forEach(dayBtn => {
      dayBtn.addEventListener('click', () => {
        const dateStr = dayBtn.dataset.date;
        this.setSelectedDate(dateStr);
        // Automatically close calendar drawer on selection for fluid mobile UX
        if (this.isExpanded) {
          this.toggle();
        }
      });
    });
  }

  formatSelectedLabel(dateStr) {
    try {
      const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
}
