/**
 * RiskDash Data Models
 * Factory functions and type definitions for data structures
 */

/**
 * Create a new boat data object with all required fields
 *
 * @param {string} name - Boat name (e.g., "SSN-123")
 * @param {string} fullName - Full boat name (e.g., "USS Example")
 * @param {string} isic - ISIC code (e.g., "COMSUBRON 1")
 * @param {string} tycom - TYCOM code ("CSL" or "CSP")
 * @param {boolean} isNmci - Whether boat uses NMCI network (default: false)
 * @returns {Object} Boat data object
 */
const createBoatData = (name, fullName, isic, tycom, isNmci = false) => ({
    boatName: name,
    boatFullName: fullName,
    isic,
    tycom,
    isNmci,
    // ESS NIPR fields
    essNiprAssets: null,
    essNiprBreakfix: null,
    essNiprProductCompliance: null,
    essNiprPolicyEnforced: null,
    essNiprTruePolicy: null,
    // ESS SIPR fields
    essSiprAssets: null,
    essSiprBreakfix: null,
    essSiprProductCompliance: null,
    essSiprPolicyEnforced: null,
    essSiprTruePolicy: null,
    // VRAM NIPR fields
    vramNiprAssets: null,
    vramNiprScanDate: null,
    vramNiprRaVph: null,
    vramNiprRaCrit: null,
    vramNiprScanIntegrity: null,
    vramNiprScanPercent: null,
    vramNiprRaHigh: null,
    vramNiprScanExempt: false,
    // VRAM SIPR fields
    vramSiprAssets: null,
    vramSiprScanDate: null,
    vramSiprRaVph: null,
    vramSiprRaCrit: null,
    vramSiprScanIntegrity: null,
    vramSiprScanPercent: null,
    vramSiprRaHigh: null,
    vramSiprScanExempt: false,
    // TAM fields
    tamPastDue: null,
    tamExtensions: null,
    // Risk calculation results
    riskLevel: 'LOW',
    riskReasons: [],
    // User modifications
    overrides: [],
    notes: '',
    // Custom fields from schema
    customFields: {}
});

/**
 * Create a minimal boat for testing (only essential fields)
 * @param {Object} overrides - Fields to override
 * @returns {Object} Boat data object
 */
const createTestBoat = (overrides = {}) => ({
    ...createBoatData('SSN-001', 'Test Boat', 'COMSUBRON 1', 'CSL', false),
    ...overrides
});

/**
 * Create a "healthy" boat with all green/LOW risk metrics
 * @param {Object} overrides - Fields to override
 * @returns {Object} Boat data object
 */
const createHealthyBoat = (overrides = {}) => {
    const now = new Date();
    const recentDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago

    return {
        ...createBoatData('SSN-001', 'Healthy Boat', 'COMSUBRON 1', 'CSL', false),
        // ESS NIPR - good compliance, no breakfix
        essNiprAssets: 100,
        essNiprBreakfix: 0,
        essNiprProductCompliance: 98,
        essNiprPolicyEnforced: 98,
        essNiprTruePolicy: 96.04,
        // ESS SIPR - good compliance, no breakfix
        essSiprAssets: 50,
        essSiprBreakfix: 0,
        essSiprProductCompliance: 99,
        essSiprPolicyEnforced: 99,
        essSiprTruePolicy: 98.01,
        // VRAM NIPR - low VPH, recent scan
        vramNiprAssets: 100,
        vramNiprScanDate: recentDate,
        vramNiprRaVph: 1.5,
        vramNiprRaCrit: 0,
        vramNiprScanIntegrity: 95,
        vramNiprScanPercent: 98,
        vramNiprRaHigh: 2,
        vramNiprScanExempt: false,
        // VRAM SIPR - low VPH, recent scan
        vramSiprAssets: 50,
        vramSiprScanDate: recentDate,
        vramSiprRaVph: 1.2,
        vramSiprRaCrit: 0,
        vramSiprScanIntegrity: 97,
        vramSiprScanPercent: 99,
        vramSiprRaHigh: 1,
        vramSiprScanExempt: false,
        // TAM - low past due
        tamPastDue: 2,
        tamExtensions: 1,
        ...overrides
    };
};

/**
 * Create a boat with HIGH risk due to breakfix
 * @param {Object} overrides - Fields to override
 * @returns {Object} Boat data object
 */
const createBreakfixBoat = (overrides = {}) => {
    return createHealthyBoat({
        boatName: 'SSN-002',
        boatFullName: 'Breakfix Boat',
        essNiprBreakfix: 3,
        ...overrides
    });
};

/**
 * Create a boat with no VRAM data (HIGH risk)
 * @param {Object} overrides - Fields to override
 * @returns {Object} Boat data object
 */
const createNoVramBoat = (overrides = {}) => {
    return {
        ...createBoatData('SSN-003', 'No VRAM Boat', 'COMSUBRON 1', 'CSL', false),
        // ESS data exists but no VRAM
        essNiprAssets: 100,
        essNiprBreakfix: 0,
        essNiprProductCompliance: 98,
        essNiprPolicyEnforced: 98,
        essNiprTruePolicy: 96.04,
        essSiprAssets: 50,
        essSiprBreakfix: 0,
        essSiprProductCompliance: 99,
        essSiprPolicyEnforced: 99,
        essSiprTruePolicy: 98.01,
        // VRAM is null (no data)
        vramNiprAssets: null,
        vramNiprScanDate: null,
        vramNiprRaVph: null,
        vramSiprAssets: null,
        vramSiprScanDate: null,
        vramSiprRaVph: null,
        ...overrides
    };
};

/**
 * Create an NMCI boat (NIPR data is ignored)
 * @param {Object} overrides - Fields to override
 * @returns {Object} Boat data object
 */
const createNmciBoat = (overrides = {}) => {
    return createHealthyBoat({
        boatName: 'SSN-010',
        boatFullName: 'NMCI Boat',
        isNmci: true,
        ...overrides
    });
};

/**
 * Standard fields for each schema type (used to identify custom fields)
 */
const standardFields = {
    vram: ['siteName', 'scanDate', 'assets', 'raVph', 'raCrit', 'raHigh', 'scanIntegrity', 'scanPercent', 'scanExempt'],
    ess: ['shipName', 'isic', 'productCompliance', 'policyEnforced', 'truePolicy', 'breakfix', 'assets'],
    tam: ['boatName', 'pastDue', 'extensions']
};

/**
 * Get custom fields from schema (fields not in standard list)
 * @param {Array} schemaArr - Schema configuration array
 * @param {string} type - Schema type ('vram', 'ess', 'tam')
 * @returns {Array} Custom field definitions
 */
const getCustomFields = (schemaArr, type) => {
    if (!schemaArr) return [];
    return schemaArr.filter(s => !standardFields[type].includes(s.field) && s.visible !== false);
};

module.exports = {
    createBoatData,
    createTestBoat,
    createHealthyBoat,
    createBreakfixBoat,
    createNoVramBoat,
    createNmciBoat,
    standardFields,
    getCustomFields
};
