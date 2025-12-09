/**
 * RiskDash Color Classification Functions
 * Functions to determine CSS classes for color-coded display
 *
 * BOUNDARY BEHAVIOR: "Boundary Gets Better Color"
 * - Values exactly on a threshold boundary are assigned the better/healthier color
 * - For compliance metrics (higher is better): boundary value gets the better color
 * - For VPH (lower is better): boundary value gets the better color
 */

const { defaultThresholds } = require('./thresholds');

/**
 * Product Compliance color classification (higher is better)
 * GREEN: value >= green_threshold
 * RED: value < red_threshold
 * YELLOW: between red and green thresholds
 *
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const prodCompClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.color_product_green || 95;
    const redThreshold = thresholds.color_product_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * Policy Compliance / True Policy color classification (higher is better)
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const policyCompClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.color_policy_green || 95;
    const redThreshold = thresholds.color_policy_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * Policy Enforced Raw color classification (higher is better)
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const policyRawClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.color_policy_raw_green || 95;
    const redThreshold = thresholds.color_policy_raw_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * VPH - Vulnerabilities Per Host color classification (lower is better)
 * GREEN: value <= green_threshold (boundary gets better color)
 * RED: value > red_threshold (boundary gets better color)
 * YELLOW: between thresholds
 *
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const vphClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.color_vph_green || 2.5;
    const redThreshold = thresholds.color_vph_red || 3.5;
    return v <= greenThreshold ? 'risk-low' : v > redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * Scan Age color classification (lower is better)
 * GREEN: age <= green_threshold
 * RED: age > red_threshold
 * YELLOW: between thresholds (if different)
 *
 * @param {string|Date|null} d - Date to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const scanAgeClass = (d, thresholds = defaultThresholds) => {
    if (!d) return 'risk-high';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'risk-high';
    const age = Math.floor((new Date() - date) / 86400000);
    const greenThreshold = thresholds.color_scan_green || 14;
    const redThreshold = thresholds.color_scan_red || 14;
    return age <= greenThreshold ? 'risk-low' : age > redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * HQ Status Product Compliance color classification
 * Uses separate HQ-specific thresholds
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const hqProdClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.hq_color_product_green || 95;
    const redThreshold = thresholds.hq_color_product_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * HQ Status Policy Compliance color classification
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const hqPolicyClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.hq_color_policy_green || 95;
    const redThreshold = thresholds.hq_color_policy_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * HQ Status Policy Raw color classification
 * @param {number|null} v - Value to classify
 * @param {Object} thresholds - Threshold configuration
 * @returns {string} CSS class name
 */
const hqPolicyRawClass = (v, thresholds = defaultThresholds) => {
    if (v === null || v === undefined) return '';
    const greenThreshold = thresholds.hq_color_policy_raw_green || 95;
    const redThreshold = thresholds.hq_color_policy_raw_red || 90;
    return v >= greenThreshold ? 'risk-low' : v < redThreshold ? 'risk-high' : 'risk-med';
};

/**
 * Breakfix color classification
 * @param {number|null} v - Breakfix count
 * @returns {string} CSS class name
 */
const breakfixClass = (v) => {
    if (v === null || v === undefined) return '';
    return v > 0 ? 'risk-high' : '';
};

module.exports = {
    prodCompClass,
    policyCompClass,
    policyRawClass,
    vphClass,
    scanAgeClass,
    hqProdClass,
    hqPolicyClass,
    hqPolicyRawClass,
    breakfixClass
};
