import { TimelineVersion, TimelineOptions } from './types';

/**
 * Default translations for the timeline component.
 */
const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
        filter: "Filter versions...", oss: "OSS Support", ent: "Enterprise Support",
        eol: "Out of Support", less: "Show Less", more: "Show {n} more versions",
        notes: "View Release Notes for {v}", dark: "Toggle Dark Mode",
        ossDesc: "Free security updates and bugfixes.",
        entDesc: "Expert support during OSS plus extended support after EOL.",
        eolDesc: "End of life. No further updates are provided.",
        today: "Today's date: {date}",
        branch: "Branch", initial: "Initial Release", ossEnd: "End OSS", entEnd: "End Enterprise *",
        majorOnly: "Major versions only",
        future: "Future Version", futureDesc: "Planned version not yet released.",
        fictive: "Fictive Version", fictiveDesc: "Disabled or representative version."
    },
    fr: {
        filter: "Filtrer les versions...", oss: "Support OSS", ent: "Support Entreprise",
        eol: "Fin de support", less: "Voir moins", more: "Voir {n} versions supplémentaires",
        notes: "Voir les notes de version pour {v}", dark: "Changer le mode sombre",
        ossDesc: "Mises à jour de sécurité et corrections de bugs gratuites.",
        entDesc: "Support pendant la période OSS plus support étendu après.",
        eolDesc: "Version en fin de vie. Plus de mises à jour.",
        today: "Date du jour : {date}",
        branch: "Version", initial: "Sortie initiale", ossEnd: "Fin OSS", entEnd: "Fin Entreprise *",
        majorOnly: "Versions majeures uniquement",
        future: "Version future", futureDesc: "Version prévue non encore sortie.",
        fictive: "Version fictive", fictiveDesc: "Version désactivée ou indicative."
    }
};

/**
 * Represents a Lifecycle Timeline component.
 */
export default class Timeline {
    root: HTMLElement | null;
    options: TimelineOptions;
    visibleCount: number;
    showTable: boolean;
    showThemeToggle: boolean;
    showLegend: boolean;
    filterVersions: boolean;
    splitSupport: boolean;
    compactMode: boolean;
    showMajorFilter: boolean;
    isExpanded: boolean;
    theme: 'light' | 'dark';
    filterText: string;
    majorFilterEnabled: boolean;
    activeHighlight: string | null;
    translations: Record<string, Record<string, string>>;
    locale: string;
    data: TimelineVersion[] = [];
    minYear: number = 0;
    maxYear: number = 0;
    currentDate: Date = new Date();

    tableContainer!: HTMLElement;
    wrapper!: HTMLElement;
    axis!: HTMLElement;
    tracks!: HTMLElement;
    legendContainer!: HTMLElement;
    tableBody!: HTMLElement;
    tableRows: { el: HTMLElement; version: string; versionOriginal: string }[] = [];
    tableToggleContainer!: HTMLElement;
    grid!: HTMLElement;
    indicators!: HTMLElement;
    rows: { el: HTMLElement; version: string; versionOriginal: string; isMajor?: boolean }[] = [];
    toggleContainer!: HTMLElement;
    tooltip!: HTMLElement;

    /**
     * Creates an instance of Timeline.
     * @param elementId - The ID of the root element.
     * @param data - The data array containing version details.
     * @param options - Configuration options.
     */
    constructor(elementId: string, data: TimelineVersion[], options: TimelineOptions = {}) {
        this.root = document.getElementById(elementId);
        if (!this.root) {
            this.options = options;
            this.visibleCount = 3;
            this.showTable = true;
            this.showThemeToggle = true;
            this.showLegend = true;
            this.filterVersions = true;
            this.splitSupport = false;
            this.compactMode = false;
            this.showMajorFilter = false;
            this.isExpanded = false;
            this.theme = 'light';
            this.filterText = '';
            this.majorFilterEnabled = false;
            this.activeHighlight = null;
            this.translations = {};
            this.locale = 'en';
            return;
        }

        this.options = options;
        this.visibleCount = options.visibleCount || 3;
        this.showTable = options.showTable !== false;
        this.showThemeToggle = (options as any).showThemeToggle !== false;
        this.showLegend = options.showLegend !== false;
        this.filterVersions = options.filterVersions !== false;
        this.splitSupport = options.splitSupport === true;
        this.compactMode = options.compactMode === true;
        this.showMajorFilter = options.showMajorFilter === true;
        this.isExpanded = false;
        this.theme = 'light';
        this.filterText = '';
        this.majorFilterEnabled = options.majorFilterDefault === true;
        this.activeHighlight = null;

        // Apply root scoping class and initial theme
        this.root.classList.add('lt-root');
        this.root.classList.toggle('lt-mode-split', this.splitSupport);
        this.root.classList.toggle('lt-mode-overlay', !this.splitSupport);
        this.root.classList.toggle('lt-mode-compact', this.compactMode);
        this.root.setAttribute('data-theme', this.theme);

        // Merge default translations with custom ones (deep merge per language)
        this.translations = { ...DEFAULT_TRANSLATIONS };
        if (options.i18n) {
            Object.keys(options.i18n).forEach(lang => {
                this.translations[lang] = {
                    ...(this.translations[lang] || this.translations.en || {}),
                    ...(options.i18n![lang] || {})
                };
            });
        }
        this.locale = options.locale || this.detectLanguage();

        this.setupBaseLayout();
        this.updateData(data);
    }

    /**
     * Detects the browser language.
     * @returns The detected language code or 'en'.
     */
    detectLanguage(): string {
        const lang = (navigator.language || 'en').split('-')[0];
        return this.translations[lang] ? lang : 'en';
    }

    /**
     * Translates a key based on the current locale.
     * @param key - The translation key.
     * @param params - Parameters to replace in the translation string.
     * @returns The translated string.
     */
    t(key: string, params: Record<string, any> = {}): string {
        let t = (this.translations[this.locale] || this.translations.en)[key] || key;
        Object.keys(params).forEach(p => t = t.replace(`{${p}}`, params[p]));
        return t;
    }

    /**
     * Sets up the initial layout of the timeline.
     */
    setupBaseLayout(): void {
        if (!this.root) return;
        this.root.innerHTML = '';
        this.root.setAttribute('role', 'application');
        this.root.setAttribute('aria-label', 'Product Lifecycle Timeline');

        this.renderToolbar();
        if (this.showThemeToggle) {
            this.renderThemeToggle();
        }

        if (this.showTable) {
            this.tableContainer = this.el('div', 'lt-table-container', this.root);
        }

        this.wrapper = this.el('div', 'lt-wrapper', this.root);
        // Added ARIA grid for structured data
        this.wrapper.setAttribute('role', 'grid');
        this.wrapper.setAttribute('aria-readonly', 'true');

        this.axis = this.el('div', 'lt-axis', this.wrapper);
        this.axis.setAttribute('role', 'row');

        this.tracks = this.el('div', 'lt-tracks', this.wrapper);

        if (this.showLegend) {
            this.legendContainer = this.el('div', 'lt-legend-container', this.wrapper);
        }
    }

    /**
     * Updates the timeline data and re-renders.
     * @param newData - The new data array.
     */
    updateData(newData: TimelineVersion[]): void {
        this.data = this.validateData(newData || []);
        this.calculateTimeRange();
        this.render();
    }

    validateData(data: TimelineVersion[]): TimelineVersion[] {
        return data.filter((item) => {
            if (!item.ossStart || !item.ossEnd) {
                // Allow date-less versions (treated as fictive)
                item.isFictive = true;
                return true;
            }

            const dates = (['ossStart', 'ossEnd', 'enterpriseEnd'] as (keyof TimelineVersion)[]).filter(k => item[k]);
            const invalidDates = dates.filter(k => isNaN(new Date(item[k] as string).getTime()));

            if (invalidDates.length > 0) {
                console.warn(`[Timeline] Invalid date format for item "${item.version}": ${invalidDates.join(', ')}`);
                return false;
            }

            return true;
        });
    }

    /**
     * Calculates the min and max years based on the data.
     */
    calculateTimeRange(): void {
        this.currentDate = new Date();
        if (!this.data.length) {
            this.minYear = this.currentDate.getFullYear() - 1;
            this.maxYear = this.currentDate.getFullYear() + 3;
            return;
        }

        const allDates = this.data
            .filter(d => d.ossStart && d.ossEnd)
            .flatMap(d => [
                new Date(d.ossStart!).getTime(),
                new Date(d.enterpriseEnd || d.ossEnd!).getTime()
            ]);

        if (allDates.length === 0) {
            this.minYear = this.currentDate.getFullYear() - 1;
            this.maxYear = this.currentDate.getFullYear() + 3;
            return;
        }
        this.minYear = new Date(Math.min(...allDates)).getFullYear();
        this.maxYear = new Date(Math.max(...allDates)).getFullYear();
    }

    /**
     * Renders the data table.
     */
    renderTable(): void {
        const table = this.el('table', 'lt-table', this.tableContainer);
        table.setAttribute('aria-label', 'Project support');

        const thead = this.el('thead', '', table);
        const headerRow = this.el('tr', '', thead);
        [this.t('branch'), this.t('initial'), this.t('ossEnd'), this.t('entEnd')].forEach(text => {
            this.el('th', '', headerRow).textContent = text;
        });

        this.tableBody = this.el('tbody', '', table);
        this.tableRows = this.data.map(item => this.createTableRow(item));

        this.tableToggleContainer = this.el('div', 'lt-table-toggle', this.tableContainer);
        this.updateTableVisibility();
    }

    /**
     * Creates a row for the data table.
     * @param item - Version data.
     */
    createTableRow(item: TimelineVersion): { el: HTMLElement; version: string; versionOriginal: string } {
        const row = this.el('tr', '', this.tableBody);

        const now = Date.now();
        const s = item.ossStart ? new Date(item.ossStart).getTime() : 0, e = item.ossEnd ? new Date(item.ossEnd).getTime() : 0;
        const ent = item.enterpriseEnd ? new Date(item.enterpriseEnd).getTime() : e;

        const isFictive = item.isFictive || !item.ossStart || !item.ossEnd;
        const statusClass = isFictive ? 'lt-status-fictive' : (item.isFuture ? 'lt-status-is-future' : (now >= s && now <= e ? 'lt-status-oss' : (now > e && now <= ent ? 'lt-status-ent' : (now > ent ? 'lt-status-expired' : ''))));

        const branchCell = this.el('td', '', row);
        let badgeContent = `<span class="lt-table-badge ${statusClass}">${item.version}</span>`;

        if (item.releaseNotesUrl) {
            branchCell.innerHTML = `<a href="${item.releaseNotesUrl}" target="_blank" class="lt-table-version-link">${badgeContent}</a>`;
        } else {
            branchCell.innerHTML = badgeContent;
        }

        const initialCell = this.el('td', '', row);
        initialCell.textContent = item.ossStart || '-';
        if (item.ossStart && now > s) initialCell.className = 'lt-past-date';

        const ossEndCell = this.el('td', '', row);
        ossEndCell.textContent = item.ossEnd || '-';
        if (item.ossEnd && now > e) ossEndCell.className = 'lt-past-date';

        const entEndCell = this.el('td', '', row);
        entEndCell.textContent = item.enterpriseEnd || item.ossEnd || '-';
        if ((item.enterpriseEnd || item.ossEnd) && now > ent) entEndCell.className = 'lt-past-date';

        return { el: row, version: item.version.toLowerCase(), versionOriginal: item.version };
    }

    /**
     * Updates table visibility based on filter and visibleCount.
     */
    updateTableVisibility(): void {
        const filtered = this.tableRows.filter(r => r.version.includes(this.filterText));

        // Update highlights in table badges
        this.tableRows.forEach(r => {
            const badge = r.el.querySelector('.lt-table-badge');
            if (badge) badge.innerHTML = this.highlight(r.versionOriginal || r.version);
            r.el.classList.remove('lt-row-visible');
            r.el.classList.add('lt-row-hidden');
        });

        const hasMore = this.filterText === '' && filtered.length > this.visibleCount;
        const toShow = (hasMore && !this.isExpanded) ? filtered.slice(0, this.visibleCount) : filtered;
        toShow.forEach(r => {
            r.el.classList.remove('lt-row-hidden');
            r.el.classList.add('lt-row-visible');
        });

        this.tableToggleContainer.innerHTML = '';
        if (hasMore) {
            const btn = this.el('button', 'lt-toggle-btn lt-table-toggle', this.tableToggleContainer);
            const icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="${this.isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"></polyline></svg>`;
            btn.innerHTML = this.isExpanded ? `${this.t('less')} ${icon}` : `${this.t('more', { n: filtered.length - this.visibleCount })} ${icon}`;
            btn.onclick = () => { this.isExpanded = !this.isExpanded; this.updateVisibility(); };
        }
    }

    /**
     * Renders the entire timeline.
     */
    render(): void {
        // Clear dynamic content
        if (this.showTable) this.tableContainer.innerHTML = '';
        this.axis.innerHTML = '';
        this.tracks.innerHTML = '';
        if (this.showLegend) this.legendContainer.innerHTML = '';

        if (this.showTable) this.renderTable();
        this.renderAxis();

        this.grid = this.el('div', 'lt-grid-lines-container', this.tracks);
        this.indicators = this.el('div', 'lt-indicators-container', this.tracks);
        this.renderGrid();
        this.renderCurrentDateLine();

        this.rows = this.data.map((item, index) => this.createRow(item, index));
        this.toggleContainer = this.el('div', 'lt-more-toggle', this.tracks, {
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            zIndex: '10'
        });

        this.updateVisibility();
        if (this.showLegend) this.renderLegend();
        this.setupTooltip();
    }

    /**
     * Sets up the tooltip overlay.
     */
    setupTooltip(): void {
        if (this.tooltip) this.tooltip.remove();
        this.tooltip = this.el('div', 'lt-tooltip', this.root as HTMLElement);
        this.tooltip.style.display = 'none';
        this.tooltip.setAttribute('role', 'tooltip');
    }

    /**
     * Shows the tooltip with provided content.
     * @param e - The mouse event or position object.
     * @param content - The HTML content for the tooltip.
     */
    showTooltip(e: MouseEvent | { pageX: number; pageY: number }, content: string): void {
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        this.updateTooltipPos(e);
    }

    /**
     * Updates tooltip position relative to mouse.
     * @param e - The mouse event or position object.
     */
    updateTooltipPos(e: MouseEvent | { pageX: number; pageY: number; clientX?: number; clientY?: number }): void {
        if (!this.root) return;
        const rect = this.root.getBoundingClientRect();
        const padding = 12;

        const clientX = 'clientX' in e ? e.clientX : (e as any).pageX - window.scrollX;
        const clientY = 'clientY' in e ? e.clientY : (e as any).pageY - window.scrollY;

        // Calculate position relative to this.root
        let x = (clientX || 0) - rect.left + padding;
        let y = (clientY || 0) - rect.top + padding;

        const tw = this.tooltip.offsetWidth;
        const th = this.tooltip.offsetHeight;

        // Boundary checks relative to root width/height
        if (x + tw > this.root.offsetWidth) x = (clientX || 0) - rect.left - tw - padding;
        if (y + th > this.root.offsetHeight) y = (clientY || 0) - rect.top - th - padding;

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    /**
     * Hides the tooltip.
     */
    hideTooltip(): void {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }

    /**
     * Highlights the search term in a given text.
     * @param text - The text to process.
     * @returns The HTML with highlighted segments.
     */
    highlight(text: string): string {
        if (!this.filterText) return text;
        try {
            const regex = new RegExp(`(${this.filterText})`, 'gi');
            return text.replace(regex, '<mark class="lt-highlight-match">$1</mark>');
        } catch (e) {
            return text;
        }
    }

    /**
     * Helper to create DOM elements with styles and classes.
     * @param tag - HTML tag.
     * @param className - CSS class name.
     * @param parent - Parent element.
     * @param styles - Inline styles.
     * @returns The created element.
     */
    el(tag: string, className: string, parent?: HTMLElement, styles: Record<string, string> = {}): HTMLElement {
        const e = document.createElement(tag);
        if (className) e.className = className;
        Object.assign(e.style, styles);
        if (parent) parent.appendChild(e);
        return e;
    }

    /**
     * Renders the toolbar with the filter input.
     */
    renderToolbar(): void {
        if (!this.root) return;
        const bar = this.el('div', 'lt-toolbar', this.root);

        if (this.filterVersions) {
            const container = this.el('div', 'lt-filter-container', bar);
            container.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

            const input = this.el('input', 'lt-filter-input', container) as HTMLInputElement;
            input.placeholder = this.t('filter');
            input.value = this.filterText;
            input.setAttribute('aria-label', this.t('filter'));
            input.oninput = (e) => {
                this.filterText = (e.target as HTMLInputElement).value.toLowerCase().trim();
                this.updateVisibility();
            };
        }

        if (this.showMajorFilter) {
            const label = this.el('label', 'lt-checkbox-label', bar);
            const checkbox = this.el('input', '', label) as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.checked = this.majorFilterEnabled;
            checkbox.onchange = (e) => {
                this.majorFilterEnabled = (e.target as HTMLInputElement).checked;
                this.updateVisibility();
            };
            const span = this.el('span', '', label);
            span.textContent = this.t('majorOnly');
        }
    }

    /**
     * Renders the theme toggle button.
     */
    renderThemeToggle(): void {
        if (!this.root) return;
        const btn = this.el('button', 'lt-theme-toggle-btn', this.root);
        btn.title = this.t('dark');
        btn.setAttribute('aria-label', this.t('dark'));
        const icons = {
            moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
            sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        };
        btn.innerHTML = this.theme === 'dark' ? icons.sun : icons.moon;
        btn.onclick = () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.root!.setAttribute('data-theme', this.theme);
            btn.innerHTML = this.theme === 'dark' ? icons.sun : icons.moon;
            btn.setAttribute('aria-pressed', (this.theme === 'dark').toString());
        };
    }

    /**
     * Renders the legend section.
     */
    renderLegend(): void {
        this.legendContainer.innerHTML = '';
        const container = this.el('div', 'lt-legend', this.legendContainer);
        container.setAttribute('role', 'complementary');
        container.setAttribute('aria-label', 'Support Legend');

        const legendItems = ['oss', 'ent', 'eol', 'future', 'fictive'];

        legendItems.forEach(type => {
            const item = this.el('div', `lt-legend-block ${type === 'ent' ? 'commercial' : type}`, container);
            item.classList.add('lt-legend-item-reactive');
            if (this.activeHighlight === type) item.classList.add('lt-active-highlight');

            item.innerHTML = `
        <div class="lt-legend-icon" aria-hidden="true"></div>
        <div><h3>${this.t(type)}</h3><p>${this.t(type + 'Desc')}</p></div>
      `;

            item.onclick = () => this.highlightSegment(type);
        });
    }

    /**
     * Toggles highlighting for a specific segment type.
     * @param type - 'oss', 'ent', or 'eol'.
     */
    highlightSegment(type: string): void {
        if (!this.root) return;
        this.activeHighlight = this.activeHighlight === type ? null : type;

        // Reset classes on the root element
        this.root.classList.remove('lt-highlight-oss', 'lt-highlight-ent', 'lt-highlight-eol', 'lt-highlight-future', 'lt-highlight-fictive');

        if (this.activeHighlight) {
            this.root.classList.add(`lt-highlight-${this.activeHighlight}`);
        }

        this.renderLegend();
    }

    /**
     * Renders the year axis.
     */
    renderAxis(): void {
        const spacer = this.el('div', '', this.axis, { width: '106px', flexShrink: '0' });
        spacer.setAttribute('role', 'presentation');

        for (let y = this.minYear; y <= this.maxYear; y++) {
            const year = this.el('div', 'lt-year', this.axis);
            year.textContent = y.toString();
            year.setAttribute('role', 'columnheader');
        }
    }

    /**
     * Renders the vertical grid lines for years.
     */
    renderGrid(): void {
        const start = new Date(this.minYear, 0, 1).getTime();
        const dur = new Date(this.maxYear, 11, 31).getTime() - start;
        for (let y = this.minYear; y <= this.maxYear; y++) {
            const line = this.el('div', 'lt-year-grid-line', this.grid);
            line.style.left = `${((new Date(y, 0, 1).getTime() - start) / dur) * 100}%`;
            line.setAttribute('role', 'presentation');
        }
    }

    /**
     * Creates a row for a specific version.
     * @param item - The version data item.
     * @returns Metadata about the created row.
     */
    createRow(item: TimelineVersion, index: number): { el: HTMLElement; version: string; versionOriginal: string; isMajor?: boolean } {
        const row = this.el('div', 'lt-row row-entrance', this.tracks);
        row.setAttribute('role', 'row');
        // Staggered animation delay
        row.style.transitionDelay = `${index * 0.05}s`;

        const label = this.el('div', 'lt-version-label', row);
        label.setAttribute('role', 'rowheader');

        const now = Date.now();
        const s = item.ossStart ? new Date(item.ossStart).getTime() : 0, e = item.ossEnd ? new Date(item.ossEnd).getTime() : 0;
        const ent = item.enterpriseEnd ? new Date(item.enterpriseEnd).getTime() : e;
        const isFictive = item.isFictive || !item.ossStart || !item.ossEnd;
        const statusClass = isFictive ? 'lt-status-fictive' : (item.isFuture ? 'lt-status-is-future' : (now < s ? 'lt-status-future' : (now >= s && now <= e ? 'lt-status-oss' : (now > e && now <= ent ? 'lt-status-ent' : (now > ent ? 'lt-status-expired' : '')))));
        if (statusClass) label.classList.add(statusClass);

        if (item.isMajor) {
            label.classList.add('lt-version-major');
        }

        if (item.releaseNotesUrl) {
            const a = this.el('a', 'lt-version-link', label) as HTMLAnchorElement;
            a.href = item.releaseNotesUrl; a.target = '_blank';
            a.innerHTML = this.highlight(item.version);
            a.title = this.t('notes', { v: item.version });
            a.setAttribute('aria-label', this.t('notes', { v: item.version }));
        } else {
            label.innerHTML = this.highlight(item.version);
            label.title = item.version;
        }

        const track = this.el('div', 'lt-track-container', row);
        track.setAttribute('role', 'gridcell');

        const isFictiveDateLess = !item.ossStart || !item.ossEnd;

        if (isFictiveDateLess) {
            // Skip bars for versions without dates
            return { el: row, version: item.version.toLowerCase(), versionOriginal: item.version, isMajor: item.isMajor };
        }

        const entStart = (this.splitSupport ? item.ossEnd : item.ossStart) as string;

        // EOL Segment (Red)
        const endSupport = (item.enterpriseEnd || item.ossEnd) as string;
        const eolEnd = new Date(this.maxYear, 11, 31).toISOString().split('T')[0];

        const eolBar = this.createBar(item, endSupport, eolEnd, 'lt-bar-eol', this.t('eol'));
        const entBar = this.createBar(item, entStart, (item.enterpriseEnd || item.ossEnd) as string, 'lt-bar-ent', this.t('ent'));
        const ossBar = this.createBar(item, item.ossStart!, item.ossEnd!, 'lt-bar-oss', this.t('oss'));

        if (item.isFictive) {
            eolBar.classList.add('lt-is-fictive-bar');
            entBar.classList.add('lt-is-fictive-bar');
            ossBar.classList.add('lt-is-fictive-bar');
        } else if (item.isFuture) {
            ossBar.classList.add('lt-is-future-oss');
        }

        track.appendChild(eolBar);
        track.appendChild(entBar);
        track.appendChild(ossBar);

        return { el: row, version: item.version.toLowerCase(), versionOriginal: item.version, isMajor: item.isMajor };
    }

    /**
     * Creates a colored bar segment for the timeline.
     * @param item - The version item.
     * @param startStr - Start date string.
     * @param endStr - End date string.
     * @param className - CSS class.
     * @param label - Support type label for tooltip.
     * @returns The created bar element.
     */
    createBar(item: TimelineVersion, startStr: string, endStr: string, className: string, label: string): HTMLElement {
        const s = new Date(startStr).getTime(), e = new Date(endStr).getTime();
        const timelineStart = new Date(this.minYear, 0, 1).getTime();
        const timelineDur = new Date(this.maxYear, 11, 31).getTime() - timelineStart;

        const bar = this.el('div', `lt-bar-segment ${className}`);
        // Add specific type for highlighting
        const type = className === 'lt-bar-oss' ? 'lt-segment-oss' : (className === 'lt-bar-ent' ? 'lt-segment-ent' : 'lt-segment-eol');
        bar.classList.add(type);
        bar.style.left = `${((s - timelineStart) / timelineDur) * 100}%`;
        bar.style.width = `${((e - s) / timelineDur) * 100}%`;
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', `${label}: ${item.version} (${startStr} to ${endStr})`);
        bar.tabIndex = 0; // Make focusable

        const tooltipContent = `
      <div class="lt-tooltip-header">${label} - ${item.version}</div>
      <div class="lt-tooltip-date"><strong>Du:</strong> ${startStr}</div>
      <div class="lt-tooltip-date"><strong>Au:</strong> ${endStr}</div>
    `;

        bar.onmouseenter = (ev) => this.showTooltip(ev, tooltipContent);
        bar.onmousemove = (ev) => this.updateTooltipPos(ev);
        bar.onmouseleave = () => this.hideTooltip();

        // Accessibility for keyboard users
        bar.onfocus = () => {
            const rect = bar.getBoundingClientRect();
            this.showTooltip({ pageX: rect.left + window.scrollX, pageY: rect.top + window.scrollY - 40 }, tooltipContent);
        };
        bar.onblur = () => this.hideTooltip();

        return bar;
    }

    /**
     * Updates visibility of rows based on filtering and expansion state.
     */
    updateVisibility(): void {
        const filtered = this.rows.filter(r => {
            const matchesText = r.version.includes(this.filterText);
            const matchesMajor = this.majorFilterEnabled ? r.isMajor : true;
            return matchesText && matchesMajor;
        });

        // Update highlights in labels while filtering
        this.rows.forEach(r => {
            const label = r.el.querySelector('.lt-version-label') as HTMLElement;
            const link = label.querySelector('.lt-version-link') as HTMLElement;
            if (link) {
                link.innerHTML = this.highlight(r.versionOriginal || r.version);
            } else {
                label.innerHTML = this.highlight(r.versionOriginal || r.version);
            }
            r.el.classList.remove('lt-row-visible');
            r.el.classList.add('lt-row-hidden');
        });

        const hasMore = this.filterText === '' && filtered.length > this.visibleCount;
        const toShow = (hasMore && !this.isExpanded) ? filtered.slice(0, this.visibleCount) : filtered;
        toShow.forEach(r => {
            r.el.classList.remove('lt-row-hidden');
            r.el.classList.add('lt-row-visible');
        });

        if (this.showTable) this.updateTableVisibility();

        this.toggleContainer.innerHTML = '';
        if (hasMore) {
            const btn = this.el('button', 'lt-toggle-btn', this.toggleContainer);
            const icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="${this.isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"></polyline></svg>`;
            btn.innerHTML = this.isExpanded ? `${this.t('less')} ${icon}` : `${this.t('more', { n: filtered.length - this.visibleCount })} ${icon}`;
            btn.setAttribute('aria-expanded', this.isExpanded.toString());
            btn.onclick = () => {
                this.isExpanded = !this.isExpanded;
                this.updateVisibility();
            };
        }
    }

    /**
     * Renders the vertical line indicating current date.
     */
    renderCurrentDateLine(): void {
        const start = new Date(this.minYear, 0, 1).getTime();
        const dur = new Date(this.maxYear, 11, 31).getTime() - start;
        const offset = Date.now() - start;
        if (offset < 0 || offset > dur) return;

        const currentStr = new Date().toISOString().split('T')[0];
        const line = this.el('div', 'lt-current-date-indicator', this.indicators);
        line.style.left = `${(offset / dur) * 100}%`;
        line.setAttribute('role', 'separator');
        line.setAttribute('aria-label', this.t('today', { date: currentStr }));

        const badge = this.el('div', 'lt-current-date-badge', line);
        badge.textContent = currentStr;
        badge.setAttribute('aria-hidden', 'true');
    }
}
