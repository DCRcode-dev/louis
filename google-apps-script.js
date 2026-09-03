/**
 * ==============================================================================
 * MEDHOLDINGS CAPITAL - GOOGLE APPS SCRIPT WEB APP ENDPOINT
 * ==============================================================================
 * This script connects your Master Google Sheet (autopopulated daily by Claude MCP
 * transcript processing) to the MedHoldings Executive Mobile Web Dashboard.
 *
 * HOW TO DEPLOY IN 60 SECONDS:
 * 1. Open your Google Sheet that Claude MCP updates.
 * 2. Click Extensions > Apps Script in the Google Sheets top menu.
 * 3. Delete any code in the editor, and paste this entire file.
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Click the gear icon next to "Select type" > choose "Web app".
 * 6. Under "Execute as", select: "Me".
 * 7. Under "Who has access", select: "Anyone" (allows your mobile PWA to fetch the data).
 * 8. Click "Deploy", authorize access, and copy the Web App URL.
 * 9. Paste that URL into the MedHoldings mobile app (tap the gear icon in the top right).
 * ==============================================================================
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Read Daily Briefings sheet (defaults to first sheet if not named explicitly)
    let dailySheet = ss.getSheetByName("Daily_Briefings") || ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    const dailyData = readSheetRows(dailySheet);

    // 2. Read Weekly Synthesis sheet (if exists)
    let weeklySheet = ss.getSheetByName("Weekly_Synthesis") || ss.getSheetByName("Synthesis");
    const weeklyData = weeklySheet ? readSheetRows(weeklySheet) : [];

    const payload = {
      status: "success",
      syncedAt: new Date().toISOString(),
      rows: dailyData,
      weeklyRows: weeklyData
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errorPayload = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to convert sheet rows into JSON object array based on header row
 */
function readSheetRows(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  // Headers from row 1
  const headers = values[0].map(h => String(h).trim());
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Skip completely empty rows
    if (row.every(cell => cell === "" || cell === null)) continue;

    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let val = row[j];

      // Convert Date objects to ISO string YYYY-MM-DD
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        val = `${y}-${m}-${d}`;
      }
      rowObj[header] = val;
    }
    rows.push(rowObj);
  }

  return rows;
}
