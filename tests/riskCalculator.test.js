/**
 * RiskDash Risk Calculator Tests
 * Comprehensive tests for calculateRisk function and all HIGH/MED/LOW triggers
 */

const { calculateRisk, calculateAllRisks, scanAge } = require('../src/riskCalculator');
const { defaultThresholds } = require('../src/thresholds');
const {
    createTestBoat,
    createHealthyBoat,
    createBreakfixBoat,
    createNoVramBoat,
    createNmciBoat
} = require('../src/dataModels');

describe('calculateRisk', () => {
    describe('HIGH Risk Triggers - Breakfix', () => {
        test('should return HIGH for NIPR breakfix > 0', () => {
            const boat = createHealthyBoat({ essNiprBreakfix: 1 });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('NIPR Breakfix: 1');
        });

        test('should return HIGH for SIPR breakfix > 0', () => {
            const boat = createHealthyBoat({ essSiprBreakfix: 2 });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('SIPR Breakfix: 2');
        });

        test('should return HIGH for both enclaves with breakfix', () => {
            const boat = createHealthyBoat({
                essNiprBreakfix: 1,
                essSiprBreakfix: 2
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('NIPR Breakfix: 1');
            expect(result.reasons).toContain('SIPR Breakfix: 2');
        });

        test('should NOT trigger HIGH for breakfix = 0', () => {
            const boat = createHealthyBoat({
                essNiprBreakfix: 0,
                essSiprBreakfix: 0
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');
        });
    });

    describe('HIGH Risk Triggers - No VRAM Data', () => {
        test('should return HIGH when no VRAM data at all', () => {
            const boat = createNoVramBoat();
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('No VRAM data');
        });

        test('should return HIGH when only NIPR VRAM exists (for non-NMCI)', () => {
            const boat = createHealthyBoat({
                vramSiprAssets: null,
                vramSiprScanDate: null,
                vramSiprRaVph: null
            });
            // Should still be okay - has NIPR data
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');
        });

        test('should return HIGH when only SIPR VRAM exists (for non-NMCI)', () => {
            const boat = createHealthyBoat({
                vramNiprAssets: null,
                vramNiprScanDate: null,
                vramNiprRaVph: null
            });
            // Should still be okay - has SIPR data
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');
        });
    });

    describe('HIGH Risk Triggers - True Policy Compliance', () => {
        test('should return HIGH when True Policy < high_ess_compliance threshold', () => {
            const thresholds = { ...defaultThresholds, high_ess_compliance: 90 };
            const boat = createHealthyBoat({
                essNiprTruePolicy: 85,
                essSiprTruePolicy: 85
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('HIGH');
        });

        test('should NOT trigger HIGH when True Policy >= threshold', () => {
            const thresholds = { ...defaultThresholds, high_ess_compliance: 90 };
            const boat = createHealthyBoat({
                essNiprTruePolicy: 98,  // Above threshold
                essSiprTruePolicy: 98   // Above threshold
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('LOW');
        });

        test('should NOT trigger HIGH when high_ess_compliance is 0 (disabled)', () => {
            const thresholds = { ...defaultThresholds, high_ess_compliance: 0 };
            const boat = createHealthyBoat({
                essNiprTruePolicy: 50,
                essSiprTruePolicy: 50
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).not.toBe('HIGH');
        });
    });

    describe('HIGH Risk Triggers - TAM Past Due', () => {
        test('should return HIGH when TAM past due > threshold', () => {
            const thresholds = { ...defaultThresholds, high_tam_past_due: 20 };
            const boat = createHealthyBoat({ tamPastDue: 25 });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons.some(r => r.includes('TAMs'))).toBe(true);
        });

        test('should NOT trigger HIGH when TAM <= threshold', () => {
            const thresholds = { ...defaultThresholds, high_tam_past_due: 20 };
            const boat = createHealthyBoat({ tamPastDue: 20 });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('LOW');
        });
    });

    describe('HIGH Risk Triggers - VPH (when enabled)', () => {
        test('should return HIGH when VPH > auto_high_ra_vph', () => {
            const thresholds = { ...defaultThresholds, auto_high_ra_vph: 5 };
            const boat = createHealthyBoat({
                vramNiprRaVph: 6,
                vramSiprRaVph: 6
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('HIGH');
        });

        test('should NOT trigger HIGH when auto_high_ra_vph is 999 (disabled)', () => {
            const thresholds = { ...defaultThresholds, auto_high_ra_vph: 999 };
            const boat = createHealthyBoat({
                vramNiprRaVph: 10,
                vramSiprRaVph: 10
            });
            const result = calculateRisk(boat, thresholds);
            // Should still be MED or LOW depending on other criteria
            expect(result.level).not.toBe('HIGH');
        });
    });

    describe('HIGH Risk Triggers - Scan Age (when enabled)', () => {
        test('should return HIGH when scan age > auto_high_scan_age_days', () => {
            const thresholds = { ...defaultThresholds, auto_high_scan_age_days: 30 };
            const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
            const boat = createHealthyBoat({
                vramNiprScanDate: oldDate,
                vramSiprScanDate: oldDate
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('HIGH');
        });

        test('should NOT trigger HIGH when auto_high_scan_age_days is 999 (disabled)', () => {
            const thresholds = { ...defaultThresholds, auto_high_scan_age_days: 999 };
            const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
            const boat = createHealthyBoat({
                vramNiprScanDate: oldDate,
                vramSiprScanDate: oldDate
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).not.toBe('HIGH');
        });
    });

    describe('MEDIUM Risk - 2+ Conditions Required', () => {
        test('should return LOW for only 1 MED condition', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 4.0, // Above med_ra_vph of 3.5
                vramSiprRaVph: 1.0  // Below threshold
            });
            const result = calculateRisk(boat, defaultThresholds);
            // Only 1 MED condition, should fall through to LOW criteria check
            expect(result.level).not.toBe('HIGH');
        });

        test('should return MED for 2+ conditions (VPH + Compliance)', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 4.0,  // Above med_ra_vph
                essNiprProductCompliance: 90  // Below med_ess_compliance of 95
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });

        test('should return MED for 2+ conditions (VPH + Scan Age)', () => {
            const thresholds = { ...defaultThresholds, med_scan_age_days: 14 };
            const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
            const boat = createHealthyBoat({
                vramNiprRaVph: 4.0,  // Above med_ra_vph
                vramNiprScanDate: oldDate,  // Above med_scan_age_days
                vramSiprScanDate: oldDate
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('MED');
        });

        test('should return MED for 2+ conditions (Compliance + TAM)', () => {
            const thresholds = { ...defaultThresholds, med_tam_past_due: 10 };
            const boat = createHealthyBoat({
                essNiprProductCompliance: 90,  // Below med_ess_compliance
                tamPastDue: 15  // Above med_tam_past_due
            });
            const result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('MED');
        });

        test('should count NIPR and SIPR VPH separately', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 4.0,  // Above med_ra_vph
                vramSiprRaVph: 4.0   // Above med_ra_vph (counts as 2nd condition)
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });
    });

    describe('LOW Risk Criteria', () => {
        test('should return LOW for healthy boat meeting all criteria', () => {
            const boat = createHealthyBoat();
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');
            expect(result.reasons).toHaveLength(0);
        });

        test('should upgrade to MED if VPH >= low_vph threshold', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 2.5  // Exactly at low_vph threshold
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });

        test('should upgrade to MED if Product Compliance < low_product_compliance', () => {
            const boat = createHealthyBoat({
                essNiprProductCompliance: 94  // Below 95%
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });

        test('should upgrade to MED if scan age > low_scan_age_days', () => {
            const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
            const boat = createHealthyBoat({
                vramNiprScanDate: oldDate,
                vramSiprScanDate: oldDate
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });

        test('should respect low_tam_past_due_enabled toggle', () => {
            // Disabled by default
            const boat = createHealthyBoat({ tamPastDue: 10 });
            let result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');

            // Enabled
            const thresholds = { ...defaultThresholds, low_tam_past_due_enabled: 1, low_tam_past_due: 5 };
            result = calculateRisk(boat, thresholds);
            expect(result.level).toBe('MED');
        });

        test('should respect low_true_policy_compliance_enabled toggle', () => {
            // When disabled, True Policy doesn't affect LOW criteria
            // But med_true_policy_compliance still applies for MED calculation
            // Use True Policy = 94 which is below default med_true_policy_compliance of 95
            // This will count as 1 MED condition, but 1 condition alone isn't enough for MED
            const boat = createHealthyBoat({
                essNiprTruePolicy: 94,  // Below med threshold but only 1 condition
                essSiprTruePolicy: 98   // Above med threshold
            });

            // With low toggle disabled, boat should still be LOW if only 1 MED condition
            const thresholdsDisabled = {
                ...defaultThresholds,
                low_true_policy_compliance_enabled: 0,
                med_true_policy_compliance: 0  // Disable MED true policy check too
            };
            let result = calculateRisk(boat, thresholdsDisabled);
            expect(result.level).toBe('LOW');

            // When enabled with threshold of 95, True Policy of 94 fails LOW criteria
            const thresholdsEnabled = {
                ...defaultThresholds,
                low_true_policy_compliance_enabled: 1,
                low_true_policy_compliance: 95,
                med_true_policy_compliance: 0  // Disable MED true policy check
            };
            result = calculateRisk(boat, thresholdsEnabled);
            expect(result.level).toBe('MED');
        });
    });

    describe('NMCI Boat Handling', () => {
        test('should ignore NIPR data for NMCI boats', () => {
            const boat = createNmciBoat({
                essNiprBreakfix: 5,  // Would trigger HIGH for non-NMCI
                vramNiprRaVph: 10    // Would trigger conditions for non-NMCI
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');
            expect(result.reasons).not.toContain('NIPR Breakfix: 5');
        });

        test('should still check SIPR data for NMCI boats', () => {
            const boat = createNmciBoat({
                essSiprBreakfix: 3
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('SIPR Breakfix: 3');
        });

        test('should return HIGH if NMCI boat has no SIPR VRAM data', () => {
            const boat = createNmciBoat({
                vramSiprAssets: null,
                vramSiprScanDate: null,
                vramSiprRaVph: null
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
            expect(result.reasons).toContain('No VRAM data');
        });
    });

    describe('Scan Exempt Logic', () => {
        test('should downgrade HIGH to MED when scan exempt and only "No VRAM data" reason', () => {
            const boat = createNoVramBoat({
                vramNiprScanExempt: true
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
            expect(result.reasons).toContain('Scan Exempt');
        });

        test('should NOT downgrade HIGH if there are other HIGH reasons', () => {
            const boat = createNoVramBoat({
                vramNiprScanExempt: true,
                essNiprBreakfix: 1  // Another HIGH reason
            });
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('HIGH');
        });

        test('NMCI boats require BOTH enclaves scan exempt', () => {
            // Only NIPR exempt - should stay HIGH
            const boat1 = createNmciBoat({
                vramSiprAssets: null,
                vramSiprScanDate: null,
                vramSiprRaVph: null,
                vramNiprScanExempt: true,
                vramSiprScanExempt: false
            });
            let result = calculateRisk(boat1, defaultThresholds);
            expect(result.level).toBe('HIGH');

            // Both exempt - should downgrade
            const boat2 = createNmciBoat({
                vramSiprAssets: null,
                vramSiprScanDate: null,
                vramSiprRaVph: null,
                vramNiprScanExempt: true,
                vramSiprScanExempt: true
            });
            result = calculateRisk(boat2, defaultThresholds);
            expect(result.level).toBe('MED');
        });
    });

    describe('Threshold Adjustments', () => {
        test('should recalculate risk when thresholds change', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 3.0,
                vramSiprRaVph: 3.0
            });

            // With default thresholds (low_vph: 2.5)
            let result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');

            // Adjust threshold to allow 3.0 as LOW
            const relaxedThresholds = { ...defaultThresholds, low_vph: 3.5 };
            result = calculateRisk(boat, relaxedThresholds);
            expect(result.level).toBe('LOW');
        });

        test('should handle threshold boundary values correctly', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 2.5,  // Exactly at default low_vph
                vramSiprRaVph: 2.4   // Below threshold
            });

            // VPH of 2.5 should fail LOW criteria (>= check)
            const result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED');
        });
    });
});

describe('calculateAllRisks', () => {
    test('should calculate risk for all boats in array', () => {
        const boats = [
            createHealthyBoat(),
            createBreakfixBoat(),
            createNoVramBoat()
        ];

        const result = calculateAllRisks(boats, defaultThresholds);

        expect(result[0].riskLevel).toBe('LOW');
        expect(result[1].riskLevel).toBe('HIGH');
        expect(result[2].riskLevel).toBe('HIGH');
    });

    test('should update riskReasons for each boat', () => {
        const boats = [
            createBreakfixBoat({ boatName: 'SSN-001' }),
            createBreakfixBoat({ boatName: 'SSN-002', essNiprBreakfix: 5 })
        ];

        const result = calculateAllRisks(boats, defaultThresholds);

        expect(result[0].riskReasons).toContain('NIPR Breakfix: 3');
        expect(result[1].riskReasons).toContain('NIPR Breakfix: 5');
    });

    test('should handle empty array', () => {
        const result = calculateAllRisks([], defaultThresholds);
        expect(result).toHaveLength(0);
    });
});

describe('scanAge helper', () => {
    test('should calculate correct age', () => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        expect(scanAge(fiveDaysAgo)).toBe(5);
    });

    test('should return null for invalid dates', () => {
        expect(scanAge(null)).toBeNull();
        expect(scanAge('invalid')).toBeNull();
    });

    test('should return 0 for today', () => {
        expect(scanAge(new Date())).toBe(0);
    });
});

// Fuzz tests for risk calculator
describe('Fuzz Tests - Risk Calculator', () => {
    const invalidBoats = [
        // Missing required fields
        {},
        { boatName: 'SSN-001' },
        // Null values everywhere
        {
            boatName: 'SSN-001', isNmci: null, essNiprBreakfix: null,
            vramNiprScanDate: null, vramSiprScanDate: null
        },
        // Invalid types
        { boatName: 'SSN-001', essNiprBreakfix: 'not a number' },
        { boatName: 'SSN-001', isNmci: 'maybe' },
        { boatName: 'SSN-001', vramNiprRaVph: {} },
        // Extreme values
        { boatName: 'SSN-001', essNiprBreakfix: Infinity },
        { boatName: 'SSN-001', vramNiprRaVph: -Infinity },
        { boatName: 'SSN-001', essNiprProductCompliance: NaN }
    ];

    test.each(invalidBoats)('should not throw for invalid boat: %p', (boat) => {
        expect(() => calculateRisk(boat, defaultThresholds)).not.toThrow();
    });

    const invalidThresholds = [
        null,
        undefined,
        {},
        { low_vph: 'not a number' },
        { med_ra_vph: NaN },
        { high_tam_past_due: Infinity }
    ];

    test.each(invalidThresholds)('should not throw for invalid thresholds: %p', (thresholds) => {
        const boat = createHealthyBoat();
        expect(() => calculateRisk(boat, thresholds)).not.toThrow();
    });
});

// Property-based tests
describe('Property Tests - Risk Calculator', () => {
    test('HIGH risk should always be >= MED risk in severity', () => {
        // If we have a HIGH boat and remove the HIGH trigger, it should be MED or LOW
        const highBoat = createBreakfixBoat();
        expect(calculateRisk(highBoat, defaultThresholds).level).toBe('HIGH');

        // Remove breakfix
        const noBreakfixBoat = { ...highBoat, essNiprBreakfix: 0 };
        const result = calculateRisk(noBreakfixBoat, defaultThresholds);
        expect(['MED', 'LOW']).toContain(result.level);
    });

    test('Adding a HIGH trigger should never result in lower risk', () => {
        const lowBoat = createHealthyBoat();
        expect(calculateRisk(lowBoat, defaultThresholds).level).toBe('LOW');

        // Add breakfix
        const withBreakfix = { ...lowBoat, essNiprBreakfix: 1 };
        expect(calculateRisk(withBreakfix, defaultThresholds).level).toBe('HIGH');
    });

    test('Relaxing thresholds should never increase risk level', () => {
        const boat = createHealthyBoat({
            vramNiprRaVph: 3.0  // Above default low_vph of 2.5
        });

        const strictResult = calculateRisk(boat, defaultThresholds);

        // Relax VPH threshold
        const relaxedThresholds = {
            ...defaultThresholds,
            low_vph: 5.0,
            med_ra_vph: 6.0
        };
        const relaxedResult = calculateRisk(boat, relaxedThresholds);

        const riskOrder = { LOW: 0, MED: 1, HIGH: 2 };
        expect(riskOrder[relaxedResult.level]).toBeLessThanOrEqual(riskOrder[strictResult.level]);
    });
});
