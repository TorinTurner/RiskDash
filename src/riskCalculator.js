/**
 * RiskDash Risk Calculator
 * Core risk calculation engine for cyber risk assessment
 */

const { defaultThresholds } = require('./thresholds');

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
 * Calculate risk level for a single boat
 *
 * RISK CRITERIA:
 * HIGH: Breakfix > 0, no VRAM data, Product Compliance < threshold, VPH > threshold,
 *       Scan > threshold days, Policy Compliance < threshold, TAMs > threshold
 * MED: 2+ conditions trigger MED
 * LOW: All criteria must be met (VPH low, compliance high, scans recent, no breakfix)
 *
 * NOTE: For NMCI boats, NIPR data is ignored entirely (they use Navy network)
 *
 * @param {Object} boat - Boat data object
 * @param {Object} thresholds - Threshold configuration
 * @returns {Object} { level: 'HIGH'|'MED'|'LOW', reasons: string[] }
 */
const calculateRisk = (boat, thresholds = defaultThresholds) => {
    // Ensure we have a valid thresholds object
    const t = thresholds || defaultThresholds;

    const reasons = [];
    let level = 'LOW';
    let highDueToNoScans = false;
    const isNmci = boat.isNmci === true;

    const nAge = isNmci ? null : scanAge(boat.vramNiprScanDate);
    const sAge = scanAge(boat.vramSiprScanDate);

    // Check if we have VRAM data - if no VRAM data at all, it's HIGH risk (can't assess)
    // For NMCI boats, only check SIPR data (NIPR is on NMCI network)
    const hasNiprVramData = isNmci ? true : (boat.vramNiprScanDate !== null || boat.vramNiprRaVph !== null || boat.vramNiprAssets !== null);
    const hasSiprVramData = boat.vramSiprScanDate !== null || boat.vramSiprRaVph !== null || boat.vramSiprAssets !== null;
    const hasAnyVramData = hasNiprVramData || hasSiprVramData;

    // HIGH RISK TRIGGERS
    // 1. Any asset in breakfix (either enclave) - skip NIPR for NMCI boats
    if (!isNmci && (boat.essNiprBreakfix || 0) > 0) {
        level = 'HIGH';
        reasons.push(`NIPR Breakfix: ${boat.essNiprBreakfix}`);
    }
    if ((boat.essSiprBreakfix || 0) > 0) {
        level = 'HIGH';
        reasons.push(`SIPR Breakfix: ${boat.essSiprBreakfix}`);
    }

    // 2. No VRAM scan data (can't assess risk) - for NMCI, only require SIPR
    if (!hasAnyVramData || (isNmci && !hasSiprVramData)) {
        level = 'HIGH';
        reasons.push('No VRAM data');
        highDueToNoScans = true;
    }

    // 3. ESS Product Compliance < high_product_compliance (critical compliance failure)
    const highProductComplianceThreshold = t.high_product_compliance || 50;
    if (highProductComplianceThreshold > 0) {
        if (!isNmci && boat.essNiprProductCompliance !== null && boat.essNiprProductCompliance < highProductComplianceThreshold) {
            level = 'HIGH';
            reasons.push(`NIPR Prod: ${boat.essNiprProductCompliance.toFixed(1)}%`);
        }
        if (boat.essSiprProductCompliance !== null && boat.essSiprProductCompliance < highProductComplianceThreshold) {
            level = 'HIGH';
            reasons.push(`SIPR Prod: ${boat.essSiprProductCompliance.toFixed(1)}%`);
        }
    }

    // 4. VPH exceeds auto_high_ra_vph threshold (critical vulnerability level)
    const autoHighVphThreshold = t.auto_high_ra_vph || 5;
    if (!isNmci && boat.vramNiprRaVph !== null && boat.vramNiprRaVph > autoHighVphThreshold) {
        level = 'HIGH';
        reasons.push(`NIPR VPH: ${boat.vramNiprRaVph.toFixed(2)}`);
    }
    if (boat.vramSiprRaVph !== null && boat.vramSiprRaVph > autoHighVphThreshold) {
        level = 'HIGH';
        reasons.push(`SIPR VPH: ${boat.vramSiprRaVph.toFixed(2)}`);
    }

    // 5. Scan age exceeds auto_high_scan_age_days threshold
    const autoHighScanAgeThreshold = t.auto_high_scan_age_days || 30;
    if (!isNmci && nAge !== null && nAge > autoHighScanAgeThreshold) {
        level = 'HIGH';
        reasons.push(`NIPR Scan: ${nAge}d`);
    }
    if (sAge !== null && sAge > autoHighScanAgeThreshold) {
        level = 'HIGH';
        reasons.push(`SIPR Scan: ${sAge}d`);
    }

    // 6. ESS True Policy Compliance below high_ess_compliance threshold
    const highEssComplianceThreshold = t.high_ess_compliance || 0;
    if (highEssComplianceThreshold > 0) {
        if (!isNmci && boat.essNiprTruePolicy !== null && boat.essNiprTruePolicy < highEssComplianceThreshold) {
            level = 'HIGH';
            reasons.push(`NIPR True Policy: ${boat.essNiprTruePolicy.toFixed(1)}%`);
        }
        if (boat.essSiprTruePolicy !== null && boat.essSiprTruePolicy < highEssComplianceThreshold) {
            level = 'HIGH';
            reasons.push(`SIPR True Policy: ${boat.essSiprTruePolicy.toFixed(1)}%`);
        }
    }

    // 6b. ESS Raw Policy Compliance below high_raw_policy_compliance threshold
    const highRawPolicyThreshold = t.high_raw_policy_compliance || 0;
    if (highRawPolicyThreshold > 0) {
        if (!isNmci && boat.essNiprPolicyEnforced !== null && boat.essNiprPolicyEnforced < highRawPolicyThreshold) {
            level = 'HIGH';
            reasons.push(`NIPR Raw Policy: ${boat.essNiprPolicyEnforced.toFixed(1)}%`);
        }
        if (boat.essSiprPolicyEnforced !== null && boat.essSiprPolicyEnforced < highRawPolicyThreshold) {
            level = 'HIGH';
            reasons.push(`SIPR Raw Policy: ${boat.essSiprPolicyEnforced.toFixed(1)}%`);
        }
    }

    // 7. TAM past due exceeds high_tam_past_due threshold
    const highTamThreshold = t.high_tam_past_due || 20;
    if ((boat.tamPastDue || 0) > highTamThreshold) {
        level = 'HIGH';
        reasons.push(`TAMs: ${boat.tamPastDue}`);
    }

    // If not already HIGH, check MEDIUM criteria
    if (level !== 'HIGH') {
        // MED RISK: 2 or more of the following conditions
        let medConditionCount = 0;
        const medReasons = [];

        // Condition 1: VPH exceeds threshold
        const vphThreshold = t.med_ra_vph || 3.5;
        if (!isNmci && boat.vramNiprRaVph !== null && boat.vramNiprRaVph > vphThreshold) {
            medConditionCount++;
            medReasons.push(`NIPR VPH: ${boat.vramNiprRaVph.toFixed(2)}`);
        }
        if (boat.vramSiprRaVph !== null && boat.vramSiprRaVph > vphThreshold) {
            medConditionCount++;
            medReasons.push(`SIPR VPH: ${boat.vramSiprRaVph.toFixed(2)}`);
        }

        // Condition 2: Product Compliance below threshold
        const complianceThreshold = t.med_ess_compliance || 95;
        if (!isNmci && boat.essNiprProductCompliance !== null && boat.essNiprProductCompliance < complianceThreshold) {
            medConditionCount++;
            medReasons.push(`NIPR Prod: ${boat.essNiprProductCompliance.toFixed(1)}%`);
        }
        if (boat.essSiprProductCompliance !== null && boat.essSiprProductCompliance < complianceThreshold) {
            medConditionCount++;
            medReasons.push(`SIPR Prod: ${boat.essSiprProductCompliance.toFixed(1)}%`);
        }

        // Condition 2b: True Policy compliance (toggleable)
        const truePolicyThreshold = t.med_true_policy_compliance || 0;
        if (truePolicyThreshold > 0) {
            if (!isNmci && boat.essNiprTruePolicy !== null && boat.essNiprTruePolicy < truePolicyThreshold) {
                medConditionCount++;
                medReasons.push(`NIPR True Policy: ${boat.essNiprTruePolicy.toFixed(1)}%`);
            }
            if (boat.essSiprTruePolicy !== null && boat.essSiprTruePolicy < truePolicyThreshold) {
                medConditionCount++;
                medReasons.push(`SIPR True Policy: ${boat.essSiprTruePolicy.toFixed(1)}%`);
            }
        }

        // Condition 2c: Raw Policy compliance (toggleable)
        const rawPolicyThreshold = t.med_raw_policy_compliance || 0;
        if (rawPolicyThreshold > 0) {
            if (!isNmci && boat.essNiprPolicyEnforced !== null && boat.essNiprPolicyEnforced < rawPolicyThreshold) {
                medConditionCount++;
                medReasons.push(`NIPR Raw Policy: ${boat.essNiprPolicyEnforced.toFixed(1)}%`);
            }
            if (boat.essSiprPolicyEnforced !== null && boat.essSiprPolicyEnforced < rawPolicyThreshold) {
                medConditionCount++;
                medReasons.push(`SIPR Raw Policy: ${boat.essSiprPolicyEnforced.toFixed(1)}%`);
            }
        }

        // Condition 3: Scan age exceeds threshold
        const scanThreshold = t.med_scan_age_days || 14;
        if (!isNmci && nAge !== null && nAge > scanThreshold) {
            medConditionCount++;
            medReasons.push(`NIPR Scan: ${nAge}d`);
        }
        if (sAge !== null && sAge > scanThreshold) {
            medConditionCount++;
            medReasons.push(`SIPR Scan: ${sAge}d`);
        }

        // Condition 4: TAMs past due exceeds threshold
        const tamThreshold = t.med_tam_past_due || 10;
        if ((boat.tamPastDue || 0) > tamThreshold) {
            medConditionCount++;
            medReasons.push(`TAMs: ${boat.tamPastDue}`);
        }

        // If 2 or more conditions, it's MED risk
        if (medConditionCount >= 2) {
            level = 'MED';
            reasons.push(...medReasons);
        }
    }

    // Check if LOW risk criteria are actually met
    if (level === 'LOW') {
        const lowVphThreshold = t.low_vph || 2.5;
        const lowProductThreshold = t.low_product_compliance || 95;
        const lowTruePolicyThreshold = t.low_true_policy_compliance || 95;
        const lowRawPolicyThreshold = t.low_raw_policy_compliance || 95;
        const lowScanThreshold = t.low_scan_age_days || 14;
        const lowTamThreshold = t.low_tam_past_due || 5;

        // LOW criteria toggles
        const productCompEnabled = true; // Always required for LOW
        const truePolicyEnabled = (t.low_true_policy_compliance_enabled ?? 0) === 1;
        const rawPolicyEnabled = (t.low_raw_policy_compliance_enabled ?? 0) === 1;
        const tamEnabled = (t.low_tam_past_due_enabled ?? 0) === 1;

        let meetsLowCriteria = true;

        // VPH check (always enabled)
        if (!isNmci && boat.vramNiprRaVph !== null && boat.vramNiprRaVph >= lowVphThreshold) meetsLowCriteria = false;
        if (boat.vramSiprRaVph !== null && boat.vramSiprRaVph >= lowVphThreshold) meetsLowCriteria = false;

        // Product compliance check (always enabled)
        if (productCompEnabled) {
            if (!isNmci && boat.essNiprProductCompliance !== null && boat.essNiprProductCompliance < lowProductThreshold) meetsLowCriteria = false;
            if (boat.essSiprProductCompliance !== null && boat.essSiprProductCompliance < lowProductThreshold) meetsLowCriteria = false;
        }

        // True policy compliance check (if enabled)
        if (truePolicyEnabled) {
            if (!isNmci && boat.essNiprTruePolicy !== null && boat.essNiprTruePolicy < lowTruePolicyThreshold) meetsLowCriteria = false;
            if (boat.essSiprTruePolicy !== null && boat.essSiprTruePolicy < lowTruePolicyThreshold) meetsLowCriteria = false;
        }

        // Raw policy compliance check (if enabled)
        if (rawPolicyEnabled) {
            if (!isNmci && boat.essNiprPolicyEnforced !== null && boat.essNiprPolicyEnforced < lowRawPolicyThreshold) meetsLowCriteria = false;
            if (boat.essSiprPolicyEnforced !== null && boat.essSiprPolicyEnforced < lowRawPolicyThreshold) meetsLowCriteria = false;
        }

        // Scan age check (always enabled)
        if (!isNmci && nAge !== null && nAge > lowScanThreshold) meetsLowCriteria = false;
        if (sAge !== null && sAge > lowScanThreshold) meetsLowCriteria = false;

        // TAM past due check (if enabled)
        if (tamEnabled && (boat.tamPastDue || 0) > lowTamThreshold) meetsLowCriteria = false;

        if (!meetsLowCriteria) {
            // Upgrade to MED if doesn't meet LOW criteria
            level = 'MED';
            if (!isNmci && boat.vramNiprRaVph !== null && boat.vramNiprRaVph >= lowVphThreshold) reasons.push(`NIPR VPH: ${boat.vramNiprRaVph.toFixed(2)}`);
            if (boat.vramSiprRaVph !== null && boat.vramSiprRaVph >= lowVphThreshold) reasons.push(`SIPR VPH: ${boat.vramSiprRaVph.toFixed(2)}`);
            if (productCompEnabled && !isNmci && boat.essNiprProductCompliance !== null && boat.essNiprProductCompliance < lowProductThreshold) reasons.push(`NIPR Prod: ${boat.essNiprProductCompliance.toFixed(1)}%`);
            if (productCompEnabled && boat.essSiprProductCompliance !== null && boat.essSiprProductCompliance < lowProductThreshold) reasons.push(`SIPR Prod: ${boat.essSiprProductCompliance.toFixed(1)}%`);
            if (truePolicyEnabled && !isNmci && boat.essNiprTruePolicy !== null && boat.essNiprTruePolicy < lowTruePolicyThreshold) reasons.push(`NIPR TruePolicy: ${boat.essNiprTruePolicy.toFixed(1)}%`);
            if (truePolicyEnabled && boat.essSiprTruePolicy !== null && boat.essSiprTruePolicy < lowTruePolicyThreshold) reasons.push(`SIPR TruePolicy: ${boat.essSiprTruePolicy.toFixed(1)}%`);
            if (rawPolicyEnabled && !isNmci && boat.essNiprPolicyEnforced !== null && boat.essNiprPolicyEnforced < lowRawPolicyThreshold) reasons.push(`NIPR RawPolicy: ${boat.essNiprPolicyEnforced.toFixed(1)}%`);
            if (rawPolicyEnabled && boat.essSiprPolicyEnforced !== null && boat.essSiprPolicyEnforced < lowRawPolicyThreshold) reasons.push(`SIPR RawPolicy: ${boat.essSiprPolicyEnforced.toFixed(1)}%`);
            if (!isNmci && nAge !== null && nAge > lowScanThreshold) reasons.push(`NIPR Scan: ${nAge}d`);
            if (sAge !== null && sAge > lowScanThreshold) reasons.push(`SIPR Scan: ${sAge}d`);
            if (tamEnabled && (boat.tamPastDue || 0) > lowTamThreshold) reasons.push(`TAMs: ${boat.tamPastDue}`);
        }
    }

    // Scan Exempt Logic
    if (level === 'HIGH') {
        let isScanExempt = false;
        if (boat.isNmci) {
            // NMCI boats: only exempt if BOTH enclaves are exempt
            isScanExempt = boat.vramNiprScanExempt && boat.vramSiprScanExempt;
        } else {
            // Non-NMCI boats: exempt if either enclave is exempt
            isScanExempt = boat.vramNiprScanExempt || boat.vramSiprScanExempt;
        }

        if (isScanExempt && highDueToNoScans && reasons.every(r => r.includes('VRAM data'))) {
            level = 'MED';
            reasons.push('Scan Exempt');
        }
    }

    return { level, reasons };
};

/**
 * Calculate risks for all boats
 * @param {Array} boats - Array of boat data objects
 * @param {Object} thresholds - Threshold configuration
 * @returns {Array} Updated boats with riskLevel and riskReasons
 */
const calculateAllRisks = (boats, thresholds = defaultThresholds) => {
    for (const b of boats) {
        const { level, reasons } = calculateRisk(b, thresholds);
        b.riskLevel = level;
        b.riskReasons = reasons;
    }
    return boats;
};

module.exports = {
    calculateRisk,
    calculateAllRisks,
    scanAge
};
