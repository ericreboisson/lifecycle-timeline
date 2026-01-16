import { describe, it, expect, beforeEach, vi } from 'vitest';
import Timeline from './timeline';

describe('Timeline Component', () => {
    const mockData = [
        {
            version: '1.0.0',
            ossStart: '2023-01-01',
            ossEnd: '2024-01-01',
            enterpriseEnd: '2025-01-01'
        }
    ];

    beforeEach(() => {
        document.body.innerHTML = '<div id="timeline"></div>';
    });

    it('should initialize correctly with valid data', () => {
        const timeline = new Timeline('timeline', mockData);
        expect(timeline.data.length).toBe(1);
        expect(timeline.minYear).toBe(2023);
        expect(timeline.maxYear).toBe(2025);
    });

    it('should validate data and handle missing dates as fictive', () => {
        const testData = [
            ...mockData,
            { version: '2.0.0' } as any, // Missing dates -> should be kept as fictive
            { version: '3.0.0', ossStart: 'invalid', ossEnd: '2024-01-01' } as any // Invalid date format -> should be filtered
        ];

        // Mock console.warn to avoid cluttering output
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const timeline = new Timeline('timeline', []);
        const validated = timeline.validateData(testData);

        // Should have 2 items: 1.0.0 (valid) and 2.0.0 (fictive due to missing dates)
        expect(validated.length).toBe(2);
        expect(validated[1].version).toBe('2.0.0');
        expect(validated[1].isFictive).toBe(true);

        // Should have warned only for invalid date in 3.0.0 (dateless is now supported as fictive)
        expect(warnSpy).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
    });

    it('should calculate time range correctly', () => {
        const timeline = new Timeline('timeline', mockData);
        expect(timeline.minYear).toBe(2023);
        expect(timeline.maxYear).toBe(2025);

        timeline.updateData([
            { version: '0.1.0', ossStart: '2020-05-10', ossEnd: '2021-05-10' }
        ]);
        expect(timeline.minYear).toBe(2020);
        expect(timeline.maxYear).toBe(2021);
    });

    it('should filter versions based on search text', () => {
        const multiData = [
            { version: '1.0.0', ossStart: '2023-01-01', ossEnd: '2024-01-01' },
            { version: '2.1.0', ossStart: '2023-01-01', ossEnd: '2024-01-01' }
        ];
        const timeline = new Timeline('timeline', multiData);

        timeline.filterText = '2.1';
        timeline.updateVisibility();

        const visibleRows = timeline.rows.filter(r => r.el.classList.contains('lt-row-visible'));
        expect(visibleRows.length).toBe(1);
        expect(visibleRows[0].versionOriginal).toBe('2.1.0');
    });

    it('should support i18n overrides', () => {
        const options = {
            locale: 'fr',
            i18n: {
                fr: { filter: 'Chercher...' }
            }
        };
        const timeline = new Timeline('timeline', mockData, options);
        expect(timeline.t('filter')).toBe('Chercher...');
    });
});
