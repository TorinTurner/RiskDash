/**
 * RiskDash Aggregation Functions
 * Functions to aggregate boat data by ISIC and TYCOM
 */

/**
 * Aggregate boat data by ISIC
 *
 * @param {Array} boats - Array of boat data objects
 * @param {Object} settings - Settings with ISIC registry
 * @returns {Object} { csl: Array, csp: Array } - Aggregated data by TYCOM
 */
const aggregateByISIC = (boats, settings = { isics: [] }) => {
    const groups = {};

    // Group boats by ISIC
    for (const b of boats) {
        if (!groups[b.isic]) {
            const info = settings.isics.find(i => i.isic_name === b.isic) || {
                isic_name: b.isic,
                isic_short: b.isic.slice(0, 6),
                tycom: b.tycom
            };
            groups[b.isic] = { ...info, boats: [] };
        }
        groups[b.isic].boats.push(b);
    }

    // Calculate aggregations for each ISIC group
    const aggs = Object.values(groups).map(g => {
        let nProdSum = 0, nProdCnt = 0, nPolSum = 0, nPolCnt = 0, nPolRawSum = 0, nPolRawCnt = 0;
        let sProdSum = 0, sProdCnt = 0, sPolSum = 0, sPolCnt = 0, sPolRawSum = 0, sPolRawCnt = 0;

        const agg = {
            isicName: g.isic_name,
            isicShort: g.isic_short,
            tycom: g.tycom,
            boatCount: g.boats.length,
            niprBreakfixSum: 0,
            siprBreakfixSum: 0,
            highRiskCount: 0,
            medRiskCount: 0,
            lowRiskCount: 0,
            scanExemptCount: 0,
            niprProdCompAvg: 0,
            niprPolEnfAvg: 0,
            niprPolRawAvg: 0,
            siprProdCompAvg: 0,
            siprPolEnfAvg: 0,
            siprPolRawAvg: 0
        };

        for (const b of g.boats) {
            // Skip NIPR values for NMCI boats
            if (!b.isNmci) {
                agg.niprBreakfixSum += b.essNiprBreakfix || 0;
                if (b.essNiprProductCompliance !== null) {
                    nProdSum += b.essNiprProductCompliance;
                    nProdCnt++;
                }
                if (b.essNiprTruePolicy !== null) {
                    nPolSum += b.essNiprTruePolicy;
                    nPolCnt++;
                }
                if (b.essNiprPolicyEnforced !== null) {
                    nPolRawSum += b.essNiprPolicyEnforced;
                    nPolRawCnt++;
                }
            }

            agg.siprBreakfixSum += b.essSiprBreakfix || 0;
            if (b.essSiprProductCompliance !== null) {
                sProdSum += b.essSiprProductCompliance;
                sProdCnt++;
            }
            if (b.essSiprTruePolicy !== null) {
                sPolSum += b.essSiprTruePolicy;
                sPolCnt++;
            }
            if (b.essSiprPolicyEnforced !== null) {
                sPolRawSum += b.essSiprPolicyEnforced;
                sPolRawCnt++;
            }

            // Risk counts
            if (b.riskLevel === 'HIGH') agg.highRiskCount++;
            else if (b.riskLevel === 'MED') agg.medRiskCount++;
            else if (b.riskLevel === 'LOW') agg.lowRiskCount++;

            // Scan exempt count
            if (b.vramNiprScanExempt || b.vramSiprScanExempt) agg.scanExemptCount++;
        }

        // Calculate averages (capped at 100%)
        agg.niprProdCompAvg = nProdCnt > 0 ? Math.min(100, nProdSum / nProdCnt) : 0;
        agg.niprPolEnfAvg = nPolCnt > 0 ? Math.min(100, nPolSum / nPolCnt) : 0;
        agg.niprPolRawAvg = nPolRawCnt > 0 ? Math.min(100, nPolRawSum / nPolRawCnt) : 0;
        agg.siprProdCompAvg = sProdCnt > 0 ? Math.min(100, sProdSum / sProdCnt) : 0;
        agg.siprPolEnfAvg = sPolCnt > 0 ? Math.min(100, sPolSum / sPolCnt) : 0;
        agg.siprPolRawAvg = sPolRawCnt > 0 ? Math.min(100, sPolRawSum / sPolRawCnt) : 0;

        return agg;
    });

    // Split by TYCOM
    return {
        csl: aggs.filter(a => a.tycom === 'CSL'),
        csp: aggs.filter(a => a.tycom === 'CSP')
    };
};

/**
 * Calculate overall statistics for a collection of boats
 *
 * @param {Array} boats - Array of boat data objects
 * @returns {Object} Statistics object
 */
const calculateStats = (boats) => {
    const stats = {
        totalBoats: boats.length,
        highRiskCount: 0,
        medRiskCount: 0,
        lowRiskCount: 0,
        totalBreakfix: 0,
        scanExemptCount: 0,
        avgVph: 0,
        avgCompliance: 0
    };

    const vphValues = [];
    const compValues = [];

    for (const b of boats) {
        // Risk counts
        if (b.riskLevel === 'HIGH') stats.highRiskCount++;
        else if (b.riskLevel === 'MED') stats.medRiskCount++;
        else if (b.riskLevel === 'LOW') stats.lowRiskCount++;

        // Breakfix (skip NIPR for NMCI)
        stats.totalBreakfix += (b.isNmci ? 0 : (b.essNiprBreakfix || 0)) + (b.essSiprBreakfix || 0);

        // Scan exempt
        if (b.vramNiprScanExempt || b.vramSiprScanExempt) stats.scanExemptCount++;

        // VPH values (skip NIPR for NMCI)
        if (!b.isNmci && b.vramNiprRaVph !== null) vphValues.push(b.vramNiprRaVph);
        if (b.vramSiprRaVph !== null) vphValues.push(b.vramSiprRaVph);

        // Compliance values (skip NIPR for NMCI)
        if (!b.isNmci && b.essNiprProductCompliance !== null) compValues.push(b.essNiprProductCompliance);
        if (b.essSiprProductCompliance !== null) compValues.push(b.essSiprProductCompliance);
    }

    // Calculate averages
    if (vphValues.length > 0) {
        stats.avgVph = vphValues.reduce((s, v) => s + v, 0) / vphValues.length;
    }
    if (compValues.length > 0) {
        stats.avgCompliance = Math.min(100, compValues.reduce((s, v) => s + v, 0) / compValues.length);
    }

    return stats;
};

/**
 * Group boats by a specified field
 *
 * @param {Array} boats - Array of boat data objects
 * @param {string} field - Field to group by
 * @returns {Object} Boats grouped by field value
 */
const groupBoatsBy = (boats, field) => {
    const groups = {};
    for (const b of boats) {
        const key = b[field] || 'Unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
    }
    return groups;
};

module.exports = {
    aggregateByISIC,
    calculateStats,
    groupBoatsBy
};
