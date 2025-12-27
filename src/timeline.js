export default class Timeline {
  constructor(elementId, data, options = {}) {
    this.root = document.getElementById(elementId);
    if (!this.root) return;

    this.data = (data || []).filter(item => item);
    this.visibleCount = options.visibleCount || 3;
    this.isExpanded = false;
    this.theme = 'light';
    this.filterText = '';

    // Calculate time range
    this.currentDate = new Date();
    const allDates = this.data.flatMap(d => [new Date(d.ossStart), new Date(d.enterpriseEnd)]);
    this.minYear = this.data.length ? new Date(Math.min(...allDates)).getFullYear() : this.currentDate.getFullYear() - 1;
    this.maxYear = this.data.length ? new Date(Math.max(...allDates)).getFullYear() : this.currentDate.getFullYear() + 3;

    // i18n
    this.translations = {
      en: {
        filter: "Filter versions...", oss: "OSS Support", ent: "Enterprise Support",
        eol: "Out of Support", less: "Show Less", more: "Show {n} more versions",
        notes: "View Release Notes for {v}", dark: "Toggle Dark Mode",
        ossDesc: "Free security updates and bugfixes.",
        entDesc: "Expert support during OSS plus extended support after EOL.",
        eolDesc: "End of life. No further updates are provided."
      },
      fr: {
        filter: "Filtrer les versions...", oss: "Support OSS", ent: "Support Entreprise",
        eol: "Fin de support", less: "Voir moins", more: "Voir {n} versions supplémentaires",
        notes: "Voir les notes de version pour {v}", dark: "Changer le mode sombre",
        ossDesc: "Mises à jour de sécurité et corrections de bugs gratuites.",
        entDesc: "Support pendant la période OSS plus support étendu après.",
        eolDesc: "Version en fin de vie. Plus de mises à jour."
      }
    };
    this.locale = options.locale || this.detectLanguage();

    this.init();
  }

  detectLanguage() {
    const lang = (navigator.language || 'en').split('-')[0];
    return this.translations[lang] ? lang : 'en';
  }

  t(key, params = {}) {
    let t = (this.translations[this.locale] || this.translations.en)[key] || key;
    Object.keys(params).forEach(p => t = t.replace(`{${p}}`, params[p]));
    return t;
  }

  init() {
    this.renderToolbar();

    this.wrapper = this.el('div', 'timeline-wrapper', this.root);

    // Axis
    this.axis = this.el('div', 'timeline-axis', this.wrapper);
    this.renderAxis();

    // Tracks
    this.tracks = this.el('div', 'timeline-tracks', this.wrapper);
    this.grid = this.el('div', 'grid-lines-container', this.tracks);
    this.renderGrid();
    this.renderCurrentDateLine();

    this.rows = this.data.map(item => this.createRow(item));
    this.toggleContainer = this.el('div', '', this.tracks, { paddingTop: '10px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: '10' });

    this.updateVisibility();
    this.renderLegend();

    // Tooltip
    this.tooltip = document.querySelector('.custom-tooltip') || this.el('div', 'custom-tooltip', document.body);

    this.renderThemeToggle();
  }

  el(tag, className, parent, styles = {}) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    Object.assign(e.style, styles);
    if (parent) parent.appendChild(e);
    return e;
  }

  renderToolbar() {
    const bar = this.el('div', 'timeline-toolbar', this.root);
    const container = this.el('div', 'timeline-filter-container', bar);
    container.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

    const input = this.el('input', 'timeline-filter-input', container);
    input.placeholder = this.t('filter');
    input.oninput = (e) => {
      this.filterText = e.target.value.toLowerCase().trim();
      this.updateVisibility();
    };
  }

  renderThemeToggle() {
    const btn = this.el('button', 'theme-toggle-btn', this.root);
    btn.title = this.t('dark');
    const icons = {
      moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
      sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    };
    btn.innerHTML = icons.moon;
    btn.onclick = () => {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      btn.innerHTML = this.theme === 'dark' ? icons.sun : icons.moon;
    };
  }

  renderLegend() {
    this.wrapper.insertAdjacentHTML('beforeend', `
      <div class="release-legend">
        ${['oss', 'ent', 'eol'].map(type => `
          <div class="legend-block ${type === 'ent' ? 'commercial' : type}">
            <div class="legend-icon"></div>
            <div><h3>${this.t(type)}</h3><p>${this.t(type + 'Desc')}</p></div>
          </div>
        `).join('')}
      </div>
    `);
  }

  renderAxis() {
    this.el('div', '', this.axis, { width: '96px', flexShrink: '0' });
    for (let y = this.minYear; y <= this.maxYear; y++) {
      this.el('div', 'timeline-year', this.axis).textContent = y;
    }
  }

  renderGrid() {
    const start = new Date(this.minYear, 0, 1).getTime();
    const dur = new Date(this.maxYear, 11, 31).getTime() - start;
    for (let y = this.minYear; y <= this.maxYear; y++) {
      const line = this.el('div', 'year-grid-line', this.grid);
      line.style.left = `${((new Date(y, 0, 1).getTime() - start) / dur) * 100}%`;
    }
  }

  createRow(item) {
    const row = this.el('div', 'timeline-row', this.tracks);
    const label = this.el('div', 'version-label', row);

    // Status Logic
    const now = Date.now(), s = new Date(item.ossStart).getTime(), e = new Date(item.ossEnd).getTime(), ent = new Date(item.enterpriseEnd).getTime();
    const statusClass = now >= s && now <= e ? 'status-oss' : (now > e && now <= ent ? 'status-ent' : (now > ent ? 'status-expired' : ''));
    if (statusClass) label.classList.add(statusClass);

    if (item.releaseNotesUrl) {
      const a = this.el('a', 'version-link', label);
      a.href = item.releaseNotesUrl; a.target = '_blank'; a.textContent = item.version;
      a.title = this.t('notes', { v: item.version });
    } else label.textContent = item.version;

    const track = this.el('div', 'track-container', row);
    track.appendChild(this.createBar(item.ossStart, item.enterpriseEnd, 'bar-ent', this.t('ent')));
    track.appendChild(this.createBar(item.ossStart, item.ossEnd, 'bar-oss', this.t('oss')));

    return { el: row, version: item.version.toLowerCase() };
  }

  createBar(startStr, endStr, className, prefix) {
    const s = new Date(startStr).getTime(), e = new Date(endStr).getTime();
    const timelineStart = new Date(this.minYear, 0, 1).getTime();
    const timelineDur = new Date(this.maxYear, 11, 31).getTime() - timelineStart;

    const bar = this.el('div', `bar-segment ${className}`);
    bar.style.left = `${((s - timelineStart) / timelineDur) * 100}%`;
    bar.style.width = `${((e - s) / timelineDur) * 100}%`;

    bar.onmouseenter = (ev) => {
      this.tooltip.textContent = `${prefix}: ${startStr} to ${endStr}`;
      this.tooltip.style.opacity = '1';
      this.moveTooltip(ev);
    };
    bar.onmousemove = (ev) => this.moveTooltip(ev);
    bar.onmouseleave = () => this.tooltip.style.opacity = '0';
    return bar;
  }

  moveTooltip(e) {
    this.tooltip.style.left = `${e.clientX + 12}px`;
    this.tooltip.style.top = `${e.clientY + 12}px`;
  }

  updateVisibility() {
    const filtered = this.rows.filter(r => r.version.includes(this.filterText));
    this.rows.forEach(r => r.el.style.display = 'none');

    const hasMore = this.filterText === '' && filtered.length > this.visibleCount;
    const toShow = (hasMore && !this.isExpanded) ? filtered.slice(0, this.visibleCount) : filtered;
    toShow.forEach(r => r.el.style.display = 'flex');

    this.toggleContainer.innerHTML = '';
    if (hasMore) {
      const btn = this.el('button', 'timeline-toggle-btn', this.toggleContainer);
      const icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="${this.isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"></polyline></svg>`;
      btn.innerHTML = this.isExpanded ? `${this.t('less')} ${icon}` : `${this.t('more', { n: filtered.length - this.visibleCount })} ${icon}`;
      btn.onclick = () => { this.isExpanded = !this.isExpanded; this.updateVisibility(); };
    }
  }

  renderCurrentDateLine() {
    const start = new Date(this.minYear, 0, 1).getTime();
    const dur = new Date(this.maxYear, 11, 31).getTime() - start;
    const offset = Date.now() - start;
    if (offset < 0 || offset > dur) return;

    const line = this.el('div', 'current-date-indicator', this.grid);
    line.style.left = `${(offset / dur) * 100}%`;
    this.el('div', 'current-date-badge', line).textContent = new Date().toISOString().split('T')[0];
  }
}
