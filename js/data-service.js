/**
 * Data Service for MedHoldings Capital Executive Mobile Dashboard
 * Manages Google Apps Script Web App / Sheets integration,
 * localStorage offline caching, and realistic default dataset.
 */

const STORAGE_KEY_DATA = 'medholdings_briefings_cache_v2';
const STORAGE_KEY_CONFIG = 'medholdings_config_v2';
const STORAGE_KEY_LAST_SYNC = 'medholdings_last_sync_v2';

// Clean preview template awaiting live inputs from Claude MCP / Google Sheets
const DEFAULT_SAMPLE_DATA = {
  dailySummaries: [
    {
      date: '2026-09-02',
      displayDate: 'Wednesday, September 2, 2026',
      title: 'Daily Briefing (Awaiting Claude Inputs)',
      meetingType: 'Claude Transcript Feed',
      duration: 'Live Feed Pending',
      processedAt: 'Ready for Google Sheets Sync',
      executivePulse: 'This is an interface preview demonstrating how Claude transcript summaries appear. Once you connect your Google Sheet or Claude script, your actual executive recordings, highlights, and directives will automatically display here.',
      recordingSummary: `### What Will Appear Here
Claude's daily transcript processing script will automatically populate Google Sheets with your real briefings, rendering here in real time:

- **Executive Takeaways:** Core strategic movements and high-priority decisions distilled by Claude.
- **Operational Highlights:** Key metrics and discussions from your recordings.
- **Next Steps & Focus Areas:** Action items and watchlist points flagged during the session.

### Connecting Your Live Claude Sheet
1. Tap the **⚙ (gear)** icon in the top right of the dashboard.
2. Enter your Google Apps Script Web App URL (from the included \`google-apps-script.js\`).
3. Tap **Save & Re-sync** to immediately load your actual data.`,
      tags: ['Claude Feed', 'Live Sync Ready', 'Executive Brief']
    }
  ],
  weeklySyntheses: [
    {
      weekId: '2026-W36',
      weekRange: 'Aug 31 – Sep 6, 2026',
      status: 'Current Week',
      headline: 'Weekly Operational Rollup & Synthesis',
      executiveSummary: `At the end of each operational cycle, Claude aggregates your daily conversation transcripts into cross-facility synthesis, emerging trends, and strategic milestones.`,
      keyAccomplishments: [
        'Weekly accomplishments and closed directives identified by Claude will be listed here.',
        'Cross-facility milestones automatically aggregated from daily logs.'
      ],
      emergingTrends: [
        {
          title: 'Emerging Operational Trends',
          detail: 'Claude analyzes patterns across daily transcripts (e.g. facility census, operational efficiency, regulatory notices) and highlights trends with sentiment tags.',
          sentiment: 'positive'
        }
      ],
      executiveWatchlist: [
        'Unresolved follow-ups and upcoming leadership deadlines flagged by Claude will appear here.'
      ]
    }
  ]
};

class DataService {
  constructor() {
    this.config = this.loadConfig();
    this.data = this.loadCachedData() || DEFAULT_SAMPLE_DATA;
    this.lastSync = this.loadLastSync();
    this.listeners = [];
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to parse config from localStorage', e);
    }
    return {
      appsScriptUrl: '',
      sheetId: '',
      autoRefreshIntervalMins: 30
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Failed to save config to localStorage', e);
    }
  }

  loadCachedData() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_DATA);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cache from localStorage', e);
    }
    return null;
  }

  saveCache(data) {
    this.data = data;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        this.lastSync = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, this.lastSync);
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to cache data to localStorage', e);
    }
  }

  loadLastSync() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null;
      }
    } catch (e) {
      console.warn('Failed to read last sync time', e);
    }
    return null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error('Error in listener', e); }
    });
  }

  /**
   * Fetches the latest data from configured Google Sheet URL or Apps Script Web App.
   * Supports:
   * 1. Direct Google Sheet link: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
   * 2. Google Sheet ID directly
   * 3. Google Apps Script Web App URL: https://script.google.com/macros/s/<ID>/exec
   */
  async fetchData(forceRefresh = false) {
    const rawInput = this.config.appsScriptUrl ? this.config.appsScriptUrl.trim() : '';

    if (!rawInput) {
      if (!this.data || !this.data.dailySummaries || this.data.dailySummaries.length === 0) {
        this.saveCache(DEFAULT_SAMPLE_DATA);
      }
      return {
        success: true,
        source: 'local_cache',
        data: this.data,
        message: 'Paste your Google Sheet link in settings (⚙) to stream live briefings.'
      };
    }

    try {
      // Check if input is a direct Google Sheet link or raw Sheet ID
      const sheetMatch = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || 
                         (!rawInput.includes('http') && rawInput.length > 20 ? [null, rawInput] : null);

      let normalizedData = null;

      if (sheetMatch && sheetMatch[1]) {
        // Direct Google Sheet mode via public CSV / GViz
        const sheetId = sheetMatch[1];
        const cacheBust = forceRefresh ? `&_t=${Date.now()}` : '';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${cacheBust}`;
        
        const response = await fetch(csvUrl, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Google Sheet returned HTTP ${response.status}. Ensure sheet sharing is set to "Anyone with the link can view".`);
        }
        const csvText = await response.text();
        const rows = this.parseCSV(csvText);
        normalizedData = this.normalizeResponse(rows);
      } else {
        // Google Apps Script Web App JSON mode
        const fetchUrl = forceRefresh ? `${rawInput}${rawInput.includes('?') ? '&' : '?'}t=${Date.now()}` : rawInput;
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} from Google Apps Script endpoint`);
        }

        const raw = await response.json();
        normalizedData = this.normalizeResponse(raw);
      }

      if (normalizedData && normalizedData.dailySummaries && normalizedData.dailySummaries.length > 0) {
        this.saveCache(normalizedData);
        return {
          success: true,
          source: 'remote',
          data: normalizedData,
          message: 'Synced successfully with Google Sheets database.'
        };
      } else {
        throw new Error('Sheet returned empty or unrecognized columns');
      }
    } catch (err) {
      console.warn('Sync failed, falling back to cached data:', err);
      return {
        success: false,
        source: 'cache_fallback',
        error: err.message,
        data: this.data,
        message: `Sync issue: ${err.message}. Showing cached data.`
      };
    }
  }

  /**
   * RFC 4180 compliant CSV parser for Google Sheets exports
   */
  parseCSV(text) {
    if (!text) return [];
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentVal.trim());
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || currentRow.length > 0) {
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
    }

    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.replace(/^["']|["']$/g, '').trim());
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(c => !c)) continue;
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j] || '';
      }
      data.push(obj);
    }
    return data;
  }

  /**
   * Normalizes arbitrary Apps Script or Sheets JSON schema into MedHoldings Dashboard structure
   */
  normalizeResponse(raw) {
    // If it's already in our exact format:
    if (raw && raw.dailySummaries) {
      return {
        dailySummaries: raw.dailySummaries,
        weeklySyntheses: raw.weeklySyntheses || DEFAULT_SAMPLE_DATA.weeklySyntheses
      };
    }

    // If it's a flat list of rows from Google Sheets (e.g. { rows: [...] } or [...])
    const rows = Array.isArray(raw) ? raw : (raw.rows || raw.data || []);
    if (!rows.length) return null;

    const dailySummaries = [];
    const weeklySyntheses = [];

    rows.forEach(row => {
      // Handle Date formats: YYYY-MM-DD or standard Date string
      let dateVal = row.Date || row.date || '';
      if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString().split('T')[0];
      } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
        dateVal = dateVal.split('T')[0];
      }

      if (row.Weekly_Synthesis || row.weekly_synthesis || row.Type === 'Weekly') {
        // Treat as weekly entry
        weeklySyntheses.push({
          weekId: row.Week_ID || `W-${dateVal}`,
          weekRange: row.Week_Range || row.Date_Range || dateVal,
          status: row.Status || 'Rollup',
          headline: row.Headline || row.Title || 'Weekly Operational Synthesis',
          executiveSummary: row.Weekly_Synthesis || row.Executive_Summary || '',
          keyAccomplishments: this.parseList(row.Accomplishments || row.Key_Accomplishments),
          emergingTrends: this.parseTrends(row.Emerging_Trends || row.Trends),
          executiveWatchlist: this.parseList(row.Watchlist || row.Next_Steps)
        });
      } else if (dateVal) {
        // Daily Recording Summary entry from Claude MCP
        let summaryContent = row.Recording_Summary || row.Transcript_Summary || row.Summary || '';
        
        if (!summaryContent) {
          const sections = [];
          if (row.Subsidiary_Breakdowns) {
            sections.push(`### Subsidiary & Operations Breakdown\n${row.Subsidiary_Breakdowns}`);
          }
          if (row.Decisions_Logged) {
            sections.push(`### Key Decisions Logged\n${row.Decisions_Logged}`);
          }
          if (row.Action_Items) {
            sections.push(`### Action Items & Deliverables\n${row.Action_Items}`);
          }
          if (row.Strategic_Risks) {
            sections.push(`### Strategic Risks & Governance\n${row.Strategic_Risks}`);
          }
          if (row.Healthcare_Glossary) {
            sections.push(`### Executive Healthcare Glossary\n${row.Healthcare_Glossary}`);
          }
          summaryContent = sections.join('\n\n');
        }

        // Auto-extract tags from breakdowns if Tags column is empty
        let tags = this.parseTags(row.Tags || row.Subsidiaries);
        if (!tags.length && row.Subsidiary_Breakdowns) {
          const matches = row.Subsidiary_Breakdowns.match(/\*\*\[(.*?)\]\*\*/g);
          if (matches) {
            tags = matches
              .map(m => m.replace(/\*\*\[|\]\*\*/g, '').split('/')[0].trim())
              .filter((v, i, a) => a.indexOf(v) === i && !v.includes('No material'))
              .slice(0, 4);
          }
        }
        if (!tags.length) {
          tags = ['MedHoldings', 'Network Operations', 'Strategy'];
        }

        dailySummaries.push({
          date: dateVal,
          displayDate: row.Display_Date || this.formatDateString(dateVal),
          title: row.Title || row.Meeting_Title || 'Executive Daily Briefing',
          meetingType: row.Meeting_Type || 'Claude Audio Intelligence',
          duration: row.Duration || 'Daily Ingestion',
          processedAt: row.Processed_At || dateVal,
          executivePulse: row.Executive_Summary || row.Executive_Pulse || '',
          recordingSummary: summaryContent,
          tags: tags
        });
      }
    });

    // Sort daily entries descending by date
    dailySummaries.sort((a, b) => (b.date > a.date ? 1 : -1));

    return {
      dailySummaries: dailySummaries.length ? dailySummaries : DEFAULT_SAMPLE_DATA.dailySummaries,
      weeklySyntheses: weeklySyntheses.length ? weeklySyntheses : DEFAULT_SAMPLE_DATA.weeklySyntheses
    };
  }

  parseList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val
        .split('\n')
        .map(s => s.replace(/^[-*•]\s+/, '').trim())
        .filter(Boolean);
    }
    return [];
  }

  parseTags(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.split(/[,|]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  parseTrends(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Not JSON, parse lines
      }
      return val.split('\n').filter(Boolean).map(line => ({
        title: line.replace(/^[-*•]\s+/, ''),
        detail: '',
        sentiment: 'neutral'
      }));
    }
    return [];
  }

  formatDateString(isoDate) {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {
      // fallback
    }
    return isoDate;
  }

  getAllDates() {
    if (!this.data || !this.data.dailySummaries) return [];
    return this.data.dailySummaries.map(s => s.date);
  }

  getSummaryByDate(dateStr) {
    if (!this.data || !this.data.dailySummaries) return null;
    return this.data.dailySummaries.find(s => s.date === dateStr) || null;
  }

  getLatestDate() {
    const dates = this.getAllDates();
    return dates.length > 0 ? dates[0] : '2026-09-02';
  }

  getWeeklySyntheses() {
    return (this.data && this.data.weeklySyntheses) || DEFAULT_SAMPLE_DATA.weeklySyntheses;
  }

  resetToDefaultData() {
    this.saveCache(DEFAULT_SAMPLE_DATA);
    return DEFAULT_SAMPLE_DATA;
  }
}

export const dataService = new DataService();
