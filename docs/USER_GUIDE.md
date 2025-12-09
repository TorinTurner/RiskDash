# SUBFOR Cyber Risk Dashboard - User Guide

## Overview

The SUBFOR Cyber Risk Dashboard is a standalone web application for tracking and reporting submarine force cyber risk metrics. It processes data from multiple sources (VRAM, ESS, TAM) and generates printable reports with risk assessments for each boat.

**Key Features:**
- Offline/air-gapped operation (no internet required)
- Import data from Excel/ODS files
- Automatic risk calculation with configurable thresholds
- Generate shareable HTML reports
- Re-edit previously generated reports
- Track data overrides with full audit trail

---

## Getting Started

### First-Time Setup

1. Open `cyber-dashboard.html` in a web browser (Chrome, Edge, or Firefox recommended)
2. On first launch, you'll see a **Welcome** dialog with options:
   - **Import settings.json**: Load a previously exported settings file
   - **Drop a report.html**: Extract settings from a previously generated report
   - **Start Fresh**: Begin with a blank configuration

> **Important:** Settings are saved in your browser's local storage. They persist until you clear browser data or use a different browser.

### Directory Structure

For full functionality, ensure these files are in the same folder:
```
/your-folder/
  cyber-dashboard.html
  /libs/
    react.production.min.js
    react-dom.production.min.js
    babel.min.js
    xlsx.full.min.js
    tailwind.min.js
    chart.min.js
```

---

## Main Interface Tabs

### 1. Import Tab

The Import tab is where you load data files or re-edit existing reports.

#### Importing Data Files

The dashboard accepts five types of Excel/ODS files:

| Slot | Purpose | Key Columns |
|------|---------|-------------|
| **VRAM NIPR** | Vulnerability scan data (NIPR network) | Site Name, Last Scan Date, RA VPH, Valid Assets |
| **VRAM SIPR** | Vulnerability scan data (SIPR network) | Site Name, Last Scan Date, RA VPH, Valid Assets |
| **ESS NIPR** | Endpoint security data (NIPR network) | Ships, Product Compliance, Policy Enforced, Assets in Breakfix |
| **ESS SIPR** | Endpoint security data (SIPR network) | Ships, Product Compliance, Policy Enforced, Assets in Breakfix |
| **TAM Overdue** | Technical Assistance Memoranda status | Boat, # Past Due, # Extensions |

**To import files:**
1. Drag and drop files onto the corresponding drop zones, OR
2. Click a drop zone to open a file picker
3. Click **Process & Preview** to generate the report

#### Re-Editing Previous Reports

To modify a previously generated report:
1. Drag and drop the `.html` report file onto the **[RE-EDIT]** zone
2. The report loads with all original settings, data, and overrides
3. You can add new data files to update specific sources

#### Updating Existing Reports

When a report is already loaded:
1. Drop new data files for sources you want to update
2. Click **Update & Preview**
3. Only the dropped sources are updated; other data remains unchanged
4. Overrides for updated fields are replaced; other overrides are preserved

---

### 2. Preview Tab

The Preview tab lets you review and modify data before generating the final report.

#### Sub-Tabs

| Tab | Description |
|-----|-------------|
| **CSL** | Commander, Submarine Force Atlantic boats grouped by ISIC |
| **CSP** | Commander, Submarine Force Pacific boats grouped by ISIC |
| **HQ Status** | High-level metrics aggregated by ISIC for briefings |
| **Analytics** | Charts, statistics, and rankings dashboard |

#### Data Table Features

- **Color Coding:**
  - **Red**: High risk or critical values
  - **Yellow/Amber**: Medium risk or warning values
  - **Green**: Low risk or acceptable values
  - **Blue**: Scan exempt status

- **Clicking Cells:** Click on most data cells to override values manually
  - A modal appears to enter new value and reason
  - Overridden cells show a purple border
  - All overrides are tracked with timestamp and user name

- **Notes Column:** Click to add short notes (max 30 characters) for any boat

- **Risk Level:** Click to manually override calculated risk (HIGH/MED/LOW)

#### Toolbar Actions

- **Filter by ISIC:** Select an ISIC from dropdown to show only those boats
- **Print [Tab Name]:** Open print dialog for the current tab
- **? Button:** View risk calculation reference with current thresholds
- **Generate Report:** Create the final HTML report file

#### Adjust Thresholds

Click **Adjust Thresholds** to temporarily modify risk thresholds for this report:
- Changes here only affect the current report
- Permanent changes should be made in Settings

---

### 3. Settings Tab

Configure boats, ISICs, risk criteria, and file schemas.

#### Sub-Tabs

##### Registry
Manage the boat and ISIC registry:

**Boats:**
- **Boat Name:** Normalized identifier (e.g., SSN-21)
- **Full Name:** Display name (e.g., USS SEAWOLF)
- **ISIC:** Assigned Immediate Superior in Command
- **TYCOM:** Automatically set based on ISIC (CSL or CSP)
- **NMCI:** Check if boat uses NMCI network for NIPR (NIPR data ignored for risk calculation)

**ISICs:**
- **ISIC Name:** Full name (e.g., COMSUBRON 1)
- **Short Name:** Abbreviation (e.g., CSS1)
- **TYCOM:** CSL (Atlantic) or CSP (Pacific)

##### Risk Builder
Configure which criteria trigger each risk level:

**HIGH Risk Triggers** (any single condition):
- Breakfix > 0 (always enabled)
- No VRAM Scan Data (always enabled)
- VPH > threshold (optional)
- Product/Policy Compliance < threshold (optional)
- Scan Age > threshold (optional)
- TAM Past Due > threshold (optional)

**MEDIUM Risk Triggers** (2 or more conditions):
- VPH above threshold
- Product Compliance below threshold
- True/Raw Policy below threshold
- Scan age above threshold
- TAM Past Due above threshold

**LOW Risk Requirements** (all must be met):
- VPH below threshold
- Product Compliance above threshold
- Scans within threshold days
- No HIGH risk triggers

##### Color Scales
Configure cell coloring thresholds for:
- **CSL/CSP Tables:** Product Compliance, Policy Compliance, VPH, Scan Age
- **HQ Status Tables:** Separate thresholds for HQ view

##### Risk Legend
Customize the text displayed in the risk criteria legend on reports.

##### File Schema
Configure which columns to extract from source files:
- **Header Text:** Label shown on reports
- **Excel Column:** Exact column header name in source files
- **Visibility:** Toggle columns on/off
- **Order:** Drag to reorder columns
- **Custom Fields:** Add new fields to extract additional data

#### Settings Management

| Action | Description |
|--------|-------------|
| **Import** | Load settings from a `.json` file |
| **Export** | Download current settings as `.json` |
| **Reset** | Restore factory defaults |
| **Save to My Settings** | When using imported report settings, save as your defaults |

---

## Risk Calculation

### Risk Levels

| Level | Criteria |
|-------|----------|
| **HIGH** | Any breakfix > 0, OR no VRAM scan data, OR exceeds critical thresholds |
| **MED** | 2 or more medium-level conditions met |
| **LOW** | All low-risk criteria met and no HIGH triggers |

### Scan Exempt

Boats marked as "Scan Exempt" have HIGH risk downgraded to MED only when HIGH is due to "No VRAM Scan Data". Other HIGH triggers (breakfix, etc.) are not affected.

For NMCI boats, both NIPR and SIPR must be exempt to apply the override.

### Key Calculations

- **Scan Age** = Days since last VRAM scan date
- **VPH** = Vulnerabilities Per Host (from VRAM RA VPH column)
- **True Policy %** = Policy Enforced × Product Compliance / 100

---

## Generating Reports

### Generate Workflow

1. Review all data in the Preview tab
2. Make any necessary overrides or add notes
3. Click **Generate Report**
4. Acknowledge the chart library notice
5. Enter your name (for attribution)
6. Report downloads as `cyber-report-YYYY-MM-DD.html`

### Report Contents

Generated reports include:
- **CSL Summary:** All CSL boats with full metrics
- **CSP Summary:** All CSP boats with full metrics
- **HQ Status:** Aggregated metrics by ISIC
- **Analytics:** Charts and statistics
- **Changes Tab:** Changelog of data updates and overrides

### Viewing Reports

For charts to display correctly in generated reports:
1. Place the report file in the same directory as the dashboard
2. Ensure the `libs/` folder is present
3. Open the report in a web browser

Reports are fully self-contained for data viewing, but require Chart.js for the Analytics charts.

---

## Common Workflows

### Weekly Report Update

1. Open the dashboard
2. Drop your current week's VRAM, ESS, and TAM files
3. Click **Process & Preview**
4. Review any HIGH risk boats
5. Add notes as needed
6. Click **Generate Report**

### Updating a Single Data Source

1. Drop previous report onto **[RE-EDIT]** zone
2. Drop only the updated file (e.g., new VRAM SIPR)
3. Click **Update & Preview**
4. Notes and non-updated overrides are preserved
5. Generate new report

### Adding a New Boat

1. Go to **Settings > Registry**
2. Click **+ Add Boat**
3. Enter boat name (e.g., SSN-999)
4. Enter full name (e.g., USS NEWBOAT)
5. Select ISIC from dropdown
6. Check NMCI if applicable
7. Click **Save**

### Modifying Risk Criteria

1. Go to **Settings > Risk Builder**
2. Enable/disable criteria checkboxes
3. Adjust thresholds as needed
4. Changes auto-save to browser storage
5. Use **Export** to share settings with others

---

## Tips & Best Practices

### File Naming
Use consistent, descriptive names for source files:
- `VRAM-NIPR-2024-12-09.xlsx`
- `ESS-SIPR-Week49.ods`

### Backup Settings
Periodically export your settings:
1. Go to Settings tab
2. Click **Export**
3. Store the `.json` file safely

### Unregistered Boats Warning
If you see "Unregistered: SSN-XXX..." warning:
- These boats exist in source files but not in your registry
- Add them in Settings > Registry to include them in reports

### Override Audit Trail
All overrides are tracked with:
- Original value
- New value
- Reason
- Timestamp
- User name

View the full override log in the Preview tab.

---

## Troubleshooting

### Charts Not Displaying
- Ensure `libs/` folder is present
- Ensure report is in same directory as dashboard
- Try refreshing the page

### Data Not Matching
- Check column names in Settings > File Schema
- Ensure Excel column headers match exactly
- Header row should be within first 5 rows of file

### Settings Lost
Settings are stored in browser local storage. They may be lost if:
- Browser cache is cleared
- Different browser is used
- Incognito/private mode is used

**Solution:** Always export settings backups and use **Import** to restore.

### Boat Not Appearing
- Verify boat is registered in Settings > Registry
- Check boat name normalization (e.g., "SSN 21" becomes "SSN-21")
- Ensure boat is marked as active

---

## Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Submit modal dialogs | Enter |
| Close modals | Click outside or Cancel button |
| Print current tab | Use browser print (Ctrl/Cmd + P) |

---

## Version Information

- **Application:** SUBFOR Cyber Risk Dashboard v1.0
- **Settings Version:** Tracked in settings metadata
- **Report Version:** Increments with each data update

---

## Support

For issues or feedback:
- Report issues at: https://github.com/TorinTurner/RiskDash/issues
- Contact your local cyber support team
