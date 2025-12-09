/**
 * RiskDash Core Functions
 * Main export file for all testable modules
 */

const utils = require('./utils');
const thresholds = require('./thresholds');
const riskCalculator = require('./riskCalculator');
const colorClassification = require('./colorClassification');
const dynamicLegend = require('./dynamicLegend');
const encoding = require('./encoding');
const dataModels = require('./dataModels');
const aggregation = require('./aggregation');

module.exports = {
    // Utilities
    ...utils,

    // Thresholds
    ...thresholds,

    // Risk Calculator
    ...riskCalculator,

    // Color Classification
    ...colorClassification,

    // Dynamic Legend
    ...dynamicLegend,

    // Encoding/Decoding
    ...encoding,

    // Data Models
    ...dataModels,

    // Aggregation
    ...aggregation
};
