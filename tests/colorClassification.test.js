/**
 * RiskDash Color Classification Tests
 * Tests for color classification functions with boundary condition testing
 *
 * BOUNDARY BEHAVIOR: "Boundary Gets Better Color"
 * Values exactly on a threshold boundary are assigned the better/healthier color
 */

const {
    prodCompClass,
    policyCompClass,
    policyRawClass,
    vphClass,
    scanAgeClass,
    hqProdClass,
    hqPolicyClass,
    hqPolicyRawClass,
    breakfixClass
} = require('../src/colorClassification');
const { defaultThresholds } = require('../src/thresholds');

describe('prodCompClass - Product Compliance', () => {
    // Default thresholds: color_product_green: 95, color_product_red: 90

    describe('Basic classification', () => {
        test('should return risk-low (green) for values >= green threshold', () => {
            expect(prodCompClass(95)).toBe('risk-low');
            expect(prodCompClass(98)).toBe('risk-low');
            expect(prodCompClass(100)).toBe('risk-low');
        });

        test('should return risk-high (red) for values < red threshold', () => {
            expect(prodCompClass(89)).toBe('risk-high');
            expect(prodCompClass(85)).toBe('risk-high');
            expect(prodCompClass(0)).toBe('risk-high');
        });

        test('should return risk-med (yellow) for values between thresholds', () => {
            expect(prodCompClass(90)).toBe('risk-med');
            expect(prodCompClass(92)).toBe('risk-med');
            expect(prodCompClass(94.9)).toBe('risk-med');
        });
    });

    describe('Boundary conditions (Boundary Gets Better Color)', () => {
        test('should return green at exactly green threshold', () => {
            expect(prodCompClass(95)).toBe('risk-low');
        });

        test('should return yellow at exactly red threshold (not red)', () => {
            expect(prodCompClass(90)).toBe('risk-med');
        });

        test('should return red just below red threshold', () => {
            expect(prodCompClass(89.999)).toBe('risk-high');
        });

        test('should return yellow just below green threshold', () => {
            expect(prodCompClass(94.999)).toBe('risk-med');
        });
    });

    describe('Custom thresholds', () => {
        test('should respect custom thresholds', () => {
            const customThresholds = {
                color_product_green: 98,
                color_product_red: 95
            };
            expect(prodCompClass(98, customThresholds)).toBe('risk-low');
            expect(prodCompClass(97, customThresholds)).toBe('risk-med');
            expect(prodCompClass(94, customThresholds)).toBe('risk-high');
        });
    });

    describe('Null/undefined handling', () => {
        test('should return empty string for null', () => {
            expect(prodCompClass(null)).toBe('');
        });

        test('should return empty string for undefined', () => {
            expect(prodCompClass(undefined)).toBe('');
        });
    });
});

describe('vphClass - Vulnerabilities Per Host', () => {
    // Default thresholds: color_vph_green: 2.5, color_vph_red: 3.5
    // Lower is better for VPH

    describe('Basic classification', () => {
        test('should return risk-low (green) for values <= green threshold', () => {
            expect(vphClass(2.5)).toBe('risk-low');
            expect(vphClass(2.0)).toBe('risk-low');
            expect(vphClass(0)).toBe('risk-low');
        });

        test('should return risk-high (red) for values > red threshold', () => {
            expect(vphClass(3.6)).toBe('risk-high');
            expect(vphClass(5.0)).toBe('risk-high');
            expect(vphClass(10)).toBe('risk-high');
        });

        test('should return risk-med (yellow) for values between thresholds', () => {
            expect(vphClass(2.6)).toBe('risk-med');
            expect(vphClass(3.0)).toBe('risk-med');
            expect(vphClass(3.5)).toBe('risk-med');
        });
    });

    describe('Boundary conditions (Boundary Gets Better Color)', () => {
        test('should return green at exactly green threshold (lower is better)', () => {
            expect(vphClass(2.5)).toBe('risk-low');
        });

        test('should return yellow at exactly red threshold (not red)', () => {
            expect(vphClass(3.5)).toBe('risk-med');
        });

        test('should return red just above red threshold', () => {
            expect(vphClass(3.501)).toBe('risk-high');
        });

        test('should return yellow just above green threshold', () => {
            expect(vphClass(2.501)).toBe('risk-med');
        });
    });

    describe('Custom thresholds', () => {
        test('should respect custom thresholds', () => {
            const customThresholds = {
                color_vph_green: 1.0,
                color_vph_red: 2.0
            };
            expect(vphClass(1.0, customThresholds)).toBe('risk-low');
            expect(vphClass(1.5, customThresholds)).toBe('risk-med');
            expect(vphClass(2.1, customThresholds)).toBe('risk-high');
        });
    });

    describe('Null/undefined handling', () => {
        test('should return empty string for null', () => {
            expect(vphClass(null)).toBe('');
        });

        test('should return empty string for undefined', () => {
            expect(vphClass(undefined)).toBe('');
        });
    });
});

describe('scanAgeClass - Scan Age', () => {
    // Default thresholds: color_scan_green: 14, color_scan_red: 14
    // Lower is better for scan age

    describe('Basic classification', () => {
        test('should return risk-low (green) for recent dates', () => {
            const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
            expect(scanAgeClass(recent)).toBe('risk-low');
        });

        test('should return risk-high (red) for old dates', () => {
            const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
            expect(scanAgeClass(old)).toBe('risk-high');
        });

        test('should return risk-low for today', () => {
            const today = new Date().toISOString();
            expect(scanAgeClass(today)).toBe('risk-low');
        });
    });

    describe('Boundary conditions', () => {
        test('should return green at exactly green threshold (14 days)', () => {
            const exactly14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            expect(scanAgeClass(exactly14)).toBe('risk-low');
        });

        test('should return red just above red threshold (15 days)', () => {
            const exactly15 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
            expect(scanAgeClass(exactly15)).toBe('risk-high');
        });
    });

    describe('Invalid date handling', () => {
        test('should return risk-high for null', () => {
            expect(scanAgeClass(null)).toBe('risk-high');
        });

        test('should return risk-high for undefined', () => {
            expect(scanAgeClass(undefined)).toBe('risk-high');
        });

        test('should return risk-high for invalid date string', () => {
            expect(scanAgeClass('not a date')).toBe('risk-high');
        });

        test('should return risk-high for invalid Date object', () => {
            expect(scanAgeClass(new Date('invalid'))).toBe('risk-high');
        });
    });

    describe('Custom thresholds', () => {
        test('should respect custom thresholds', () => {
            const customThresholds = {
                color_scan_green: 7,
                color_scan_red: 14
            };
            const day5 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
            const day10 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
            const day20 = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

            expect(scanAgeClass(day5, customThresholds)).toBe('risk-low');
            expect(scanAgeClass(day10, customThresholds)).toBe('risk-med');
            expect(scanAgeClass(day20, customThresholds)).toBe('risk-high');
        });
    });
});

describe('policyCompClass - Policy Compliance / True Policy', () => {
    // Default thresholds: color_policy_green: 95, color_policy_red: 90

    describe('Basic classification', () => {
        test('should return risk-low (green) for values >= green threshold', () => {
            expect(policyCompClass(95)).toBe('risk-low');
            expect(policyCompClass(100)).toBe('risk-low');
        });

        test('should return risk-high (red) for values < red threshold', () => {
            expect(policyCompClass(89)).toBe('risk-high');
        });

        test('should return risk-med (yellow) for values between', () => {
            expect(policyCompClass(92)).toBe('risk-med');
        });
    });

    describe('Null handling', () => {
        test('should return empty string for null', () => {
            expect(policyCompClass(null)).toBe('');
        });
    });
});

describe('policyRawClass - Policy Enforced Raw', () => {
    // Default thresholds: color_policy_raw_green: 95, color_policy_raw_red: 90

    describe('Basic classification', () => {
        test('should follow same logic as policy compliance', () => {
            expect(policyRawClass(95)).toBe('risk-low');
            expect(policyRawClass(92)).toBe('risk-med');
            expect(policyRawClass(89)).toBe('risk-high');
        });
    });
});

describe('HQ Status Color Classes', () => {
    // HQ uses separate thresholds: hq_color_product_green, etc.

    describe('hqProdClass', () => {
        test('should use HQ-specific thresholds', () => {
            const customThresholds = {
                hq_color_product_green: 98,
                hq_color_product_red: 95
            };
            expect(hqProdClass(98, customThresholds)).toBe('risk-low');
            expect(hqProdClass(97, customThresholds)).toBe('risk-med');
            expect(hqProdClass(94, customThresholds)).toBe('risk-high');
        });

        test('should use defaults if HQ thresholds not set', () => {
            expect(hqProdClass(95)).toBe('risk-low');
            expect(hqProdClass(92)).toBe('risk-med');
            expect(hqProdClass(89)).toBe('risk-high');
        });
    });

    describe('hqPolicyClass', () => {
        test('should use HQ-specific policy thresholds', () => {
            expect(hqPolicyClass(95)).toBe('risk-low');
            expect(hqPolicyClass(92)).toBe('risk-med');
            expect(hqPolicyClass(89)).toBe('risk-high');
        });
    });

    describe('hqPolicyRawClass', () => {
        test('should use HQ-specific raw policy thresholds', () => {
            expect(hqPolicyRawClass(95)).toBe('risk-low');
            expect(hqPolicyRawClass(92)).toBe('risk-med');
            expect(hqPolicyRawClass(89)).toBe('risk-high');
        });
    });
});

describe('breakfixClass', () => {
    test('should return risk-high for any value > 0', () => {
        expect(breakfixClass(1)).toBe('risk-high');
        expect(breakfixClass(5)).toBe('risk-high');
        expect(breakfixClass(100)).toBe('risk-high');
    });

    test('should return empty string for 0', () => {
        expect(breakfixClass(0)).toBe('');
    });

    test('should return empty string for null/undefined', () => {
        expect(breakfixClass(null)).toBe('');
        expect(breakfixClass(undefined)).toBe('');
    });
});

// Fuzz tests for color classification
describe('Fuzz Tests - Color Classification', () => {
    const fuzzValues = [
        // Extreme numbers
        Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER,
        -Number.MAX_SAFE_INTEGER, -1, -100,
        // Special values
        NaN, Infinity, -Infinity,
        // Edge percentages
        0, 100, 100.1, -0.1,
        // Decimal precision
        94.9999999999, 95.0000000001,
        // Invalid types (handled by null check)
        null, undefined
    ];

    describe('prodCompClass fuzzing', () => {
        test.each(fuzzValues)('should not throw for value: %p', (value) => {
            expect(() => prodCompClass(value)).not.toThrow();
        });
    });

    describe('vphClass fuzzing', () => {
        test.each(fuzzValues)('should not throw for value: %p', (value) => {
            expect(() => vphClass(value)).not.toThrow();
        });
    });

    describe('scanAgeClass fuzzing', () => {
        const dateFuzzValues = [
            null, undefined, '', 'not a date',
            new Date('invalid'), new Date(0), new Date(-1),
            new Date(Date.now() + 1000000000000), // Far future
            '0000-01-01', '9999-12-31',
            0, -1, Infinity
        ];

        test.each(dateFuzzValues)('should not throw for date value: %p', (value) => {
            expect(() => scanAgeClass(value)).not.toThrow();
        });
    });
});

// Property-based tests
describe('Property Tests - Color Classification', () => {
    describe('Compliance metrics (higher is better)', () => {
        test('higher values should never result in worse color', () => {
            const colorOrder = { '': -1, 'risk-low': 0, 'risk-med': 1, 'risk-high': 2 };

            for (let i = 0; i <= 100; i += 5) {
                const lowerClass = prodCompClass(i);
                const higherClass = prodCompClass(i + 5);
                expect(colorOrder[higherClass]).toBeLessThanOrEqual(colorOrder[lowerClass]);
            }
        });
    });

    describe('VPH metrics (lower is better)', () => {
        test('lower values should never result in worse color', () => {
            const colorOrder = { '': -1, 'risk-low': 0, 'risk-med': 1, 'risk-high': 2 };

            for (let i = 0; i <= 10; i += 0.5) {
                const lowerClass = vphClass(i);
                const higherClass = vphClass(i + 0.5);
                expect(colorOrder[lowerClass]).toBeLessThanOrEqual(colorOrder[higherClass]);
            }
        });
    });

    describe('Threshold adjustments', () => {
        test('relaxing thresholds should not make colors worse', () => {
            const strictThresholds = {
                color_product_green: 98,
                color_product_red: 95
            };
            const relaxedThresholds = {
                color_product_green: 90,
                color_product_red: 85
            };
            const colorOrder = { '': -1, 'risk-low': 0, 'risk-med': 1, 'risk-high': 2 };

            // Test a range of values
            for (let i = 80; i <= 100; i += 2) {
                const strictClass = prodCompClass(i, strictThresholds);
                const relaxedClass = prodCompClass(i, relaxedThresholds);
                expect(colorOrder[relaxedClass]).toBeLessThanOrEqual(colorOrder[strictClass]);
            }
        });
    });
});
