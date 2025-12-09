/**
 * Generate test data files for RiskDash
 * Creates VRAM (NIPR/SIPR), ESS (NIPR/SIPR), and TAM test files
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Submarine registry with accurate ISIC assignments
const submarines = {
    // Pacific Fleet (CSP)
    'CSS1': [
        { hull: 'SSN-775', name: 'USS Texas' },
        { hull: 'SSN-776', name: 'USS Hawaii' },
        { hull: 'SSN-777', name: 'USS North Carolina' },
        { hull: 'SSN-786', name: 'USS Illinois' },
        { hull: 'SSN-792', name: 'USS Vermont' },
        { hull: 'SSN-794', name: 'USS Montana' }
    ],
    'CSS7': [
        { hull: 'SSN-762', name: 'USS Columbus' },
        { hull: 'SSN-763', name: 'USS Santa Fe' },
        { hull: 'SSN-766', name: 'USS Charlotte' },
        { hull: 'SSN-771', name: 'USS Columbia' },
        { hull: 'SSN-772', name: 'USS Greeneville' },
        { hull: 'SSN-773', name: 'USS Cheyenne' }
    ],
    'CSS11': [
        { hull: 'SSN-752', name: 'USS Pasadena' },
        { hull: 'SSN-754', name: 'USS Topeka' },
        { hull: 'SSN-758', name: 'USS Asheville' },
        { hull: 'SSN-767', name: 'USS Hampton' }
    ],
    'CSS15': [
        { hull: 'SSN-722', name: 'USS Key West' },
        { hull: 'SSN-759', name: 'USS Jefferson City' },
        { hull: 'SSN-760', name: 'USS Annapolis' },
        { hull: 'SSN-761', name: 'USS Springfield' },
        { hull: 'SSN-783', name: 'USS Minnesota' }
    ],
    'CSS17': [
        { hull: 'SSBN-730', name: 'USS Henry M. Jackson' },
        { hull: 'SSBN-731', name: 'USS Alabama' },
        { hull: 'SSBN-733', name: 'USS Nevada' },
        { hull: 'SSBN-739', name: 'USS Nebraska' },
        { hull: 'SSBN-741', name: 'USS Maine' },
        { hull: 'SSBN-743', name: 'USS Louisiana' }
    ],
    'CSS19': [
        { hull: 'SSGN-726', name: 'USS Ohio' },
        { hull: 'SSGN-727', name: 'USS Michigan' },
        { hull: 'SSBN-735', name: 'USS Pennsylvania' },
        { hull: 'SSBN-737', name: 'USS Kentucky' }
    ],
    'DEVRON5': [
        { hull: 'SSN-21', name: 'USS Seawolf' },
        { hull: 'SSN-22', name: 'USS Connecticut' },
        { hull: 'SSN-23', name: 'USS Jimmy Carter' }
    ],
    'TENDERS': [
        { hull: 'AS-39', name: 'USS Emory S. Land' },
        { hull: 'AS-40', name: 'USS Frank Cable' }
    ],
    // Atlantic Fleet (CSL)
    'CSS4': [
        { hull: 'SSN-774', name: 'USS Virginia' },
        { hull: 'SSN-778', name: 'USS New Hampshire' },
        { hull: 'SSN-779', name: 'USS New Mexico' },
        { hull: 'SSN-780', name: 'USS Missouri' },
        { hull: 'SSN-781', name: 'USS California' },
        { hull: 'SSN-795', name: 'USS Hyman G. Rickover' }
    ],
    'CSS6': [
        { hull: 'SSN-753', name: 'USS Albany' },
        { hull: 'SSN-756', name: 'USS Scranton' },
        { hull: 'SSN-764', name: 'USS Boise' },
        { hull: 'SSN-765', name: 'USS Montpelier' },
        { hull: 'SSN-791', name: 'USS Delaware' },
        { hull: 'SSN-793', name: 'USS Oregon' }
    ],
    'CSS8': [
        { hull: 'SSN-750', name: 'USS Newport News' },
        { hull: 'SSN-751', name: 'USS San Juan' },
        { hull: 'SSN-768', name: 'USS Hartford' },
        { hull: 'SSN-769', name: 'USS Toledo' },
        { hull: 'SSN-785', name: 'USS John Warner' }
    ],
    'CSS16': [
        { hull: 'SSGN-728', name: 'USS Florida' },
        { hull: 'SSGN-729', name: 'USS Georgia' }
    ],
    'CSS20': [
        { hull: 'SSBN-734', name: 'USS Tennessee' },
        { hull: 'SSBN-736', name: 'USS West Virginia' },
        { hull: 'SSBN-738', name: 'USS Maryland' },
        { hull: 'SSBN-740', name: 'USS Rhode Island' },
        { hull: 'SSBN-742', name: 'USS Wyoming' }
    ]
};

// ISIC full names mapping
const isicFullNames = {
    'CSS1': 'COMSUBRON 1',
    'CSS7': 'COMSUBRON 7',
    'CSS11': 'COMSUBRON 11',
    'CSS15': 'COMSUBRON 15',
    'CSS17': 'COMSUBRON 17',
    'CSS19': 'COMSUBRON 19',
    'DEVRON5': 'DEVRON 5',
    'TENDERS': 'TENDERS',
    'CSS4': 'COMSUBRON 4',
    'CSS6': 'COMSUBRON 6',
    'CSS8': 'COMSUBRON 8',
    'CSS16': 'COMSUBRON 16',
    'CSS20': 'COMSUBRON 20'
};

// Flatten all submarines into a single array
function getAllSubmarines() {
    const all = [];
    for (const [isic, subs] of Object.entries(submarines)) {
        for (const sub of subs) {
            all.push({
                ...sub,
                isic: isicFullNames[isic],
                isicShort: isic
            });
        }
    }
    return all;
}

// Random number between min and max (inclusive)
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float with precision
function randFloat(min, max, decimals = 2) {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
}

// Random date within last N days
function randDate(maxDaysAgo) {
    const daysAgo = randInt(1, maxDaysAgo);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

// Generate VRAM data for a submarine
function generateVramData(sub, network) {
    // 70% chance of good data, 20% medium, 10% bad
    const roll = Math.random();
    let vph, crit, high, scanIntegrity, scanPercent, daysAgo;

    if (roll < 0.70) {
        // Good - low risk
        vph = randFloat(0.5, 3.0);
        crit = randInt(0, 2);
        high = randInt(0, 10);
        scanIntegrity = randInt(90, 100);
        scanPercent = randInt(95, 100);
        daysAgo = randInt(1, 14);
    } else if (roll < 0.90) {
        // Medium risk
        vph = randFloat(3.0, 7.0);
        crit = randInt(2, 8);
        high = randInt(10, 30);
        scanIntegrity = randInt(75, 90);
        scanPercent = randInt(85, 95);
        daysAgo = randInt(14, 30);
    } else {
        // High risk
        vph = randFloat(7.0, 15.0);
        crit = randInt(8, 25);
        high = randInt(30, 80);
        scanIntegrity = randInt(50, 75);
        scanPercent = randInt(70, 85);
        daysAgo = randInt(30, 60);
    }

    return {
        'Site Name': sub.hull,
        'Last Scan Date': randDate(daysAgo),
        'Valid Assets': randInt(50, 200),
        'RA VPH': vph,
        'RA CRIT': crit,
        'RA HIGH': high,
        'Scan Integrity': scanIntegrity,
        'Scan %': scanPercent
    };
}

// Generate ESS data for a submarine
function generateEssData(sub, network) {
    // 75% chance of good data, 15% medium, 10% bad
    const roll = Math.random();
    let productCompliance, policyEnforced, breakfix;

    if (roll < 0.75) {
        // Good - no breakfix, high compliance
        productCompliance = randInt(95, 100);
        policyEnforced = randInt(95, 100);
        breakfix = 0;
    } else if (roll < 0.90) {
        // Medium - no breakfix but lower compliance
        productCompliance = randInt(85, 95);
        policyEnforced = randInt(85, 95);
        breakfix = 0;
    } else {
        // Bad - has breakfix (HIGH risk trigger)
        productCompliance = randInt(80, 95);
        policyEnforced = randInt(80, 95);
        breakfix = randInt(1, 5);
    }

    return {
        'Ships': sub.hull,
        'ISIC': sub.isic,
        'Product Compliance': productCompliance,
        'Policy Enforced': policyEnforced,
        'Assets in Breakfix': breakfix,
        'Assets': randInt(50, 200)
    };
}

// Generate TAM data for a submarine
function generateTamData(sub) {
    // 80% good, 15% medium, 5% bad
    const roll = Math.random();
    let pastDue, extensions;

    if (roll < 0.80) {
        pastDue = randInt(0, 3);
        extensions = randInt(0, 2);
    } else if (roll < 0.95) {
        pastDue = randInt(4, 10);
        extensions = randInt(2, 5);
    } else {
        pastDue = randInt(10, 25);
        extensions = randInt(5, 10);
    }

    return {
        'Boat': sub.hull,
        '# Past Due': pastDue,
        '# Extensions': extensions
    };
}

// Write workbook to file
function writeWorkbook(wb, filename, bookType) {
    const outputDir = path.join(__dirname, '..', 'test-data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filepath = path.join(outputDir, filename);
    XLSX.writeFile(wb, filepath, { bookType });
    console.log(`Created: ${filepath}`);
    return filepath;
}

// Create workbook from data array
function createWorkbook(data, sheetName = 'Sheet1') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return wb;
}

// Main generator
function generateTestData() {
    console.log('Generating test data files for RiskDash...\n');

    const allSubs = getAllSubmarines();
    console.log(`Total submarines: ${allSubs.length}\n`);

    // Generate VRAM NIPR
    const vramNiprData = allSubs.map(sub => generateVramData(sub, 'NIPR'));
    const vramNiprWb = createWorkbook(vramNiprData, 'VRAM NIPR');
    writeWorkbook(vramNiprWb, 'VRAM-NIPR-Test.xlsx', 'xlsx');

    // Generate VRAM SIPR
    const vramSiprData = allSubs.map(sub => generateVramData(sub, 'SIPR'));
    const vramSiprWb = createWorkbook(vramSiprData, 'VRAM SIPR');
    writeWorkbook(vramSiprWb, 'VRAM-SIPR-Test.xlsx', 'xlsx');

    // Generate ESS NIPR (ODS format)
    const essNiprData = allSubs.map(sub => generateEssData(sub, 'NIPR'));
    const essNiprWb = createWorkbook(essNiprData, 'ESS NIPR');
    writeWorkbook(essNiprWb, 'ESS-NIPR-Test.ods', 'ods');

    // Generate ESS SIPR (ODS format)
    const essSiprData = allSubs.map(sub => generateEssData(sub, 'SIPR'));
    const essSiprWb = createWorkbook(essSiprData, 'ESS SIPR');
    writeWorkbook(essSiprWb, 'ESS-SIPR-Test.ods', 'ods');

    // Generate TAM Overdue
    const tamData = allSubs.map(sub => generateTamData(sub));
    const tamWb = createWorkbook(tamData, 'TAM Overdue');
    writeWorkbook(tamWb, 'TAM-Overdue-Test.xlsx', 'xlsx');

    console.log('\nAll test data files generated successfully!');
    console.log('\nFiles are located in: test-data/');
}

// Run the generator
generateTestData();
