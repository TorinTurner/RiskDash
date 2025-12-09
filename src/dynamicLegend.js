/**
 * RiskDash Dynamic Legend Generator
 * Generates legend text based on active threshold configuration
 */

const { defaultThresholds } = require('./thresholds');

/**
 * Generate dynamic legend text based on active thresholds
 * Creates legend descriptions that reflect the current risk equation
 *
 * @param {Object} thresholds - Current threshold configuration
 * @returns {Object} { high: string, med: string, low: string }
 */
const generateDynamicLegend = (thresholds) => {
    const t = thresholds || defaultThresholds;

    // HIGH legend - always includes Breakfix and No VRAM Scan
    let highParts = ['Breakfix &gt; 0', 'No VRAM Scan'];

    // Add optional HIGH triggers
    if ((t.high_tam_past_due || 999) < 999) {
        highParts.push(`TAM &gt;${t.high_tam_past_due}`);
    }
    if ((t.auto_high_ra_vph || 999) < 999) {
        highParts.push(`VPH &gt;${t.auto_high_ra_vph}`);
    }
    if ((t.auto_high_scan_age_days || 999) < 999) {
        highParts.push(`Scan &gt;${t.auto_high_scan_age_days}d`);
    }
    if ((t.high_ess_compliance || 0) > 0) {
        highParts.push(`TruePolicy &lt;${t.high_ess_compliance}%`);
    }
    if ((t.high_raw_policy_compliance || 0) > 0) {
        highParts.push(`RawPolicy &lt;${t.high_raw_policy_compliance}%`);
    }
    if ((t.high_product_compliance || 0) > 0) {
        highParts.push(`Product &lt;${t.high_product_compliance}%`);
    }

    const high = highParts.join(' OR ');

    // MED legend - always includes VPH and Product, add toggleable options
    let medParts = [
        `VPH &gt;${t.med_ra_vph || 3.5}`,
        `Product &lt;${t.med_ess_compliance || 95}%`
    ];

    // Add toggleable MED criteria
    if ((t.med_true_policy_compliance || 0) > 0) {
        medParts.push(`TruePolicy &lt;${t.med_true_policy_compliance}%`);
    }
    if ((t.med_raw_policy_compliance || 0) > 0) {
        medParts.push(`RawPolicy &lt;${t.med_raw_policy_compliance}%`);
    }

    // Always include scan age and TAM for MED
    medParts.push(`Scan &gt;${t.med_scan_age_days || 14}d`);
    medParts.push(`TAM &gt;${t.med_tam_past_due || 10}`);

    const med = `2+ of: ${medParts.join(', ')}`;

    // LOW legend - starts with always-required criteria
    let lowParts = [
        `VPH &lt;${t.low_vph || 2.5}`,
        `Product ≥${t.low_product_compliance || 95}%`
    ];

    // Add toggleable LOW criteria
    if ((t.low_true_policy_compliance_enabled ?? 0) === 1) {
        lowParts.push(`TruePolicy ≥${t.low_true_policy_compliance || 95}%`);
    }
    if ((t.low_raw_policy_compliance_enabled ?? 0) === 1) {
        lowParts.push(`RawPolicy ≥${t.low_raw_policy_compliance || 95}%`);
    }

    // Always include scan age for LOW
    lowParts.push(`Scan ≤${t.low_scan_age_days || 14}d`);

    // Add TAM if enabled
    if ((t.low_tam_past_due_enabled ?? 0) === 1) {
        lowParts.push(`TAM ≤${t.low_tam_past_due || 5}`);
    }

    const low = lowParts.join(', ');

    return { high, med, low };
};

/**
 * Format legend text by replacing threshold placeholders
 * @param {string} text - Legend text with {placeholder} syntax
 * @param {Object} thresholds - Threshold values
 * @returns {string} Formatted text
 */
const formatLegendText = (text, thresholds) => {
    if (!text) return '';
    return text.replace(/\{(\w+)\}/g, (match, key) => {
        return thresholds[key] !== undefined ? thresholds[key] : match;
    });
};

module.exports = {
    generateDynamicLegend,
    formatLegendText
};
