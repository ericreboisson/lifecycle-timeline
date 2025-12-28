/**
 * Default translations for the timeline component.
 * @type {Object<string, Object<string, string>>}
 */
const DEFAULT_TRANSLATIONS = {
  en: {
    filter: "Filter versions...", oss: "OSS Support", ent: "Enterprise Support",
    eol: "Out of Support", less: "Show Less", more: "Show {n} more versions",
    notes: "View Release Notes for {v}", dark: "Toggle Dark Mode",
    ossDesc: "Free security updates and bugfixes.",
    entDesc: "Expert support during OSS plus extended support after EOL.",
    eolDesc: "End of life. No further updates are provided.",
    today: "Today's date: {date}"
  },
  fr: {
    filter: "Filtrer les versions...", oss: "Support OSS", ent: "Support Entreprise",
    eol: "Fin de support", less: "Voir moins", more: "Voir {n} versions supplémentaires",
    notes: "Voir les notes de version pour {v}", dark: "Changer le mode sombre",
    ossDesc: "Mises à jour de sécurité et corrections de bugs gratuites.",
    entDesc: "Support pendant la période OSS plus support étendu après.",
    eolDesc: "Version en fin de vie. Plus de mises à jour.",
    today: "Date du jour : {date}"
  }
};

/**
 * Represents a Lifecycle Timeline component.
 */
export default class Timeline {
  /**
   * Creates an instance of Timeline.
   * @param {string} elementId - The ID of the root element.
   * @param {Array<Object>} data - The data array containing version details.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.visibleCount=3] - Number of versions to show initially.
   * @param {string} [options.locale] - Language code (e.g., 'en', 'fr').
   * @param {Object} [options.i18n] - Custom translations to merge or override.
   */
  constructor(elementId, data, options = {}) {
    this.root = document.getElementById(elementId);
    if (!this.root) return;

    this.options = options;
    this.visibleCount = options.visibleCount || 3;
    this.isExpanded = false;
    this.theme = 'light';
    this.filterText = '';

    // Merge default translations with custom ones
    this.translations = { ...DEFAULT_TRANSLATIONS, ...(options.i18n || {}) };
    this.locale = options.locale || this.detectLanguage();

    this.setupBaseLayout();
    this.updateData(data);
  }

  /**
   * Detects the browser language.
   * @returns {string} The detected language code or 'en'.
   */
  detectLanguage() {
    const lang = (navigator.language || 'en').split('-')[0];
    return this.translations[lang] ? lang : 'en';
  }

  /**
   * Translates a key based on the current locale.
   * @param {string} key - The translation key.
   * @param {Object} [params={}] - Parameters to replace in the translation string.
   * @returns {string} The translated string.
   */
  t(key, params = {}) {
    let t = (this.translations[this.locale] || this.translations.en)[key] || key;
    Object.keys(params).forEach(p => t = t.replace(`{${p}}`, params[p]));
    return t;
  }

  /**
   * Sets up the initial layout of the timeline.
   */
  setupBaseLayout() {
    this.root.innerHTML = '';
    this.root.setAttribute('role', 'application');
    this.root.setAttribute('aria-label', 'Product Lifecycle Timeline');

    this.renderToolbar();
    this.renderThemeToggle();

    this.wrapper = this.el('div', 'timeline-wrapper', this.root);
    // Added ARIA grid for structured data
    this.wrapper.setAttribute('role', 'grid');
    this.wrapper.setAttribute('aria-readonly', 'true');

    this.axis = this.el('div', 'timeline-axis', this.wrapper);
    this.axis.setAttribute('role', 'row');

    this.tracks = this.el('div', 'timeline-tracks', this.wrapper);

    this.legendContainer = this.el('div', 'timeline-legend-container', this.wrapper);
  }

  /**
   * Updates the timeline data and re-renders.
   * @param {Array<Object>} newData - The new data array.
   */
  updateData(newData) {
    this.data = (newData || []).filter(item => item);
    this.calculateTimeRange();
    this.render();
  }

  /**
   * Calculates the min and max years based on the data.
   */
  calculateTimeRange() {
    this.currentDate = new Date();
    if (!this.data.length) {
      this.minYear = this.currentDate.getFullYear() - 1;
      this.maxYear = this.currentDate.getFullYear() + 3;
      return;
    }

    const allDates = this.data.flatMap(d => [
      new Date(d.ossStart),
      new Date(d.enterpriseEnd || d.ossEnd)
    ]);
    this.minYear = new Date(Math.min(...allDates)).getFullYear();
    this.maxYear = new Date(Math.max(...allDates)).getFullYear();
  }

  /**
   * Renders the entire timeline.
   */
  render() {
    // Clear dynamic content
    this.axis.innerHTML = '';
    this.tracks.innerHTML = '';
    this.legendContainer.innerHTML = '';

    this.renderAxis();

    this.grid = this.el('div', 'grid-lines-container', this.tracks);
    this.indicators = this.el('div', 'indicators-container', this.tracks);
    this.renderGrid();
    this.renderCurrentDateLine();

    this.rows = this.data.map(item => this.createRow(item));
    this.toggleContainer = this.el('div', 'timeline-more-toggle', this.tracks, {
      paddingTop: '10px',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
      zIndex: '10'
    });

    this.updateVisibility();
    this.renderLegend();
    this.setupTooltip();
  }

  /**
   * Sets up the tooltip overlay.
   */
  setupTooltip() {
    if (this.tooltip) this.tooltip.remove();
    this.tooltip = this.el('div', 'timeline-tooltip-overlay', document.body);
    this.tooltip.style.display = 'none';
    this.tooltip.setAttribute('role', 'tooltip');
  }

  /**
   * Shows the tooltip with provided content.
   * @param {MouseEvent} e - The mouse event.
   * @param {string} content - The HTML content for the tooltip.
   */
  showTooltip(e, content) {
    this.tooltip.innerHTML = content;
    this.tooltip.style.display = 'block';
    this.updateTooltipPos(e);
  }

  /**
   * Updates tooltip position relative to mouse.
   * @param {MouseEvent} e - The mouse event.
   */
  updateTooltipPos(e) {
    const padding = 12;
    let x = e.pageX + padding;
    let y = e.pageY + padding;

    const tw = this.tooltip.offsetWidth;
    const th = this.tooltip.offsetHeight;
    if (x + tw > window.innerWidth) x = e.pageX - tw - padding;
    if (y + th > window.innerHeight) y = e.pageY - th - padding;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  /**
   * Hides the tooltip.
   */
  hideTooltip() {
    if (this.tooltip) this.tooltip.style.display = 'none';
  }

  /**
   * Helper to create DOM elements with styles and classes.
   * @param {string} tag - HTML tag.
   * @param {string} className - CSS class name.
   * @param {HTMLElement} [parent] - Parent element.
   * @param {Object} [styles={}] - Inline styles.
   * @returns {HTMLElement} The created element.
   */
  el(tag, className, parent, styles = {}) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    Object.assign(e.style, styles);
    if (parent) parent.appendChild(e);
    return e;
  }

  /**
   * Renders the toolbar with the filter input.
   */
  renderToolbar() {
    const bar = this.el('div', 'timeline-toolbar', this.root);
    const container = this.el('div', 'timeline-filter-container', bar);
    container.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

    const input = this.el('input', 'timeline-filter-input', container);
    input.placeholder = this.t('filter');
    input.value = this.filterText;
    input.setAttribute('aria-label', this.t('filter'));
    input.oninput = (e) => {
      this.filterText = e.target.value.toLowerCase().trim();
      this.updateVisibility();
    };
  }

  /**
   * Renders the theme toggle button.
   */
  renderThemeToggle() {
    const btn = this.el('button', 'theme-toggle-btn', this.root);
    btn.title = this.t('dark');
    btn.setAttribute('aria-label', this.t('dark'));
    const icons = {
      moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
      sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    };
    btn.innerHTML = this.theme === 'dark' ? icons.sun : icons.moon;
    btn.onclick = () => {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      btn.innerHTML = this.theme === 'dark' ? icons.sun : icons.moon;
      btn.setAttribute('aria-pressed', this.theme === 'dark');
    };
  }

  /**
   * Renders the legend section.
   */
  renderLegend() {
    this.legendContainer.innerHTML = `
      <div class="release-legend" role="complementary" aria-label="Support Legend">
        ${['oss', 'ent', 'eol'].map(type => `
          <div class="legend-block ${type === 'ent' ? 'commercial' : type}">
            <div class="legend-icon" aria-hidden="true"></div>
            <div><h3>${this.t(type)}</h3><p>${this.t(type + 'Desc')}</p></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renders the year axis.
   */
  renderAxis() {
    const spacer = this.el('div', '', this.axis, { width: '96px', flexShrink: '0' });
    spacer.setAttribute('role', 'presentation');

    for (let y = this.minYear; y <= this.maxYear; y++) {
      const year = this.el('div', 'timeline-year', this.axis);
      year.textContent = y;
      year.setAttribute('role', 'columnheader');
    }
  }

  /**
   * Renders the vertical grid lines for years.
   */
  renderGrid() {
    const start = new Date(this.minYear, 0, 1).getTime();
    const dur = new Date(this.maxYear, 11, 31).getTime() - start;
    for (let y = this.minYear; y <= this.maxYear; y++) {
      const line = this.el('div', 'year-grid-line', this.grid);
      line.style.left = `${((new Date(y, 0, 1).getTime() - start) / dur) * 100}%`;
      line.setAttribute('role', 'presentation');
    }
  }

  /**
   * Creates a row for a specific version.
   * @param {Object} item - The version data item.
   * @returns {Object} Metadata about the created row.
   */
  createRow(item) {
    const row = this.el('div', 'timeline-row', this.tracks);
    row.setAttribute('role', 'row');

    const label = this.el('div', 'version-label', row);
    label.setAttribute('role', 'rowheader');

    // Status Logic
    const now = Date.now(), s = new Date(item.ossStart).getTime(), e = new Date(item.ossEnd).getTime();
    const ent = item.enterpriseEnd ? new Date(item.enterpriseEnd).getTime() : e;
    const statusClass = now >= s && now <= e ? 'status-oss' : (now > e && now <= ent ? 'status-ent' : (now > ent ? 'status-expired' : ''));
    if (statusClass) label.classList.add(statusClass);

    if (item.releaseNotesUrl) {
      const a = this.el('a', 'version-link', label);
      a.href = item.releaseNotesUrl; a.target = '_blank'; a.textContent = item.version;
      a.title = this.t('notes', { v: item.version });
      a.setAttribute('aria-label', this.t('notes', { v: item.version }));
    } else label.textContent = item.version;

    const track = this.el('div', 'track-container', row);
    track.setAttribute('role', 'gridcell');

    track.appendChild(this.createBar(item, item.ossStart, item.enterpriseEnd || item.ossEnd, 'bar-ent', this.t('ent')));
    track.appendChild(this.createBar(item, item.ossStart, item.ossEnd, 'bar-oss', this.t('oss')));

    return { el: row, version: item.version.toLowerCase() };
  }

  /**
   * Creates a colored bar segment for the timeline.
   * @param {Object} item - The version item.
   * @param {string} startStr - Start date string.
   * @param {string} endStr - End date string.
   * @param {string} className - CSS class.
   * @param {string} prefix - Support type prefix for tooltip.
   * @returns {HTMLElement} The created bar element.
   */
  createBar(item, startStr, endStr, className, prefix) {
    const s = new Date(startStr).getTime(), e = new Date(endStr).getTime();
    const timelineStart = new Date(this.minYear, 0, 1).getTime();
    const timelineDur = new Date(this.maxYear, 11, 31).getTime() - timelineStart;

    const bar = this.el('div', `bar-segment ${className}`);
    bar.style.left = `${((s - timelineStart) / timelineDur) * 100}%`;
    bar.style.width = `${((e - s) / timelineDur) * 100}%`;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${item.version} ${prefix}: ${startStr} to ${endStr}`);
    bar.tabIndex = 0; // Make focusable

    const tooltipContent = `
      <div class="tooltip-header">${prefix} - ${item.version}</div>
      <div class="tooltip-date"><strong>Du:</strong> ${startStr}</div>
      <div class="tooltip-date"><strong>Au:</strong> ${endStr}</div>
    `;

    bar.onmouseenter = (ev) => this.showTooltip(ev, tooltipContent);
    bar.onmousemove = (ev) => this.updateTooltipPos(ev);
    bar.onmouseleave = () => this.hideTooltip();

    // Accessibility for keyboard users
    bar.onfocus = (ev) => {
      const rect = bar.getBoundingClientRect();
      this.showTooltip({ pageX: rect.left + window.scrollX, pageY: rect.top + window.scrollY - 40 }, tooltipContent);
    };
    bar.onblur = () => this.hideTooltip();

    return bar;
  }

  /**
   * Updates visibility of rows based on filtering and expansion state.
   */
  updateVisibility() {
    const filtered = this.rows.filter(r => r.version.includes(this.filterText));
    this.rows.forEach(r => r.el.style.display = 'none');

    const hasMore = this.filterText === '' && filtered.length > this.visibleCount;
    const toShow = (hasMore && !this.isExpanded) ? filtered.slice(0, this.visibleCount) : filtered;
    toShow.forEach(r => r.el.style.display = 'flex');

    this.toggleContainer.innerHTML = '';
    if (hasMore) {
      const btn = this.el('button', 'timeline-toggle-btn', this.toggleContainer);
      const icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="${this.isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"></polyline></svg>`;
      btn.innerHTML = this.isExpanded ? `${this.t('less')} ${icon}` : `${this.t('more', { n: filtered.length - this.visibleCount })} ${icon}`;
      btn.setAttribute('aria-expanded', this.isExpanded);
      btn.onclick = () => {
        this.isExpanded = !this.isExpanded;
        this.updateVisibility();
        // Keep focus on button if it's still there after render (it will be because we call updateVisibility)
      };
    }
  }

  /**
   * Renders the vertical line indicating current date.
   */
  renderCurrentDateLine() {
    const start = new Date(this.minYear, 0, 1).getTime();
    const dur = new Date(this.maxYear, 11, 31).getTime() - start;
    const offset = Date.now() - start;
    if (offset < 0 || offset > dur) return;

    const currentStr = new Date().toISOString().split('T')[0];
    const line = this.el('div', 'current-date-indicator', this.indicators);
    line.style.left = `${(offset / dur) * 100}%`;
    line.setAttribute('role', 'separator');
    line.setAttribute('aria-label', this.t('today', { date: currentStr }));

    const badge = this.el('div', 'current-date-badge', line);
    badge.textContent = currentStr;
    badge.setAttribute('aria-hidden', 'true');
  }
}
