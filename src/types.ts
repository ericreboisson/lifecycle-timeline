export interface TimelineVersion {
    version: string;
    ossStart?: string;
    ossEnd?: string;
    enterpriseEnd?: string;
    releaseNotesUrl?: string;
    isMajor?: boolean;
    isFuture?: boolean;
    isFictive?: boolean;
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

    /**
     * Whether the major version filter runs by default.
     * @default false
     */
    majorFilterDefault?: boolean;
}
