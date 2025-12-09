/**
 * RiskDash Dynamic Legend Generator Tests
 * Tests for legend text generation based on threshold configuration
 */

const { generateDynamicLegend, formatLegendText } = require('../src/dynamicLegend');
const { defaultThresholds } = require('../src/thresholds');

describe('generateDynamicLegend', () => {
    describe('HIGH legend generation', () => {
        test('should always include Breakfix and No VRAM Scan', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.high).toContain('Breakfix > 0');
            expect(legend.high).toContain('No VRAM Scan');
        });

        test('should include TAM when high_tam_past_due < 999', () => {
            const thresholds = { ...defaultThresholds, high_tam_past_due: 20 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('TAM >20');
        });

        test('should NOT include TAM when high_tam_past_due = 999', () => {
            const thresholds = { ...defaultThresholds, high_tam_past_due: 999 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).not.toContain('TAM');
        });

        test('should include VPH when auto_high_ra_vph < 999', () => {
            const thresholds = { ...defaultThresholds, auto_high_ra_vph: 5 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('VPH >5');
        });

        test('should include scan age when auto_high_scan_age_days < 999', () => {
            const thresholds = { ...defaultThresholds, auto_high_scan_age_days: 30 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('Scan >30d');
        });

        test('should include True Policy when high_ess_compliance > 0', () => {
            const thresholds = { ...defaultThresholds, high_ess_compliance: 90 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('TruePolicy <90%');
        });

        test('should include Raw Policy when high_raw_policy_compliance > 0', () => {
            const thresholds = { ...defaultThresholds, high_raw_policy_compliance: 85 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('RawPolicy <85%');
        });

        test('should include Product when high_product_compliance > 0', () => {
            const thresholds = { ...defaultThresholds, high_product_compliance: 50 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.high).toContain('Product <50%');
        });

        test('should join HIGH parts with OR', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.high).toContain(' OR ');
        });
    });

    describe('MEDIUM legend generation', () => {
        test('should always include VPH and Product', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.med).toContain('VPH >');
            expect(legend.med).toContain('Product <');
        });

        test('should always include Scan age and TAM', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.med).toContain('Scan >');
            expect(legend.med).toContain('TAM >');
        });

        test('should include True Policy when med_true_policy_compliance > 0', () => {
            const thresholds = { ...defaultThresholds, med_true_policy_compliance: 95 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.med).toContain('TruePolicy <95%');
        });

        test('should NOT include True Policy when med_true_policy_compliance = 0', () => {
            const thresholds = { ...defaultThresholds, med_true_policy_compliance: 0 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.med).not.toContain('TruePolicy');
        });

        test('should include Raw Policy when med_raw_policy_compliance > 0', () => {
            const thresholds = { ...defaultThresholds, med_raw_policy_compliance: 90 };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.med).toContain('RawPolicy <90%');
        });

        test('should start with "2+ of:"', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.med).toMatch(/^2\+ of:/);
        });

        test('should use correct threshold values', () => {
            const thresholds = {
                ...defaultThresholds,
                med_ra_vph: 4.0,
                med_ess_compliance: 90,
                med_scan_age_days: 21,
                med_tam_past_due: 15
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.med).toContain('VPH >4');
            expect(legend.med).toContain('Product <90%');
            expect(legend.med).toContain('Scan >21d');
            expect(legend.med).toContain('TAM >15');
        });
    });

    describe('LOW legend generation', () => {
        test('should always include VPH, Product, and Scan', () => {
            const legend = generateDynamicLegend(defaultThresholds);
            expect(legend.low).toContain('VPH <');
            expect(legend.low).toContain('Product');
            expect(legend.low).toContain('Scan');
        });

        test('should include True Policy when enabled', () => {
            const thresholds = {
                ...defaultThresholds,
                low_true_policy_compliance_enabled: 1,
                low_true_policy_compliance: 95
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).toContain('TruePolicy ≥95%');
        });

        test('should NOT include True Policy when disabled', () => {
            const thresholds = {
                ...defaultThresholds,
                low_true_policy_compliance_enabled: 0
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).not.toContain('TruePolicy');
        });

        test('should include Raw Policy when enabled', () => {
            const thresholds = {
                ...defaultThresholds,
                low_raw_policy_compliance_enabled: 1,
                low_raw_policy_compliance: 95
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).toContain('RawPolicy ≥95%');
        });

        test('should include TAM when enabled', () => {
            const thresholds = {
                ...defaultThresholds,
                low_tam_past_due_enabled: 1,
                low_tam_past_due: 5
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).toContain('TAM ≤5');
        });

        test('should NOT include TAM when disabled', () => {
            const thresholds = {
                ...defaultThresholds,
                low_tam_past_due_enabled: 0
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).not.toContain('TAM');
        });

        test('should use correct threshold values', () => {
            const thresholds = {
                ...defaultThresholds,
                low_vph: 2.0,
                low_product_compliance: 98,
                low_scan_age_days: 7
            };
            const legend = generateDynamicLegend(thresholds);
            expect(legend.low).toContain('VPH <2');
            expect(legend.low).toContain('Product ≥98%');
            expect(legend.low).toContain('Scan ≤7d');
        });
    });

    describe('Default handling', () => {
        test('should use default thresholds when called with null', () => {
            const legend = generateDynamicLegend(null);
            expect(legend.high).toBeDefined();
            expect(legend.med).toBeDefined();
            expect(legend.low).toBeDefined();
        });

        test('should use default thresholds when called with undefined', () => {
            const legend = generateDynamicLegend(undefined);
            expect(legend.high).toBeDefined();
            expect(legend.med).toBeDefined();
            expect(legend.low).toBeDefined();
        });

        test('should use defaults for missing threshold values', () => {
            const legend = generateDynamicLegend({});
            expect(legend.med).toContain('VPH >3.5'); // Default med_ra_vph
            expect(legend.low).toContain('VPH <2.5'); // Default low_vph
        });
    });
});

describe('formatLegendText', () => {
    test('should replace threshold placeholders', () => {
        const text = 'VPH must be below {low_vph}';
        const thresholds = { low_vph: 2.5 };
        expect(formatLegendText(text, thresholds)).toBe('VPH must be below 2.5');
    });

    test('should replace multiple placeholders', () => {
        const text = 'VPH < {low_vph}, Scan <= {low_scan_age_days}d';
        const thresholds = { low_vph: 2.5, low_scan_age_days: 14 };
        expect(formatLegendText(text, thresholds)).toBe('VPH < 2.5, Scan <= 14d');
    });

    test('should keep unknown placeholders unchanged', () => {
        const text = 'Unknown: {unknown_threshold}';
        const thresholds = {};
        expect(formatLegendText(text, thresholds)).toBe('Unknown: {unknown_threshold}');
    });

    test('should handle empty string', () => {
        expect(formatLegendText('', {})).toBe('');
    });

    test('should handle null/undefined', () => {
        expect(formatLegendText(null, {})).toBe('');
        expect(formatLegendText(undefined, {})).toBe('');
    });

    test('should handle text without placeholders', () => {
        const text = 'No placeholders here';
        expect(formatLegendText(text, {})).toBe('No placeholders here');
    });
});

// Fuzz tests
describe('Fuzz Tests - Dynamic Legend', () => {
    const fuzzThresholds = [
        null, undefined, {},
        { med_ra_vph: NaN },
        { low_vph: Infinity },
        { high_tam_past_due: -1 },
        { low_true_policy_compliance_enabled: 'yes' },
        { low_true_policy_compliance_enabled: 2 },
        { low_true_policy_compliance_enabled: null }
    ];

    test.each(fuzzThresholds)('should not throw for thresholds: %p', (thresholds) => {
        expect(() => generateDynamicLegend(thresholds)).not.toThrow();
    });

    test('should always return an object with high, med, low', () => {
        fuzzThresholds.forEach(thresholds => {
            const legend = generateDynamicLegend(thresholds);
            expect(legend).toHaveProperty('high');
            expect(legend).toHaveProperty('med');
            expect(legend).toHaveProperty('low');
            expect(typeof legend.high).toBe('string');
            expect(typeof legend.med).toBe('string');
            expect(typeof legend.low).toBe('string');
        });
    });
});

// Property tests
describe('Property Tests - Dynamic Legend', () => {
    test('enabling a criterion should add it to the legend', () => {
        const withoutTam = generateDynamicLegend({
            ...defaultThresholds,
            low_tam_past_due_enabled: 0
        });
        const withTam = generateDynamicLegend({
            ...defaultThresholds,
            low_tam_past_due_enabled: 1
        });

        expect(withoutTam.low).not.toContain('TAM');
        expect(withTam.low).toContain('TAM');
    });

    test('changing threshold values should update legend text', () => {
        const legend1 = generateDynamicLegend({ ...defaultThresholds, low_vph: 2.0 });
        const legend2 = generateDynamicLegend({ ...defaultThresholds, low_vph: 3.0 });

        expect(legend1.low).toContain('VPH <2');
        expect(legend2.low).toContain('VPH <3');
    });
});
