/**
 * RiskDash Threshold Configuration
 * Default threshold values for risk calculations
 */

// Default threshold values for the new risk criteria
// Baseline: HIGH = Breakfix OR No Scan | MED = 2+ of criteria | LOW = all criteria met
const defaultThresholds = {
    // LOW risk thresholds (must meet ALL to be LOW)
    low_vph: 2.5,
    low_scan_age_days: 14,
    low_product_compliance: 95,          // Raw Product Compliance threshold
    low_true_policy_compliance: 95,      // True Policy Compliance threshold
    low_raw_policy_compliance: 95,       // Raw Policy Compliance threshold
    low_tam_past_due: 5,                 // TAM Past Due threshold

    // MED risk thresholds (2+ conditions trigger MED)
    med_ra_vph: 3.5,
    med_ess_compliance: 95,
    med_scan_age_days: 14,
    med_tam_past_due: 10,
    med_true_policy_compliance: 95,  // True policy threshold for MED (enabled by default)
    med_raw_policy_compliance: 0,    // Raw policy threshold for MED (disabled by default)

    // HIGH risk thresholds (auto-HIGH if exceeded) - disabled by default except TAMs
    // Set to extreme values to effectively disable (Breakfix + No Scan are always HIGH)
    auto_high_ra_vph: 999,           // Disabled - VPH doesn't auto-trigger HIGH
    auto_high_scan_age_days: 999,    // Disabled - Old scans don't auto-trigger HIGH (No scan does)
    high_ess_compliance: 90,         // Enabled - True Policy compliance < 90% triggers HIGH
    high_raw_policy_compliance: 0,   // Disabled - Raw Policy compliance doesn't auto-trigger HIGH
    high_product_compliance: 0,      // Disabled - Low product compliance doesn't auto-trigger HIGH
    high_tam_past_due: 20,           // Optional - TAMs > 20 triggers HIGH (can be adjusted)

    // CSL/CSP Table Color scale thresholds (green/red, yellow is between)
    color_product_green: 95, color_product_red: 90,
    color_policy_green: 95, color_policy_red: 90,
    color_policy_raw_green: 95, color_policy_raw_red: 90,
    color_vph_green: 2.5, color_vph_red: 3.5,
    color_scan_green: 14, color_scan_red: 14,

    // HQ Status Table Color scale thresholds (separate from CSL/CSP)
    hq_color_product_green: 95, hq_color_product_red: 90,
    hq_color_policy_green: 95, hq_color_policy_red: 90,
    hq_color_policy_raw_green: 95, hq_color_policy_raw_red: 90,

    // LOW risk toggleable criteria (1 = enabled, 0 = disabled)
    low_product_compliance_enabled: 1,       // Always enabled (required for LOW)
    low_true_policy_compliance_enabled: 0,   // Disabled by default
    low_raw_policy_compliance_enabled: 0,    // Disabled by default
    low_tam_past_due_enabled: 0,             // Disabled by default
};

module.exports = {
    defaultThresholds
};
