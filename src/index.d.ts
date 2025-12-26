export interface TimelineVersion {
    version: string;
    ossStart: string;
    ossEnd: string;
    enterpriseEnd: string;
    releaseNotesUrl?: string;
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
     * Initializes the timeline. Called automatically by constructor.
     */
    init(): void;

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
