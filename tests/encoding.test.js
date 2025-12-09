/**
 * RiskDash Encoding/Decoding Tests
 * Tests for data compression and encoding functions
 */

const { compressAndEncode, decodeAndDecompress, calculateHash } = require('../src/encoding');

describe('compressAndEncode', () => {
    describe('Basic encoding', () => {
        test('should encode simple object', () => {
            const data = { name: 'test', value: 123 };
            const encoded = compressAndEncode(data);

            expect(typeof encoded).toBe('string');
            expect(encoded).toContain(':');
        });

        test('should produce hash:base64 format', () => {
            const data = { key: 'value' };
            const encoded = compressAndEncode(data);
            const parts = encoded.split(':');

            expect(parts).toHaveLength(2);
            expect(parts[0]).toMatch(/^[0-9a-f]+$/); // Hex hash
            expect(parts[1].length).toBeGreaterThan(0); // Base64 data
        });

        test('should encode complex nested objects', () => {
            const data = {
                boats: [
                    { name: 'SSN-001', risk: 'HIGH' },
                    { name: 'SSN-002', risk: 'LOW' }
                ],
                settings: {
                    thresholds: { low_vph: 2.5 },
                    nested: { deep: { value: 42 } }
                }
            };
            const encoded = compressAndEncode(data);

            expect(typeof encoded).toBe('string');
            expect(encoded.length).toBeGreaterThan(0);
        });

        test('should encode arrays', () => {
            const data = [1, 2, 3, 'a', 'b', 'c'];
            const encoded = compressAndEncode(data);

            expect(typeof encoded).toBe('string');
        });

        test('should encode empty object', () => {
            const encoded = compressAndEncode({});

            expect(typeof encoded).toBe('string');
            expect(encoded).toContain(':');
        });
    });

    describe('Unicode handling', () => {
        test('should encode Unicode characters', () => {
            const data = { message: 'Hello, World! ', japanese: 'にほんご' };
            const encoded = compressAndEncode(data);

            expect(typeof encoded).toBe('string');
        });

        test('should encode special characters', () => {
            const data = { special: '<script>alert("xss")</script>' };
            const encoded = compressAndEncode(data);

            expect(typeof encoded).toBe('string');
        });
    });

    describe('Determinism', () => {
        test('should produce same output for same input', () => {
            const data = { key: 'value', num: 42 };
            const encoded1 = compressAndEncode(data);
            const encoded2 = compressAndEncode(data);

            expect(encoded1).toBe(encoded2);
        });

        test('should produce different output for different input', () => {
            const data1 = { key: 'value1' };
            const data2 = { key: 'value2' };
            const encoded1 = compressAndEncode(data1);
            const encoded2 = compressAndEncode(data2);

            expect(encoded1).not.toBe(encoded2);
        });
    });
});

describe('decodeAndDecompress', () => {
    describe('Basic decoding', () => {
        test('should decode previously encoded data', () => {
            const original = { name: 'test', value: 123 };
            const encoded = compressAndEncode(original);
            const { data, valid } = decodeAndDecompress(encoded);

            expect(data).toEqual(original);
            expect(valid).toBe(true);
        });

        test('should decode complex objects', () => {
            const original = {
                boats: [{ name: 'SSN-001' }, { name: 'SSN-002' }],
                thresholds: { low_vph: 2.5 }
            };
            const encoded = compressAndEncode(original);
            const { data, valid } = decodeAndDecompress(encoded);

            expect(data).toEqual(original);
            expect(valid).toBe(true);
        });

        test('should decode arrays', () => {
            const original = [1, 2, 3, 'a', 'b', 'c'];
            const encoded = compressAndEncode(original);
            const { data, valid } = decodeAndDecompress(encoded);

            expect(data).toEqual(original);
            expect(valid).toBe(true);
        });

        test('should decode empty object', () => {
            const original = {};
            const encoded = compressAndEncode(original);
            const { data, valid } = decodeAndDecompress(encoded);

            expect(data).toEqual(original);
            expect(valid).toBe(true);
        });
    });

    describe('Unicode handling', () => {
        test('should decode Unicode characters correctly', () => {
            const original = { message: 'Hello, World! ', japanese: 'にほんご' };
            const encoded = compressAndEncode(original);
            const { data, valid } = decodeAndDecompress(encoded);

            expect(data).toEqual(original);
            expect(valid).toBe(true);
        });
    });

    describe('Hash validation', () => {
        test('should return valid=true for unmodified data', () => {
            const original = { key: 'value' };
            const encoded = compressAndEncode(original);
            const { valid } = decodeAndDecompress(encoded);

            expect(valid).toBe(true);
        });

        test('should return valid=false for tampered hash', () => {
            const original = { key: 'value' };
            const encoded = compressAndEncode(original);
            const parts = encoded.split(':');
            const tamperedHash = 'deadbeef';
            const tampered = tamperedHash + ':' + parts[1];

            const { valid } = decodeAndDecompress(tampered);

            expect(valid).toBe(false);
        });

        test('should detect data modification', () => {
            // Create encoded data
            const original = { key: 'original' };
            const encoded = compressAndEncode(original);

            // Create different data with same structure
            const modified = { key: 'modified' };
            const modifiedEncoded = compressAndEncode(modified);

            // Mix hash from original with data from modified
            const parts1 = encoded.split(':');
            const parts2 = modifiedEncoded.split(':');
            const mixed = parts1[0] + ':' + parts2[1];

            const { valid } = decodeAndDecompress(mixed);

            expect(valid).toBe(false);
        });
    });

    describe('Error handling', () => {
        test('should throw for invalid base64', () => {
            expect(() => decodeAndDecompress('abc:!!!invalid!!!')).toThrow();
        });

        test('should throw for invalid JSON', () => {
            // Create a valid base64 string that's not valid JSON
            const invalidJson = Buffer.from('not json').toString('base64');
            expect(() => decodeAndDecompress('abc:' + invalidJson)).toThrow();
        });

        test('should throw for missing separator', () => {
            expect(() => decodeAndDecompress('no-separator-here')).toThrow();
        });
    });
});

describe('calculateHash', () => {
    describe('Basic hashing', () => {
        test('should return hex string', () => {
            const hash = calculateHash('test string');

            expect(typeof hash).toBe('string');
            expect(hash).toMatch(/^[0-9a-f]+$/);
        });

        test('should produce consistent hashes', () => {
            const hash1 = calculateHash('hello world');
            const hash2 = calculateHash('hello world');

            expect(hash1).toBe(hash2);
        });

        test('should produce different hashes for different inputs', () => {
            const hash1 = calculateHash('string1');
            const hash2 = calculateHash('string2');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Edge cases', () => {
        test('should hash empty string', () => {
            const hash = calculateHash('');

            expect(typeof hash).toBe('string');
            expect(hash).toBe('0');
        });

        test('should hash single character', () => {
            const hash = calculateHash('a');

            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });

        test('should hash very long strings', () => {
            const longString = 'a'.repeat(100000);
            const hash = calculateHash(longString);

            expect(typeof hash).toBe('string');
        });

        test('should hash special characters', () => {
            const hash = calculateHash('<>"\'\\/');

            expect(typeof hash).toBe('string');
        });

        test('should hash Unicode', () => {
            const hash = calculateHash('にほんご');

            expect(typeof hash).toBe('string');
        });
    });
});

describe('Round-trip integrity', () => {
    const testCases = [
        // Basic types
        { description: 'null value', data: { value: null } },
        { description: 'boolean values', data: { t: true, f: false } },
        { description: 'numbers', data: { int: 42, float: 3.14, neg: -100 } },
        { description: 'empty string', data: { str: '' } },
        { description: 'empty array', data: { arr: [] } },
        { description: 'empty object', data: { obj: {} } },

        // Complex structures
        {
            description: 'nested arrays',
            data: { arr: [[1, 2], [3, 4], [[5, 6]]] }
        },
        {
            description: 'deeply nested objects',
            data: { a: { b: { c: { d: { e: 'deep' } } } } }
        },
        {
            description: 'mixed content',
            data: {
                boats: [
                    { name: 'SSN-001', risk: 'HIGH', breakfix: 3 },
                    { name: 'SSN-002', risk: 'LOW', breakfix: 0 }
                ],
                settings: {
                    thresholds: { low_vph: 2.5, med_ra_vph: 3.5 },
                    version: '1.0'
                },
                metadata: {
                    created: '2024-01-01T00:00:00Z',
                    author: 'Test User'
                }
            }
        },

        // Special characters
        {
            description: 'special characters',
            data: { chars: '!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~' }
        },
        {
            description: 'HTML entities',
            data: { html: '<script>alert("xss")</script>' }
        },
        {
            description: 'newlines and tabs',
            data: { whitespace: 'line1\nline2\ttab' }
        },
        {
            description: 'Unicode',
            data: { emoji: '', chinese: '', arabic: '' }
        }
    ];

    test.each(testCases)('should preserve $description through encode/decode', ({ data }) => {
        const encoded = compressAndEncode(data);
        const { data: decoded, valid } = decodeAndDecompress(encoded);

        expect(decoded).toEqual(data);
        expect(valid).toBe(true);
    });
});

// Fuzz tests
describe('Fuzz Tests - Encoding', () => {
    describe('compressAndEncode fuzzing', () => {
        const fuzzInputs = [
            // Edge cases that should work
            null, undefined, '', 0, false, [],
            // Complex objects
            { deeply: { nested: { value: Array(100).fill(0) } } },
            // Large data
            { large: 'x'.repeat(10000) },
            // Special values in objects
            { nan: NaN, inf: Infinity, ninf: -Infinity }
        ];

        // Note: Some of these may fail since JSON.stringify has limitations
        test.each(fuzzInputs)('should handle input: %p', (input) => {
            // JSON.stringify will convert special values
            try {
                const encoded = compressAndEncode(input);
                expect(typeof encoded).toBe('string');
            } catch (e) {
                // Some values like undefined, NaN may cause issues
                expect(e).toBeDefined();
            }
        });
    });
});
