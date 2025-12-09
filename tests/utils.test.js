/**
 * RiskDash Utility Functions Tests
 * Tests for normalizeBoatName, parseNumber, parsePercent, and other utilities
 */

const {
    normalizeBoatName,
    parseNumber,
    parsePercent,
    scanAge,
    fmt,
    fmtPct,
    fmtDate
} = require('../src/utils');

describe('normalizeBoatName', () => {
    describe('Standard boat name formats', () => {
        test('should normalize SSN-XXX format', () => {
            expect(normalizeBoatName('SSN-123')).toBe('SSN-123');
            expect(normalizeBoatName('ssn-123')).toBe('SSN-123');
            expect(normalizeBoatName('Ssn-123')).toBe('SSN-123');
        });

        test('should normalize SSBN-XXX format', () => {
            expect(normalizeBoatName('SSBN-726')).toBe('SSBN-726');
            expect(normalizeBoatName('ssbn726')).toBe('SSBN-726');
        });

        test('should normalize SSGN-XXX format', () => {
            expect(normalizeBoatName('SSGN-727')).toBe('SSGN-727');
            expect(normalizeBoatName('ssgn 727')).toBe('SSGN-727');
        });
    });

    describe('Variations with spaces and dashes', () => {
        test('should handle names without dash', () => {
            expect(normalizeBoatName('SSN123')).toBe('SSN-123');
            expect(normalizeBoatName('SSBN726')).toBe('SSBN-726');
        });

        test('should handle names with spaces', () => {
            expect(normalizeBoatName('SSN 123')).toBe('SSN-123');
            expect(normalizeBoatName('SSN  123')).toBe('SSN-123');
        });

        test('should handle names with extra whitespace', () => {
            expect(normalizeBoatName('  SSN-123  ')).toBe('SSN-123');
            expect(normalizeBoatName('\tSSN-123\n')).toBe('SSN-123');
        });

        test('should handle mixed case and spacing', () => {
            expect(normalizeBoatName('sSn - 123')).toBe('SSN-123');
        });
    });

    describe('Full boat names with USS prefix', () => {
        test('should extract boat code from full names', () => {
            expect(normalizeBoatName('USS Enterprise SSN-123')).toBe('SSN-123');
            expect(normalizeBoatName('USS Montana SSBN-790')).toBe('SSBN-790');
        });

        test('should handle hull number in name', () => {
            expect(normalizeBoatName('SSN 781 USS DELAWARE')).toBe('SSN-781');
        });
    });

    describe('Edge cases and invalid inputs', () => {
        test('should return empty string for null/undefined', () => {
            expect(normalizeBoatName(null)).toBe('');
            expect(normalizeBoatName(undefined)).toBe('');
        });

        test('should return empty string for empty input', () => {
            expect(normalizeBoatName('')).toBe('');
            expect(normalizeBoatName('   ')).toBe('');
        });

        test('should return uppercased input for non-boat names', () => {
            expect(normalizeBoatName('UNKNOWN')).toBe('UNKNOWN');
            expect(normalizeBoatName('Random Ship')).toBe('RANDOM SHIP');
        });

        test('should handle numeric input', () => {
            expect(normalizeBoatName(123)).toBe('123');
        });
    });
});

describe('parseNumber', () => {
    describe('Valid numeric inputs', () => {
        test('should return number for number input', () => {
            expect(parseNumber(42)).toBe(42);
            expect(parseNumber(3.14)).toBe(3.14);
            expect(parseNumber(0)).toBe(0);
            expect(parseNumber(-5)).toBe(-5);
        });

        test('should parse numeric strings', () => {
            expect(parseNumber('42')).toBe(42);
            expect(parseNumber('3.14')).toBe(3.14);
            expect(parseNumber('-5')).toBe(-5);
        });

        test('should handle strings with whitespace', () => {
            expect(parseNumber('  42  ')).toBe(42);
            expect(parseNumber('\t3.14\n')).toBe(3.14);
        });
    });

    describe('Percentage and formatted inputs', () => {
        test('should strip percentage sign', () => {
            expect(parseNumber('95%')).toBe(95);
            expect(parseNumber('95.5%')).toBe(95.5);
        });

        test('should strip comma separators', () => {
            expect(parseNumber('1,000')).toBe(1000);
            expect(parseNumber('1,234,567')).toBe(1234567);
        });

        test('should handle combined formatting', () => {
            expect(parseNumber('95.5%')).toBe(95.5);
        });
    });

    describe('Special value handling', () => {
        test('should treat "None" as 0', () => {
            expect(parseNumber('None')).toBe(0);
            expect(parseNumber('none')).toBe(0);
            expect(parseNumber('NONE')).toBe(0);
        });
    });

    describe('Null and invalid inputs', () => {
        test('should return null for null/undefined/empty', () => {
            expect(parseNumber(null)).toBeNull();
            expect(parseNumber(undefined)).toBeNull();
            expect(parseNumber('')).toBeNull();
        });

        test('should return null for non-numeric strings', () => {
            expect(parseNumber('abc')).toBeNull();
            expect(parseNumber('not a number')).toBeNull();
        });

        test('should return null for NaN', () => {
            expect(parseNumber(NaN)).toBeNull();
        });
    });

    describe('Edge cases', () => {
        test('should handle scientific notation', () => {
            expect(parseNumber('1e5')).toBe(100000);
            expect(parseNumber('1.5e-2')).toBeCloseTo(0.015);
        });

        test('should handle Infinity', () => {
            expect(parseNumber(Infinity)).toBe(Infinity);
            expect(parseNumber(-Infinity)).toBe(-Infinity);
        });
    });
});

describe('parsePercent', () => {
    describe('Valid percentage inputs', () => {
        test('should parse percentage with symbol', () => {
            expect(parsePercent('95%')).toBe(95);
            expect(parsePercent('95.5%')).toBe(95.5);
            expect(parsePercent('100%')).toBe(100);
        });

        test('should parse percentage without symbol', () => {
            expect(parsePercent('95')).toBe(95);
            expect(parsePercent('95.5')).toBe(95.5);
        });

        test('should parse number inputs', () => {
            expect(parsePercent(95)).toBe(95);
            expect(parsePercent(95.5)).toBe(95.5);
        });
    });

    describe('Special value handling', () => {
        test('should treat "None" as 0', () => {
            expect(parsePercent('None')).toBe(0);
            expect(parsePercent('none')).toBe(0);
        });
    });

    describe('Null and invalid inputs', () => {
        test('should return null for null/undefined/empty', () => {
            expect(parsePercent(null)).toBeNull();
            expect(parsePercent(undefined)).toBeNull();
            expect(parsePercent('')).toBeNull();
        });

        test('should return null for invalid strings', () => {
            expect(parsePercent('abc%')).toBeNull();
            expect(parsePercent('invalid')).toBeNull();
        });
    });

    describe('Edge cases', () => {
        test('should handle values over 100%', () => {
            expect(parsePercent('150%')).toBe(150);
        });

        test('should handle negative percentages', () => {
            expect(parsePercent('-5%')).toBe(-5);
        });

        test('should handle decimal precision', () => {
            expect(parsePercent('95.123%')).toBeCloseTo(95.123);
        });
    });
});

describe('scanAge', () => {
    describe('Valid date inputs', () => {
        test('should calculate age for recent dates', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(scanAge(yesterday)).toBe(1);
        });

        test('should calculate age for older dates', () => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            expect(scanAge(weekAgo)).toBe(7);
        });

        test('should handle ISO string dates', () => {
            const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
            expect(scanAge(recent)).toBe(5);
        });

        test('should return 0 for today', () => {
            const today = new Date();
            expect(scanAge(today)).toBe(0);
        });
    });

    describe('Invalid date inputs', () => {
        test('should return null for null/undefined', () => {
            expect(scanAge(null)).toBeNull();
            expect(scanAge(undefined)).toBeNull();
        });

        test('should return null for invalid date strings', () => {
            expect(scanAge('not a date')).toBeNull();
            expect(scanAge('invalid')).toBeNull();
        });

        test('should return null for invalid Date objects', () => {
            expect(scanAge(new Date('invalid'))).toBeNull();
        });
    });

    describe('Edge cases', () => {
        test('should handle empty string', () => {
            expect(scanAge('')).toBeNull();
        });
    });
});

describe('fmt', () => {
    describe('Basic formatting', () => {
        test('should format integers', () => {
            expect(fmt(42)).toBe('42');
            expect(fmt(42.6)).toBe('43'); // rounds
            expect(fmt(42.4)).toBe('42'); // rounds
        });

        test('should format with decimal places', () => {
            expect(fmt(42.567, 2)).toBe('42.57');
            expect(fmt(42, 2)).toBe('42.00');
        });
    });

    describe('Null handling', () => {
        test('should return dash for null/undefined', () => {
            expect(fmt(null)).toBe('-');
            expect(fmt(undefined)).toBe('-');
        });
    });
});

describe('fmtPct', () => {
    describe('Basic formatting', () => {
        test('should format percentages', () => {
            expect(fmtPct(95)).toBe('95.0%');
            expect(fmtPct(95.5)).toBe('95.5%');
        });

        test('should cap at 100%', () => {
            expect(fmtPct(150)).toBe('100.0%');
            expect(fmtPct(100.5)).toBe('100.0%');
        });
    });

    describe('Null handling', () => {
        test('should return dash for null/undefined', () => {
            expect(fmtPct(null)).toBe('-');
            expect(fmtPct(undefined)).toBe('-');
        });
    });
});

describe('fmtDate', () => {
    describe('Basic formatting', () => {
        test('should format dates as M/D', () => {
            const date = new Date('2024-03-15T12:00:00Z');
            expect(fmtDate(date)).toMatch(/\d{1,2}\/\d{1,2}/);
        });

        test('should format ISO strings', () => {
            const iso = '2024-03-15T12:00:00Z';
            expect(fmtDate(iso)).toMatch(/\d{1,2}\/\d{1,2}/);
        });
    });

    describe('Null handling', () => {
        test('should return dash for null/undefined/empty', () => {
            expect(fmtDate(null)).toBe('-');
            expect(fmtDate(undefined)).toBe('-');
            expect(fmtDate('')).toBe('-');
        });
    });
});

// Fuzz tests for utilities
describe('Fuzz Tests - Utils', () => {
    describe('normalizeBoatName fuzzing', () => {
        const fuzzInputs = [
            // Empty/null variants
            '', '   ', '\t', '\n', null, undefined,
            // Special characters
            '!@#$%^&*()', '<script>alert(1)</script>', 'SSN-<>123',
            // Unicode
            'SSN-１２３', 'SSN-\u200B123', 'ＳＳＮ-123',
            // Very long input
            'SSN-' + '1'.repeat(1000),
            // Numeric edge cases
            0, -1, NaN, Infinity,
            // Arrays and objects
            [], {}, ['SSN-123'],
            // Boolean
            true, false
        ];

        test.each(fuzzInputs)('should not throw for input: %p', (input) => {
            expect(() => normalizeBoatName(input)).not.toThrow();
        });
    });

    describe('parseNumber fuzzing', () => {
        const fuzzInputs = [
            // Extreme numbers
            Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER,
            -Number.MAX_SAFE_INTEGER,
            // Special values
            NaN, Infinity, -Infinity,
            // Malformed strings
            '1.2.3', '..', '--1', '++1', '1e', 'e5',
            // Huge strings
            '9'.repeat(1000),
            // Special characters
            '123!', '$100', '100$',
            // Unicode numbers
            '١٢٣', '一二三'
        ];

        test.each(fuzzInputs)('should not throw for input: %p', (input) => {
            expect(() => parseNumber(input)).not.toThrow();
        });
    });

    describe('parsePercent fuzzing', () => {
        const fuzzInputs = [
            '%%%', '%100', '100%%', '--%',
            '1e100%', 'Infinity%', 'NaN%',
            '0.0000000001%', '99.99999999%'
        ];

        test.each(fuzzInputs)('should not throw for input: %p', (input) => {
            expect(() => parsePercent(input)).not.toThrow();
        });
    });

    describe('scanAge fuzzing', () => {
        const fuzzInputs = [
            // Invalid dates
            'not-a-date', '2024-13-45', '2024-02-30',
            // Edge dates
            '0000-01-01', '9999-12-31',
            // Future dates
            new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            // Very old dates
            new Date('1000-01-01'),
            // Timestamp edge cases
            0, -1, Date.now() + 1000000000000
        ];

        test.each(fuzzInputs)('should not throw for input: %p', (input) => {
            expect(() => scanAge(input)).not.toThrow();
        });
    });
});
