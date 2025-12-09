/**
 * RiskDash Encoding/Decoding Functions
 * Functions for compressing and encoding report data for embedding
 */

/**
 * Compress and encode data for embedding in HTML
 * Uses Base64 encoding with a hash prefix for integrity checking
 *
 * @param {Object} data - Data to encode
 * @returns {string} Encoded string with hash prefix (format: "hash:base64data")
 */
const compressAndEncode = (data) => {
    const json = JSON.stringify(data);

    // Base64 encode with UTF-8 support
    let b64;
    if (typeof btoa === 'function') {
        // Browser environment
        b64 = btoa(unescape(encodeURIComponent(json)));
    } else {
        // Node.js environment
        b64 = Buffer.from(json, 'utf-8').toString('base64');
    }

    // Calculate simple hash for integrity check
    let h = 0;
    for (let i = 0; i < json.length; i++) {
        h = ((h << 5) - h) + json.charCodeAt(i);
        h &= h; // Convert to 32-bit integer
    }

    return Math.abs(h).toString(16) + ':' + b64;
};

/**
 * Decode and decompress encoded data
 *
 * @param {string} str - Encoded string (format: "hash:base64data")
 * @returns {Object} { data: Object, valid: boolean }
 */
const decodeAndDecompress = (str) => {
    const [hash, b64] = str.split(':');

    // Base64 decode with UTF-8 support
    let json;
    if (typeof atob === 'function') {
        // Browser environment
        json = decodeURIComponent(escape(atob(b64)));
    } else {
        // Node.js environment
        json = Buffer.from(b64, 'base64').toString('utf-8');
    }

    const data = JSON.parse(json);

    // Verify hash
    let h = 0;
    for (let i = 0; i < json.length; i++) {
        h = ((h << 5) - h) + json.charCodeAt(i);
        h &= h;
    }

    return { data, valid: Math.abs(h).toString(16) === hash };
};

/**
 * Calculate a simple hash for a string
 * @param {string} str - String to hash
 * @returns {string} Hex hash string
 */
const calculateHash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h &= h;
    }
    return Math.abs(h).toString(16);
};

module.exports = {
    compressAndEncode,
    decodeAndDecompress,
    calculateHash
};
