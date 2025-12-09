/**
 * RiskDash Aggregation Function Tests
 * Tests for aggregating boat data by ISIC and TYCOM
 */

const { aggregateByISIC, calculateStats, groupBoatsBy } = require('../src/aggregation');
const { createHealthyBoat, createBreakfixBoat, createNmciBoat } = require('../src/dataModels');

describe('aggregateByISIC', () => {
    describe('Basic grouping', () => {
        test('should group boats by ISIC', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 2', tycom: 'CSL', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl).toHaveLength(2);
            expect(result.csl.find(a => a.isicName === 'COMSUBRON 1').boatCount).toBe(2);
            expect(result.csl.find(a => a.isicName === 'COMSUBRON 2').boatCount).toBe(1);
        });

        test('should separate CSL and CSP', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSBN-726', isic: 'COMSUBRON 17', tycom: 'CSP', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl).toHaveLength(1);
            expect(result.csp).toHaveLength(1);
            expect(result.csl[0].tycom).toBe('CSL');
            expect(result.csp[0].tycom).toBe('CSP');
        });
    });

    describe('Risk count aggregation', () => {
        test('should count HIGH risk boats', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'HIGH' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'HIGH' }),
                createHealthyBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].highRiskCount).toBe(2);
        });

        test('should count MED risk boats', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'MED' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'MED' }),
                createHealthyBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].medRiskCount).toBe(2);
            expect(result.csl[0].lowRiskCount).toBe(1);
        });
    });

    describe('Breakfix aggregation', () => {
        test('should sum NIPR breakfix', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprBreakfix: 2, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprBreakfix: 3, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprBreakfixSum).toBe(5);
        });

        test('should sum SIPR breakfix', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essSiprBreakfix: 1, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essSiprBreakfix: 4, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].siprBreakfixSum).toBe(5);
        });

        test('should skip NIPR breakfix for NMCI boats', () => {
            const boats = [
                createNmciBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprBreakfix: 10, essSiprBreakfix: 2, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprBreakfix: 3, essSiprBreakfix: 1, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            // NMCI boat NIPR breakfix should not be counted
            expect(result.csl[0].niprBreakfixSum).toBe(3); // Only non-NMCI boat
            expect(result.csl[0].siprBreakfixSum).toBe(3); // Both boats
        });
    });

    describe('Compliance averaging', () => {
        test('should average NIPR product compliance', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 90, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 100, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprProdCompAvg).toBe(95);
        });

        test('should average SIPR product compliance', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essSiprProductCompliance: 80, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essSiprProductCompliance: 100, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].siprProdCompAvg).toBe(90);
        });

        test('should skip NIPR compliance for NMCI boats in average', () => {
            const boats = [
                createNmciBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 50, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 100, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            // Only non-NMCI boat should be counted
            expect(result.csl[0].niprProdCompAvg).toBe(100);
        });

        test('should cap averages at 100%', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 105, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: 105, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprProdCompAvg).toBe(100);
        });

        test('should return 0 for empty compliance data', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprProductCompliance: null, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprProdCompAvg).toBe(0);
        });
    });

    describe('Policy averaging', () => {
        test('should average True Policy compliance', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprTruePolicy: 90, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprTruePolicy: 100, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprPolEnfAvg).toBe(95);
        });

        test('should average Raw Policy compliance', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprPolicyEnforced: 85, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', essNiprPolicyEnforced: 95, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].niprPolRawAvg).toBe(90);
        });
    });

    describe('Scan exempt counting', () => {
        test('should count scan exempt boats', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', vramNiprScanExempt: true, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1', tycom: 'CSL', vramSiprScanExempt: true, riskLevel: 'LOW' }),
                createHealthyBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 1', tycom: 'CSL', vramNiprScanExempt: false, vramSiprScanExempt: false, riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].scanExemptCount).toBe(2);
        });
    });

    describe('Settings integration', () => {
        test('should use ISIC info from settings when available', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' })
            ];
            const settings = {
                isics: [{ isic_name: 'COMSUBRON 1', isic_short: 'CSS-1', tycom: 'CSL' }]
            };

            const result = aggregateByISIC(boats, settings);

            expect(result.csl[0].isicShort).toBe('CSS-1');
        });

        test('should use default ISIC info when not in settings', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'UNKNOWN ISIC', tycom: 'CSL', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats, { isics: [] });

            expect(result.csl[0].isicName).toBe('UNKNOWN ISIC');
            expect(result.csl[0].isicShort).toBe('UNKNOW'); // First 6 chars
        });
    });

    describe('Empty input handling', () => {
        test('should handle empty boats array', () => {
            const result = aggregateByISIC([], { isics: [] });

            expect(result.csl).toHaveLength(0);
            expect(result.csp).toHaveLength(0);
        });

        test('should handle missing settings', () => {
            const boats = [
                createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1', tycom: 'CSL', riskLevel: 'LOW' })
            ];

            const result = aggregateByISIC(boats);

            expect(result.csl).toHaveLength(1);
        });
    });
});

describe('calculateStats', () => {
    describe('Risk counting', () => {
        test('should count risk levels correctly', () => {
            const boats = [
                createHealthyBoat({ riskLevel: 'HIGH' }),
                createHealthyBoat({ riskLevel: 'HIGH' }),
                createHealthyBoat({ riskLevel: 'MED' }),
                createHealthyBoat({ riskLevel: 'LOW' }),
                createHealthyBoat({ riskLevel: 'LOW' }),
                createHealthyBoat({ riskLevel: 'LOW' })
            ];

            const stats = calculateStats(boats);

            expect(stats.totalBoats).toBe(6);
            expect(stats.highRiskCount).toBe(2);
            expect(stats.medRiskCount).toBe(1);
            expect(stats.lowRiskCount).toBe(3);
        });
    });

    describe('Breakfix totaling', () => {
        test('should sum all breakfix values', () => {
            const boats = [
                createHealthyBoat({ essNiprBreakfix: 2, essSiprBreakfix: 1 }),
                createHealthyBoat({ essNiprBreakfix: 3, essSiprBreakfix: 2 })
            ];

            const stats = calculateStats(boats);

            expect(stats.totalBreakfix).toBe(8); // 2+1+3+2
        });

        test('should skip NIPR breakfix for NMCI boats', () => {
            const boats = [
                createNmciBoat({ essNiprBreakfix: 100, essSiprBreakfix: 5 }),
                createHealthyBoat({ essNiprBreakfix: 2, essSiprBreakfix: 3 })
            ];

            const stats = calculateStats(boats);

            expect(stats.totalBreakfix).toBe(10); // 0+5+2+3 (NMCI NIPR ignored)
        });
    });

    describe('VPH averaging', () => {
        test('should average VPH values', () => {
            const boats = [
                createHealthyBoat({ vramNiprRaVph: 2.0, vramSiprRaVph: 3.0 }),
                createHealthyBoat({ vramNiprRaVph: 4.0, vramSiprRaVph: 5.0 })
            ];

            const stats = calculateStats(boats);

            expect(stats.avgVph).toBe(3.5); // (2+3+4+5)/4
        });

        test('should skip NIPR VPH for NMCI boats', () => {
            const boats = [
                createNmciBoat({ vramNiprRaVph: 100, vramSiprRaVph: 2.0 }),
                createHealthyBoat({ vramNiprRaVph: 4.0, vramSiprRaVph: 6.0 })
            ];

            const stats = calculateStats(boats);

            expect(stats.avgVph).toBe(4); // (2+4+6)/3 (NMCI NIPR ignored)
        });

        test('should handle null VPH values', () => {
            const boats = [
                createHealthyBoat({ vramNiprRaVph: null, vramSiprRaVph: 2.0 }),
                createHealthyBoat({ vramNiprRaVph: 4.0, vramSiprRaVph: null })
            ];

            const stats = calculateStats(boats);

            expect(stats.avgVph).toBe(3); // (2+4)/2
        });
    });

    describe('Compliance averaging', () => {
        test('should average compliance values', () => {
            const boats = [
                createHealthyBoat({ essNiprProductCompliance: 90, essSiprProductCompliance: 100 }),
                createHealthyBoat({ essNiprProductCompliance: 80, essSiprProductCompliance: 90 })
            ];

            const stats = calculateStats(boats);

            expect(stats.avgCompliance).toBe(90); // (90+100+80+90)/4
        });

        test('should cap compliance at 100%', () => {
            const boats = [
                createHealthyBoat({ essNiprProductCompliance: 110, essSiprProductCompliance: 110 })
            ];

            const stats = calculateStats(boats);

            expect(stats.avgCompliance).toBe(100);
        });
    });

    describe('Scan exempt counting', () => {
        test('should count scan exempt boats', () => {
            const boats = [
                createHealthyBoat({ vramNiprScanExempt: true }),
                createHealthyBoat({ vramSiprScanExempt: true }),
                createHealthyBoat({ vramNiprScanExempt: false, vramSiprScanExempt: false })
            ];

            const stats = calculateStats(boats);

            expect(stats.scanExemptCount).toBe(2);
        });
    });

    describe('Empty input handling', () => {
        test('should handle empty boats array', () => {
            const stats = calculateStats([]);

            expect(stats.totalBoats).toBe(0);
            expect(stats.avgVph).toBe(0);
            expect(stats.avgCompliance).toBe(0);
        });
    });
});

describe('groupBoatsBy', () => {
    test('should group by ISIC', () => {
        const boats = [
            createHealthyBoat({ boatName: 'SSN-001', isic: 'COMSUBRON 1' }),
            createHealthyBoat({ boatName: 'SSN-002', isic: 'COMSUBRON 1' }),
            createHealthyBoat({ boatName: 'SSN-003', isic: 'COMSUBRON 2' })
        ];

        const groups = groupBoatsBy(boats, 'isic');

        expect(Object.keys(groups)).toHaveLength(2);
        expect(groups['COMSUBRON 1']).toHaveLength(2);
        expect(groups['COMSUBRON 2']).toHaveLength(1);
    });

    test('should group by tycom', () => {
        const boats = [
            createHealthyBoat({ boatName: 'SSN-001', tycom: 'CSL' }),
            createHealthyBoat({ boatName: 'SSN-002', tycom: 'CSL' }),
            createHealthyBoat({ boatName: 'SSBN-726', tycom: 'CSP' })
        ];

        const groups = groupBoatsBy(boats, 'tycom');

        expect(groups['CSL']).toHaveLength(2);
        expect(groups['CSP']).toHaveLength(1);
    });

    test('should group by riskLevel', () => {
        const boats = [
            createHealthyBoat({ riskLevel: 'HIGH' }),
            createHealthyBoat({ riskLevel: 'MED' }),
            createHealthyBoat({ riskLevel: 'LOW' }),
            createHealthyBoat({ riskLevel: 'LOW' })
        ];

        const groups = groupBoatsBy(boats, 'riskLevel');

        expect(groups['HIGH']).toHaveLength(1);
        expect(groups['MED']).toHaveLength(1);
        expect(groups['LOW']).toHaveLength(2);
    });

    test('should use "Unknown" for null/undefined field values', () => {
        const boats = [
            createHealthyBoat({ customField: null }),
            createHealthyBoat({ customField: undefined })
        ];

        const groups = groupBoatsBy(boats, 'customField');

        expect(groups['Unknown']).toHaveLength(2);
    });

    test('should handle empty boats array', () => {
        const groups = groupBoatsBy([], 'isic');

        expect(Object.keys(groups)).toHaveLength(0);
    });
});
