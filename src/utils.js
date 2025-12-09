/**
 * RiskDash Utility Functions
 * Extracted from cyber-dashboard.html for testing
 */

/**
 * Normalize boat names to standard SSN-XXX, SSBN-XXX, or SSGN-XXX format
 * @param {string} name - Raw boat name
 * @returns {string} Normalized boat name
 */
const normalizeBoatName = (name) => {
    if (name === null || name === undefined || name === '') return '';
    // Convert to string if not already
    const strName = String(name);
    if (!strName || !strName.trim()) return '';
    const upper = strName.toUpperCase().trim();
    const match = upper.match(/\b(SSN|SSBN|SSGN)\s*[-]?\s*(\d+)\b/);
    return match ? `${match[1]}-${match[2]}` : upper;
};

/**
 * Parse a numeric value, handling various input formats
 * @param {*} val - Value to parse (number, string, null, etc.)
 * @returns {number|null} Parsed number or null
 */
const parseNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') {
        // Return null for NaN
        return Number.isNaN(val) ? null : val;
    }
    const strVal = String(val).trim().toLowerCase();
    // Handle 'None' as 0
    if (strVal === 'none') return 0;
    const num = parseFloat(strVal.replace(/[%,]/g, ''));
    return isNaN(num) ? null : num;
};

/**
 * Parse a percentage value, handling various input formats
 * @param {*} val - Value to parse
 * @returns {number|null} Parsed percentage or null
 */
const parsePercent = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const strVal = String(val).trim().toLowerCase();
    // Handle 'None' as 0
    if (strVal === 'none') return 0;
    const num = parseFloat(strVal.replace('%', ''));
    return isNaN(num) ? null : num;
};

/**
 * Calculate scan age in days from a date
 * @param {string|Date} d - Date to calculate age from
 * @returns {number|null} Age in days or null if invalid
 */
const scanAge = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const age = Math.floor((new Date() - date) / 86400000);
    return (isFinite(age) && age >= 0) ? age : null;
};

/**
 * Format a number with optional decimal places
 * @param {number|null} v - Value to format
 * @param {number} d - Decimal places (default 0)
 * @returns {string} Formatted string
 */
const fmt = (v, d = 0) => v == null ? '-' : (d > 0 ? v.toFixed(d) : Math.round(v).toString());

/**
 * Format a percentage value
 * @param {number|null} v - Value to format
 * @returns {string} Formatted percentage string
 */
const fmtPct = (v) => v == null ? '-' : Math.min(100, v).toFixed(1) + '%';

/**
 * Format a date for display (M/D format)
 * @param {string|Date} d - Date to format
 * @returns {string} Formatted date string
 */
const fmtDate = (d) => d ? `${new Date(d).getMonth() + 1}/${new Date(d).getDate()}` : '-';

module.exports = {
    normalizeBoatName,
    parseNumber,
    parsePercent,
    scanAge,
    fmt,
    fmtPct,
    fmtDate
};
