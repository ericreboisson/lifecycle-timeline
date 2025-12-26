import './timeline.css';

export default class Timeline {
  constructor(elementId, data, options = {}) {
    this.root = document.getElementById(elementId);
    // Filter out potential undefined items from sparse arrays
    this.data = (data || []).filter(item => item);
    this.visibleCount = options.visibleCount || 3;

    // Initial expansion state
    this.isExpanded = this.safeStorageGet('timeline_isExpanded') === 'true';

    // Calculate range dynamically or use default
    this.currentDate = new Date();
    this.minYear = new Date().getFullYear() - 1;
    this.maxYear = new Date().getFullYear() + 3;

    // Auto-detect range from data if possible
    if (this.data.length > 0) {
      const allDates = this.data.flatMap(d => [new Date(d.ossStart), new Date(d.enterpriseEnd)]);
      this.minYear = new Date(Math.min(...allDates)).getFullYear();
      this.maxYear = new Date(Math.max(...allDates)).getFullYear();
    }

    // Filter State
    this.filterText = '';

    try {
      this.init();
    } catch (e) {
      console.error('Timeline Init Error:', e);
      const err = document.createElement('div');
      err.style.color = 'red';
      err.style.padding = '20px';
      err.textContent = `Error initializing timeline: ${e.message}`;
      if (this.root) this.root.prepend(err);
    }
  }

  init() {
    if (!this.root) {
      return;
    }

    // 1. Render Toolbar (Search) BEFORE wrapper
    this.renderToolbar();

    // 2. Main structural wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'timeline-wrapper';
    this.root.appendChild(this.wrapper);

    // Header for Axis
    this.axisContainer = document.createElement('div');
    this.axisContainer.className = 'timeline-axis';
    this.wrapper.appendChild(this.axisContainer);

    // Years
    this.renderAxis();

    // Release Rows Container
    this.tracksContainer = document.createElement('div');
    this.tracksContainer.className = 'timeline-tracks';
    this.wrapper.appendChild(this.tracksContainer);

    // Create initial DOM elements for all rows
    this.createRowElements();

    // Initial visibility (apply expansion limit)
    this.updateVisibility();

    // Legend (Explaining colors)
    this.renderLegend();

    // Init Tooltip
    if (!document.querySelector('.custom-tooltip')) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'custom-tooltip';
      document.body.appendChild(this.tooltip);
    } else {
      this.tooltip = document.querySelector('.custom-tooltip');
    }

    // Theme (apply initial state)
    this.theme = this.safeStorageGet('timeline_theme') || 'light';
    document.documentElement.setAttribute('data-theme', this.theme);

    // Start Auto-Update (Current date line)
    this.startAutoUpdate();

    // Render Theme Toggle Button
    this.renderThemeToggle();
  }

  renderToolbar() {
    const bar = document.createElement('div');
    bar.className = 'timeline-toolbar';

    // -- Filter Section --
    const filterContainer = document.createElement('div');
    filterContainer.className = 'timeline-filter-container';

    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

    // Use contenteditable div to bypass form submission issues
    const input = document.createElement('div');
    input.className = 'timeline-filter-input';
    input.contentEditable = 'true';
    input.setAttribute('spellcheck', 'false');
    input.style.cursor = 'text';
    input.style.minWidth = '150px';
    input.style.display = 'inline-block';

    // Placeholder simulation
    if (!this.filterText) {
      input.textContent = 'Filter versions...';
      input.style.color = 'var(--text-secondary)';
    }

    input.onfocus = () => {
      if (input.textContent === 'Filter versions...') {
        input.textContent = '';
        input.style.color = 'var(--text-primary)';
      }
    };

    input.onblur = () => {
      if (input.textContent.trim() === '') {
        input.textContent = 'Filter versions...';
        input.style.color = 'var(--text-secondary)';
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        return false;
      }
    };

    let timeoutId;
    input.oninput = (e) => {
      e.stopPropagation(); // Isolate events
      input.style.color = 'var(--text-primary)';

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const val = input.textContent === 'Filter versions...' ? '' : input.textContent;
        this.filterText = val.toLowerCase().trim();
        this.updateVisibility();
      }, 300);
    };

    filterContainer.appendChild(searchIcon);
    filterContainer.appendChild(input);
    bar.appendChild(filterContainer);

    this.root.appendChild(bar);
  }

  renderThemeToggle() {
    // Check if button already exists to prevent duplicates on re-init
    if (document.querySelector('.theme-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.type = 'button';
    btn.title = 'Toggle Dark Mode';

    const iconMoon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const iconSun = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    // Set initial icon
    btn.innerHTML = this.theme === 'dark' ? iconSun : iconMoon;

    btn.onclick = () => {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      this.safeStorageSet('timeline_theme', this.theme);

      // Update icon
      btn.innerHTML = this.theme === 'dark' ? iconSun : iconMoon;
    };

    // Append to root for absolute positioning relative to the component
    this.root.appendChild(btn);
  }

  startAutoUpdate() {
    // Disabled auto-update to prevent flickering/resets
    if (this.autoUpdateInterval) clearInterval(this.autoUpdateInterval);

    // Initial render of date line is enough for static view
    this.renderCurrentDateLine();
  }

  renderLegend() {
    // Rich Legend Structure based on user request, adapted to current states
    const legendHTML = `
      <div class="release-legend">
        <div class="legend-block oss">
          <div class="legend-icon"></div>
          <div>
            <h3>OSS support</h3>
            <p>Free security updates and bugfixes.</p>
          </div>
        </div>
        <div class="legend-block commercial">
          <div class="legend-icon"></div>
          <div>
            <h3>Enterprise support</h3>
            <p>Enterprise support from experts during the OSS timeline, plus extended support after OSS End-Of-Life.</p>
          </div>
        </div>
        <div class="legend-block expired">
          <div class="legend-icon"></div>
          <div>
            <h3>Out of Support</h3>
            <p>Generation has reached end of life. No further updates are provided.</p>
          </div>
        </div>
      </div>
    `;

    // Create a container div to hold the HTML
    const div = document.createElement('div');
    div.innerHTML = legendHTML;

    // Append the first child (the .release-legend div) to the wrapper
    this.wrapper.appendChild(div.firstElementChild);
  }

  renderAxis() {
    // Clear logic if re-rendering
    this.axisContainer.innerHTML = '';

    // Label offset spacer matching version label width
    const spacer = document.createElement('div');
    spacer.style.width = '96px'; // 80px label + 16px margin
    spacer.style.flexShrink = '0';
    this.axisContainer.appendChild(spacer);

    const yearCount = this.maxYear - this.minYear + 1;

    for (let i = 0; i < yearCount; i++) {
      const year = this.minYear + i;
      const yearDiv = document.createElement('div');
      yearDiv.className = 'timeline-year';
      yearDiv.textContent = year;
      this.axisContainer.appendChild(yearDiv);
    }
  }

  renderGrid() {
    if (!this.gridContainer) return;

    const totalDuration = this.getTimelineDuration();
    const yearCount = this.maxYear - this.minYear + 1;

    for (let i = 0; i < yearCount; i++) {
      const year = this.minYear + i;
      // Create grid line for Jan 1st of each year
      const date = new Date(year, 0, 1);
      const offset = date.getTime() - this.getTimelineStart();

      // Only render if within range (first one might be at 0%)
      if (offset >= 0 && offset <= totalDuration) {
        const leftPercent = (offset / totalDuration) * 100;

        const line = document.createElement('div');
        line.className = 'year-grid-line';
        line.style.left = `${leftPercent}%`;
        this.gridContainer.appendChild(line);
      }
    }
  }

  createRowElements() {
    this.tracksContainer.innerHTML = ''; // clear

    // Create Grid Container (must be inside tracksContainer, but absolute)
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'grid-lines-container';
    this.tracksContainer.appendChild(this.gridContainer);

    // Render Grid Lines into the container
    this.renderGrid();

    // Render Current Date Line into the container
    this.renderCurrentDateLine();

    this.rowElements = this.data.map(item => {
      const row = document.createElement('div');
      row.className = 'timeline-row';

      // Label
      const label = document.createElement('div');
      label.className = 'version-label';

      if (item.releaseNotesUrl) {
        const link = document.createElement('a');
        link.href = item.releaseNotesUrl;
        link.className = 'version-link';
        link.target = '_blank';
        link.textContent = item.version;
        link.title = `View Release Notes for ${item.version}`;
        label.appendChild(link);
      } else {
        label.textContent = item.version;
      }

      // Status logic
      const nowTime = new Date().getTime();
      const ossStartTime = new Date(item.ossStart).getTime();
      const ossEndTime = new Date(item.ossEnd).getTime();
      const entEndTime = new Date(item.enterpriseEnd).getTime();

      if (nowTime >= ossStartTime && nowTime <= ossEndTime) {
        label.classList.add('status-oss');
      } else if (nowTime > ossEndTime && nowTime <= entEndTime) {
        label.classList.add('status-ent');
      } else if (nowTime > entEndTime) {
        label.classList.add('status-expired');
      }
      row.appendChild(label);

      // Track
      const track = document.createElement('div');
      track.className = 'track-container';

      const ossBar = this.createBarSegment(item.ossStart, item.ossEnd, 'bar-oss', 'OSS Support');
      const entBar = this.createBarSegment(item.ossStart, item.enterpriseEnd, 'bar-ent', 'Enterprise Support');

      track.appendChild(entBar);
      track.appendChild(ossBar); // OSS foreground

      row.appendChild(track);
      this.tracksContainer.appendChild(row);

      return { element: row, data: item };
    });

    // Toggle Button Container
    this.toggleBtnContainer = document.createElement('div');
    this.toggleBtnContainer.style.display = 'flex';
    this.toggleBtnContainer.style.justifyContent = 'center';
    this.toggleBtnContainer.style.paddingTop = '10px';
    this.toggleBtnContainer.style.zIndex = '10';
    this.toggleBtnContainer.style.position = 'relative';
    this.tracksContainer.appendChild(this.toggleBtnContainer);
  }

  updateVisibility() {
    const searchText = (this.filterText || '').toLowerCase().trim();
    const isFiltering = searchText.length > 0;

    // 1. Filter items
    const filteredItems = this.rowElements.filter(rowObj => {
      return !isFiltering || rowObj.data.version.toLowerCase().includes(searchText);
    });

    // 2. Hide all first
    this.rowElements.forEach(item => item.element.style.display = 'none');

    // 3. Expansion logic
    let itemsToShow = filteredItems;
    const hasMore = !isFiltering && filteredItems.length > this.visibleCount;

    if (hasMore && !this.isExpanded) {
      itemsToShow = filteredItems.slice(0, this.visibleCount);
    }

    // 4. Show matches
    itemsToShow.forEach(item => {
      item.element.style.display = 'flex';
    });

    // 5. Update Toggle Button
    this.renderToggleButton(hasMore, filteredItems.length - this.visibleCount);
  }

  renderRows() {
    // This is now replaced by updateVisibility, but keeping for compatibility if called
    this.updateVisibility();
  }

  renderToggleButton(show, remaining) {
    this.toggleBtnContainer.innerHTML = ''; // Clear old button

    if (!show) {
      this.toggleBtnContainer.style.display = 'none';
      return;
    }

    this.toggleBtnContainer.style.display = 'flex';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'timeline-toggle-btn';

    // Chevron Icons (SVG)
    const chevronDown = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const chevronUp = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;

    if (this.isExpanded) {
      btn.innerHTML = `Show Less ${chevronUp}`;
    } else {
      btn.innerHTML = `Show ${remaining} more versions ${chevronDown}`;
    }

    btn.onclick = () => {
      this.isExpanded = !this.isExpanded;
      this.safeStorageSet('timeline_isExpanded', this.isExpanded);
      this.updateVisibility();
    };

    this.toggleBtnContainer.appendChild(btn);
  }

  createBarSegment(startStr, endStr, className, labelPrefix) {
    const start = new Date(startStr);
    const end = new Date(endStr);

    const totalDuration = this.getTimelineDuration();
    const startOffset = start - this.getTimelineStart();
    const duration = end - start;

    const leftPercent = (startOffset / totalDuration) * 100;
    const widthPercent = (duration / totalDuration) * 100;

    const bar = document.createElement('div');
    bar.className = `bar-segment ${className}`;
    bar.style.left = `${leftPercent}%`;
    bar.style.width = `${widthPercent}%`;

    // Custom Tooltip Interactions
    const tooltipText = `${labelPrefix}: ${startStr} to ${endStr}`;

    bar.addEventListener('mouseenter', (e) => {
      if (!this.tooltip) return;
      this.tooltip.textContent = tooltipText;
      this.tooltip.style.opacity = '1';
      this.updateTooltipPosition(e);
    });

    bar.addEventListener('mousemove', (e) => {
      this.updateTooltipPosition(e);
    });

    bar.addEventListener('mouseleave', () => {
      if (!this.tooltip) return;
      this.tooltip.style.opacity = '0';
    });

    return bar;
  }

  updateTooltipPosition(e) {
    if (!this.tooltip) return;
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  renderCurrentDateLine() {
    if (!this.gridContainer) return;

    const now = new Date();
    const totalDuration = this.getTimelineDuration();
    const offset = now - this.getTimelineStart();

    if (offset < 0 || offset > totalDuration) return; // Out of range

    const leftPercent = (offset / totalDuration) * 100;

    // OPTIMIZATION: Update existing line if it exists and is attached
    if (this.currentDateLine && this.gridContainer.contains(this.currentDateLine)) {
      this.currentDateLine.style.left = `${leftPercent}%`;
      const badge = this.currentDateLine.querySelector('.current-date-badge');
      if (badge) {
        badge.textContent = now.toISOString().split('T')[0];
      }
      return;
    }

    // Otherwise create new
    const line = document.createElement('div');
    line.className = 'current-date-indicator';
    line.style.left = `${leftPercent}%`;

    // Badge
    const badge = document.createElement('div');
    badge.className = 'current-date-badge';
    badge.textContent = now.toISOString().split('T')[0];
    line.appendChild(badge);

    this.currentDateLine = line;
    this.gridContainer.appendChild(line);
  }

  // Helpers
  getTimelineStart() {
    return new Date(this.minYear, 0, 1).getTime();
  }

  getTimelineEnd() {
    return new Date(this.maxYear, 11, 31).getTime();
  }

  getTimelineDuration() {
    return this.getTimelineEnd() - this.getTimelineStart();
  }

  // Safe LocalStorage Helpers
  safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage access denied via safeStorageGet');
      return null;
    }
  }

  safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage access denied via safeStorageSet');
    }
  }
}
