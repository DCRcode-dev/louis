/**
 * Native iOS Pull-to-Refresh Gesture Controller
 * Provides natural iOS spring physics, rubber-band resistance,
 * activity spinner rotation, and haptic feedback.
 */

export class PullToRefresh {
  constructor(containerElement, triggerCallback) {
    this.container = containerElement;
    this.callback = triggerCallback;
    this.indicator = document.getElementById('ptr-indicator');
    this.spinner = document.getElementById('ptr-spinner');
    
    this.startY = 0;
    this.currentY = 0;
    this.isPulling = false;
    this.isRefreshing = false;
    this.threshold = 68; // trigger threshold in px
    this.maxPull = 110;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    this.container.addEventListener('touchcancel', this.onTouchCancel.bind(this), { passive: true });
  }

  onTouchStart(e) {
    if (this.isRefreshing) return;
    
    // Only allow pull-down if we are scrolled to the very top
    if (this.container.scrollTop <= 0) {
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  onTouchMove(e) {
    if (!this.isPulling || this.isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - this.startY;

    // Only respond to downward pulls while at top
    if (diff > 0 && this.container.scrollTop <= 0) {
      // Prevent browser default overscroll bounce while handling pull-to-refresh
      if (e.cancelable) e.preventDefault();

      // iOS rubber-band resistance curve
      const pullDistance = Math.min(diff * 0.45, this.maxPull);
      this.updateIndicator(pullDistance);
    } else {
      this.resetIndicator();
      this.isPulling = false;
    }
  }

  onTouchEnd() {
    if (!this.isPulling || this.isRefreshing) return;
    this.isPulling = false;

    const diff = this.currentY - this.startY;
    const pullDistance = Math.min(diff * 0.45, this.maxPull);

    if (pullDistance >= this.threshold) {
      this.triggerRefresh();
    } else {
      this.resetIndicator(true);
    }
  }

  onTouchCancel() {
    this.isPulling = false;
    this.resetIndicator(true);
  }

  updateIndicator(distance) {
    if (!this.indicator) return;
    this.indicator.style.transform = `translate3d(0, ${distance}px, 0)`;
    this.indicator.style.opacity = Math.min(distance / this.threshold, 1).toString();

    // Rotate spinner proportionally to pull
    if (this.spinner) {
      const rotation = (distance / this.threshold) * 280;
      this.spinner.style.transform = `rotate(${rotation}deg)`;
    }

    if (distance >= this.threshold) {
      this.indicator.classList.add('ptr-ready');
      // Subtle haptic tick if crossing threshold for first time
      if (!this.hasVibrated && navigator.vibrate) {
        navigator.vibrate(10);
        this.hasVibrated = true;
      }
    } else {
      this.indicator.classList.remove('ptr-ready');
      this.hasVibrated = false;
    }
  }

  async triggerRefresh() {
    this.isRefreshing = true;
    if (this.indicator) {
      this.indicator.classList.add('ptr-loading');
      this.indicator.style.transform = `translate3d(0, 52px, 0)`;
    }

    try {
      if (this.callback) {
        await this.callback();
      }
    } finally {
      setTimeout(() => {
        this.resetIndicator(true);
        this.isRefreshing = false;
        if (this.indicator) {
          this.indicator.classList.remove('ptr-loading', 'ptr-ready');
        }
      }, 450);
    }
  }

  resetIndicator(animated = true) {
    if (!this.indicator) return;
    if (animated) {
      this.indicator.style.transition = 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.25s ease';
    } else {
      this.indicator.style.transition = 'none';
    }
    this.indicator.style.transform = 'translate3d(0, 0px, 0)';
    this.indicator.style.opacity = '0';
    
    setTimeout(() => {
      if (this.indicator) this.indicator.style.transition = '';
    }, 350);
  }
}
