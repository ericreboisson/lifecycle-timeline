export interface TimelineVersion {
    version: string;
    ossStart: string;
    ossEnd: string;
    enterpriseEnd: string;
    releaseNotesUrl?: string;
    isMajor?: boolean;
}

export interface TimelineOptions {
    /**
     * Number of versions to show before "Show more" button appears.
     * @default 3
     */
    visibleCount?: number;

    /**
     * Preferred locale for translations ('en' or 'fr'). 
     * Defaults to browser language.
     */
    locale?: 'en' | 'fr' | string;

    /**
     * Custom translations to merge or override.
     */
    i18n?: Record<string, Record<string, string>>;

    /**
     * Whether to show the data table between filter and timeline.
     * @default true
     */
    showTable?: boolean;

    /**
     * Whether to show the legend below the timeline.
     * @default true
     */
    showLegend?: boolean;

    /**
     * Whether to show the version filter input.
     * @default true
     */
    filterVersions?: boolean;

    /**
     * Whether to show the enterprise bar normally (false) or split after OSS (true).
     * @default false
     */
    splitSupport?: boolean;

    /**
     * Whether to use compact mode (reduced height).
     * @default false
     */
    compactMode?: boolean;

    /**
     * Whether to show the major version filter checkbox.
     * @default false
     */
    showMajorFilter?: boolean;
}

export default class Timeline {
    /**
     * Creates a new Lifecycle Timeline.
     * @param elementId The ID of the container element.
     * @param data Array of version data.
     * @param options Configuration options.
     */
    constructor(elementId: string, data: TimelineVersion[], options?: TimelineOptions);

    /**
     * Sets up the initial layout.
     */
    setupBaseLayout(): void;

    /**
     * Updates the timeline data and re-renders.
     * @param newData Array of version data.
     */
    updateData(newData: TimelineVersion[]): void;

    /**
     * Renders the entire timeline.
     */
    render(): void;

    /**
     * Renders the toolbar (search/filter).
     */
    renderToolbar(): void;

    /**
     * Renders the theme toggle button.
     */
    renderThemeToggle(): void;

    /**
     * Updates the visibility of rows based on filtering and expansion state.
     */
    updateVisibility(): void;
}
