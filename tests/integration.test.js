/**
 * RiskDash Integration Tests
 * End-to-end tests for the complete data processing pipeline
 */

const { calculateRisk, calculateAllRisks } = require('../src/riskCalculator');
const { aggregateByISIC, calculateStats } = require('../src/aggregation');
const { generateDynamicLegend } = require('../src/dynamicLegend');
const { prodCompClass, vphClass, scanAgeClass } = require('../src/colorClassification');
const { compressAndEncode, decodeAndDecompress } = require('../src/encoding');
const { defaultThresholds } = require('../src/thresholds');
const { createHealthyBoat, createBreakfixBoat, createNoVramBoat, createNmciBoat } = require('../src/dataModels');

describe('Integration: Complete Pipeline', () => {
    describe('Risk calculation to aggregation pipeline', () => {
        test('should correctly calculate and aggregate risk for a fleet', () => {
            // Create a realistic fleet with various conditions
            const fleet = [
                // CSL boats
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL' }),
                createBreakfixBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 1', tycom: 'CSL' }),
                createHealthyBoat({ boatName: 'SSN-004', isic: 'COMSUBRON 2', tycom: 'CSL' }),
                createNoVramBoat({ boatName: 'SSN-005', isic: 'COMSUBRON 2', tycom: 'CSL' }),
                // CSP boats
                createHealthyBoat({ boatName: 'SSBN-726', isic: 'COMSUBRON 17', tycom: 'CSP' }),
                createHealthyBoat({ boatName: 'SSBN-727', isic: 'COMSUBRON 17', tycom: 'CSP' }),
                createNmciBoat({ boatName: 'SSBN-728', isic: 'COMSUBRON 17', tycom: 'CSP' })
            ];

            // Calculate risks
            const boatsWithRisk = calculateAllRisks(fleet, defaultThresholds);

            // Verify risk calculations
            expect(boatsWithRisk[0].riskLevel).toBe('LOW');  // Healthy
            expect(boatsWithRisk[1].riskLevel).toBe('LOW');  // Healthy
            expect(boatsWithRisk[2].riskLevel).toBe('HIGH'); // Breakfix
            expect(boatsWithRisk[3].riskLevel).toBe('LOW');  // Healthy
            expect(boatsWithRisk[4].riskLevel).toBe('HIGH'); // No VRAM

            // Aggregate by ISIC
            const aggregations = aggregateByISIC(boatsWithRisk, { isics: [] });

            // Verify CSL aggregations
            expect(aggregations.csl).toHaveLength(2);
            const comsubron1 = aggregations.csl.find(a => a.isicName === 'COMSUBRON 1');
            expect(comsubron1.boatCount).toBe(3);
            expect(comsubron1.highRiskCount).toBe(1);

            const comsubron2 = aggregations.csl.find(a => a.isicName === 'COMSUBRON 2');
            expect(comsubron2.boatCount).toBe(2);
            expect(comsubron2.highRiskCount).toBe(1);

            // Verify CSP aggregations
            expect(aggregations.csp).toHaveLength(1);
            const comsubron17 = aggregations.csp[0];
            expect(comsubron17.boatCount).toBe(3);

            // Calculate overall stats
            const stats = calculateStats(boatsWithRisk);
            expect(stats.totalBoats).toBe(8);
            expect(stats.highRiskCount).toBe(2);
        });
    });

    describe('Threshold changes affecting risk levels', () => {
        test('should recalculate risks when thresholds change', () => {
            const boat = createHealthyBoat({
                vramNiprRaVph: 3.0,
                vramSiprRaVph: 3.0
            });

            // With strict thresholds (low_vph: 2.5)
            let result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('MED'); // VPH >= 2.5 fails LOW criteria

            // With relaxed thresholds
            const relaxedThresholds = {
                ...defaultThresholds,
                low_vph: 3.5,  // Now 3.0 passes LOW criteria
                med_ra_vph: 4.0
            };
            result = calculateRisk(boat, relaxedThresholds);
            expect(result.level).toBe('LOW');

            // Legend should reflect changes
            const strictLegend = generateDynamicLegend(defaultThresholds);
            const relaxedLegend = generateDynamicLegend(relaxedThresholds);
            expect(strictLegend.low).toContain('VPH <2.5');
            expect(relaxedLegend.low).toContain('VPH <3.5');
        });

        test('should enable/disable toggleable criteria', () => {
            const boat = createHealthyBoat({
                tamPastDue: 10 // Above default low_tam_past_due of 5
            });

            // TAM disabled by default
            let result = calculateRisk(boat, defaultThresholds);
            expect(result.level).toBe('LOW');

            // Enable TAM for LOW criteria
            const withTam = {
                ...defaultThresholds,
                low_tam_past_due_enabled: 1,
                low_tam_past_due: 5
            };
            result = calculateRisk(boat, withTam);
            expect(result.level).toBe('MED');

            // Legend should reflect TAM being enabled
            const legend = generateDynamicLegend(withTam);
            expect(legend.low).toContain('TAM');
        });
    });

    describe('Color classification consistency with risk', () => {
        test('should have consistent color classification for risk metrics', () => {
            // Test VPH classification consistency
            const greenVph = 2.0;
            const yellowVph = 3.0;
            const redVph = 4.0;

            expect(vphClass(greenVph, defaultThresholds)).toBe('risk-low');
            expect(vphClass(yellowVph, defaultThresholds)).toBe('risk-med');
            expect(vphClass(redVph, defaultThresholds)).toBe('risk-high');

            // These should align with risk calculation for LOW criteria
            const lowVphBoat = createHealthyBoat({ vramNiprRaVph: greenVph, vramSiprRaVph: greenVph });
            expect(calculateRisk(lowVphBoat, defaultThresholds).level).toBe('LOW');
        });

        test('should classify compliance metrics correctly', () => {
            // Product compliance
            expect(prodCompClass(95, defaultThresholds)).toBe('risk-low');
            expect(prodCompClass(92, defaultThresholds)).toBe('risk-med');
            expect(prodCompClass(89, defaultThresholds)).toBe('risk-high');

            // Verify alignment with risk calculation
            const highCompBoat = createHealthyBoat({
                essNiprProductCompliance: 98,
                essSiprProductCompliance: 98
            });
            expect(calculateRisk(highCompBoat, defaultThresholds).level).toBe('LOW');

            const lowCompBoat = createHealthyBoat({
                essNiprProductCompliance: 89,
                essSiprProductCompliance: 89
            });
            // Low compliance should trigger MED (fails LOW criteria)
            expect(calculateRisk(lowCompBoat, defaultThresholds).level).toBe('MED');
        });
    });

    describe('NMCI boat handling through pipeline', () => {
        test('should correctly handle NMCI boats in aggregation', () => {
            const fleet = [
                createNmciBoat({
                    boatName: 'SSN-010',
                    isic: 'COMSUBRON 1',
                    tycom: 'CSL',
                    essNiprBreakfix: 100,  // Should be ignored
                    essNiprProductCompliance: 50,  // Should be ignored
                    essSiprBreakfix: 0,
                    essSiprProductCompliance: 98
                }),
                createHealthyBoat({
                    boatName: 'SSN-011',
                    isic: 'COMSUBRON 1',
                    tycom: 'CSL',
                    essNiprBreakfix: 2,
                    essNiprProductCompliance: 95,
                    essSiprBreakfix: 1,
                    essSiprProductCompliance: 96
                })
            ];

            const boatsWithRisk = calculateAllRisks(fleet, defaultThresholds);
            const aggs = aggregateByISIC(boatsWithRisk, { isics: [] });

            // NMCI NIPR breakfix should not be counted
            expect(aggs.csl[0].niprBreakfixSum).toBe(2); // Only non-NMCI

            // NMCI NIPR compliance should not be in average
            expect(aggs.csl[0].niprProdCompAvg).toBe(95); // Only non-NMCI boat
        });
    });

    describe('Data encoding round-trip', () => {
        test('should preserve full report data through encode/decode', () => {
            // Create a realistic report dataset
            const reportData = {
                boats: [
                    createHealthyBoat({ boatName: 'SSN-001' }),
                    createBreakfixBoat({ boatName: 'SSN-002' }),
                    createNmciBoat({ boatName: 'SSN-003' })
                ],
                settings: {
                    thresholds: defaultThresholds,
                    version: '1.0',
                    author: 'Test User'
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    boatCount: 3
                }
            };

            // Calculate risks before encoding
            reportData.boats = calculateAllRisks(reportData.boats, defaultThresholds);

            // Encode and decode
            const encoded = compressAndEncode(reportData);
            const { data: decoded, valid } = decodeAndDecompress(encoded);

            // Verify data integrity
            expect(valid).toBe(true);
            expect(decoded.boats).toHaveLength(3);
            expect(decoded.boats[0].boatName).toBe('SSN-001');
            expect(decoded.boats[0].riskLevel).toBe('LOW');
            expect(decoded.boats[1].riskLevel).toBe('HIGH');
            expect(decoded.settings.thresholds).toEqual(defaultThresholds);
        });
    });

    describe('Legend generation matches risk calculation', () => {
        test('should generate accurate legend text for default thresholds', () => {
            const legend = generateDynamicLegend(defaultThresholds);

            // HIGH should include breakfix and no VRAM
            expect(legend.high).toContain('Breakfix');
            expect(legend.high).toContain('No VRAM Scan');

            // With default high_ess_compliance of 90, should be included
            if (defaultThresholds.high_ess_compliance > 0) {
                expect(legend.high).toContain('TruePolicy');
            }

            // MED should show 2+ requirement
            expect(legend.med).toMatch(/^2\+ of:/);
            expect(legend.med).toContain('VPH');
            expect(legend.med).toContain('Product');

            // LOW should list criteria
            expect(legend.low).toContain('VPH');
            expect(legend.low).toContain('Product');
            expect(legend.low).toContain('Scan');
        });

        test('should match legend text to actual risk behavior', () => {
            // Legend says breakfix > 0 triggers HIGH
            const breakfixBoat = createBreakfixBoat();
            expect(calculateRisk(breakfixBoat, defaultThresholds).level).toBe('HIGH');

            // Legend says no VRAM triggers HIGH
            const noVramBoat = createNoVramBoat();
            expect(calculateRisk(noVramBoat, defaultThresholds).level).toBe('HIGH');

            // Legend says 2+ MED conditions trigger MED
            const twoConditions = createHealthyBoat({
                vramNiprRaVph: 4.0,  // > med_ra_vph
                essNiprProductCompliance: 90  // < med_ess_compliance
            });
            expect(calculateRisk(twoConditions, defaultThresholds).level).toBe('MED');
        });
    });
});

describe('Integration: Stress Tests', () => {
    test('should handle large fleet efficiently', () => {
        // Create a large fleet
        const fleet = [];
        for (let i = 0; i < 1000; i++) {
            fleet.push(createHealthyBoat({
                boatName: `SSN-${String(i).padStart(3, '0')}`,
                isic: `COMSUBRON ${Math.floor(i / 100) + 1}`,
                tycom: i < 500 ? 'CSL' : 'CSP',
                vramNiprRaVph: Math.random() * 5,
                essNiprProductCompliance: 80 + Math.random() * 20
            }));
        }

        const startTime = Date.now();

        // Calculate risks
        const boatsWithRisk = calculateAllRisks(fleet, defaultThresholds);

        // Aggregate
        const aggs = aggregateByISIC(boatsWithRisk, { isics: [] });

        // Calculate stats
        const stats = calculateStats(boatsWithRisk);

        const elapsed = Date.now() - startTime;

        // Verify results
        expect(boatsWithRisk).toHaveLength(1000);
        expect(aggs.csl.length + aggs.csp.length).toBeGreaterThan(0);
        expect(stats.totalBoats).toBe(1000);

        // Should complete in reasonable time (< 1 second)
        expect(elapsed).toBeLessThan(1000);
    });

    test('should handle encoding/decoding large datasets', () => {
        const largeData = {
            boats: Array(100).fill(null).map((_, i) => createHealthyBoat({
                boatName: `SSN-${i}`,
                notes: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
            })),
            settings: defaultThresholds
        };

        const startTime = Date.now();

        const encoded = compressAndEncode(largeData);
        const { data: decoded, valid } = decodeAndDecompress(encoded);

        const elapsed = Date.now() - startTime;

        expect(valid).toBe(true);
        expect(decoded.boats).toHaveLength(100);
        expect(elapsed).toBeLessThan(1000);
    });
});

describe('Integration: Edge Cases', () => {
    test('should handle boat with all null values', () => {
        const emptyBoat = {
            boatName: 'SSN-000',
            boatFullName: 'Empty Boat',
            isic: 'COMSUBRON 1',
            tycom: 'CSL',
            isNmci: false,
            essNiprBreakfix: null,
            essSiprBreakfix: null,
            vramNiprScanDate: null,
            vramSiprScanDate: null,
            vramNiprRaVph: null,
            vramSiprRaVph: null,
            essNiprProductCompliance: null,
            essSiprProductCompliance: null,
            essNiprTruePolicy: null,
            essSiprTruePolicy: null,
            tamPastDue: null,
            vramNiprAssets: null,
            vramSiprAssets: null
        };

        // Should handle gracefully (no VRAM = HIGH)
        const result = calculateRisk(emptyBoat, defaultThresholds);
        expect(result.level).toBe('HIGH');
        expect(result.reasons).toContain('No VRAM data');
    });

    test('should handle mixed risk fleet in aggregation', () => {
        const fleet = [
            createHealthyBoat({ boatName: 'SSN-001', isic: 'CSS-1', tycom: 'CSL', riskLevel: 'LOW' }),
            createHealthyBoat({ boatName: 'SSN-002', isic: 'CSS-1', tycom: 'CSL', riskLevel: 'MED' }),
            createHealthyBoat({ boatName: 'SSN-003', isic: 'CSS-1', tycom: 'CSL', riskLevel: 'HIGH' })
        ];

        const boatsWithRisk = calculateAllRisks(fleet, defaultThresholds);
        const stats = calculateStats(boatsWithRisk);

        // Stats should reflect actual calculated risks (not the pre-set ones)
        expect(stats.totalBoats).toBe(3);
    });
});
