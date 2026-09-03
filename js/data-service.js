/**
 * Data Service for MedHoldings Capital Executive Mobile Dashboard
 * Manages Google Apps Script Web App / Sheets integration,
 * localStorage offline caching, and realistic default dataset.
 */

const STORAGE_KEY_DATA = 'medholdings_briefings_cache_v2';
const STORAGE_KEY_CONFIG = 'medholdings_config_v2';
const STORAGE_KEY_LAST_SYNC = 'medholdings_last_sync_v2';

// High-fidelity fallback / out-of-the-box data populated from Claude transcript processing
const DEFAULT_SAMPLE_DATA = {
  dailySummaries: [
    {
      date: '2026-09-02',
      displayDate: 'Wednesday, September 2, 2026',
      title: 'Portfolio Executive Review & Q3 Subsidiary Operations',
      meetingType: 'Weekly Executive Operations Call',
      duration: '47 mins',
      processedAt: '2026-09-02 18:35 EDT',
      executivePulse: 'Senior Living portfolio achieved **92.8% occupancy** crossing the target threshold ahead of Q4. Nova Infusion finalized payor credentialing with UnitedHealthcare expanding regional network access across 6 ambulatory clinics. AxisCare rolled out pilot automated dispatch reducing caregiver travel overhead by 14.2%.',
      recordingSummary: `### Strategic Overview
Today's portfolio operations review focused on capital allocation across ambulatory infusion centers and resolving regional staffing constraints in the midwestern Senior Living facilities. **MedHoldings executive leadership agreed to accelerate Nova Infusion Clinic #7 opening** to capture unmet biologic therapy demand.

### Key Decisions & Executive Directives
- **Approved Capex Expansion:** Authorized **$1.2M** tranche for Nova Infusion Clinic #7 facility buildout in North Columbus. Target opening moved up to **November 15, 2026**.
- **Labor Rate Harmonization:** Authorized regional floating nursing pool for Senior Living cluster to reduce premium agency nurse spend by **$42k/month**.
- **Commercial Contract Signoff:** Finalized UnitedHealthcare commercial network inclusion for specialty infusions, effective October 1.

### Cross-Facility Highlights
- **Nova Infusion:** Daily chair utilization averaged **88.4%** across all 6 operational sites. Average patient dwell time decreased from 210 mins to **178 mins** with fast-track premedication protocol.
- **Senior Living Holdings:** 14 out of 16 communities maintained zero open state survey tags. Resident satisfaction index scored **94.2/100**.
- **AxisCare Home Health:** Active patient census reached **1,420** (+3.8% MoM). 30-day rehospitalization rate maintained at a record low of **8.1%** (national benchmark: 14.2%).

### Emerging Strategic Considerations
- **Supply Chain Watch:** Immunoglobulin (IVIG) allocation quotas remain tight for Q4. Procurement team secured 90-day reserve stock at contracted rate tier.
- **State Licensing Update:** Ohio Board of Pharmacy pre-inspection passed with zero citations for the new ambulatory compounding room.`,
      tags: ['Portfolio Review', 'Capex', 'Nova Infusion', 'Senior Living', 'Payor Contracts']
    },
    {
      date: '2026-09-01',
      displayDate: 'Tuesday, September 1, 2026',
      title: 'AxisCare Telehealth Transition & Clinical Quality Briefing',
      meetingType: 'Subsidiary Leadership Check-in',
      duration: '35 mins',
      processedAt: '2026-09-01 17:15 EDT',
      executivePulse: 'AxisCare completed pilot validation of the remote patient monitoring (RPM) program for heart failure patients, demonstrating a **38% reduction in acute escalations**. Clinician recruitment pipeline added 6 full-time physical therapists in the southern region. Medicare Advantage billing review yielded zero audit discrepancies.',
      recordingSummary: `### Clinical Leadership Summary
Dr. Alistair and AxisCare leadership presented the 60-day readmission study for the post-acute CHF cohort. Remote physiological monitoring integrated into the nurse dashboard enabled proactive diuretic titration before emergency department presentations occurred.

### Key Executive Action Items
- **RPM Service Line Expansion:** Expand RPM kits from 120 current patients to **450 active enrollees** by end of October.
- **OASIS Quality Scoring:** Clinical documentation accuracy hit **98.4%**, placing AxisCare in the top decile for CMS value-based purchasing bonus brackets.
- **Billing Integration:** Cleared backlogged episodic billing adjustments with Anthem and Humana, recapturing **$185,000** in accelerated cash collections.

### Operational Notes
- Caregiver turnover dropped to **19.4%** annualized (compared to the 34% home health national average) following the retention wage adjustment enacted in July.`,
      tags: ['AxisCare', 'Clinical Quality', 'RPM', 'CMS Compliance']
    },
    {
      date: '2026-08-31',
      displayDate: 'Monday, August 31, 2026',
      title: 'MedHoldings Monthly Capital Allocation & M&A Pipeline',
      meetingType: 'Investment Committee Sync',
      duration: '58 mins',
      processedAt: '2026-08-31 19:40 EDT',
      executivePulse: 'Investment committee reviewed 3 prospective post-acute care acquisitions in North Carolina and Virginia with aggregate revenue of **$28M**. Nova Infusion EBITDA margin expanded to **24.6%** driven by drug procurement rebates. Senior Living debt refinance closed with regional banking syndicate lowering weighted cost of debt by **65 bps**.',
      recordingSummary: `### Executive Investment Briefing
Reviewed Q3 pipeline performance and credit facility availability. Total liquidity across MedHoldings Capital stands at **$34.8M** in cash and committed revolvers, providing full dry powder for targeted bolt-on acquisitions.

### Pipeline Updates
- **Project Blue Ridge (Virginia Home Health):** Quality of Earnings (QoE) completed. Confirmed $2.4M adjusted EBITDA on $14M revenue. Moving to definitive purchase agreement drafting.
- **Project Cardinal (Raleigh Infusion Suite):** In exclusivity. Target close: November 30.
- **Refinance Execution:** Signed amended credit facility terms with Fifth Third Bank. Saves **$310k annually** in net interest carrying costs.`,
      tags: ['M&A', 'Investment Committee', 'Liquidity', 'Debt Facility']
    },
    {
      date: '2026-08-28',
      displayDate: 'Friday, August 28, 2026',
      title: 'Senior Living Regional Directors & Facility Operations Standup',
      meetingType: 'Operations Standup',
      duration: '40 mins',
      processedAt: '2026-08-28 16:20 EDT',
      executivePulse: 'Regional leadership reported strong tour-to-move-in conversion rates (**44% vs 38% industry avg**) across the Memory Care communities. Dietary vendor consolidation completed on schedule, generating projected annual savings of **$240k**. Fire safety and life safety annual audits achieved 100% compliance across all 16 buildings.',
      recordingSummary: `### Operations Rollup
Memory care units continue to drive the highest margin contribution across the portfolio. Family satisfaction Net Promoter Score (NPS) reached **+68**, up 9 points from Q1.

### Operational Directives
- Standardized the resident wellness app rollout across all communities by September 15.
- Approved energy management automation contract for HVAC controls, eligible for $60k in utility efficiency rebates.`,
      tags: ['Senior Living', 'Operations', 'Occupancy', 'Cost Savings']
    },
    {
      date: '2026-08-27',
      displayDate: 'Thursday, August 27, 2026',
      title: 'Nova Infusion Clinical Operations & Payor Contracting Review',
      meetingType: 'Clinical & Commercial Review',
      duration: '50 mins',
      processedAt: '2026-08-27 18:00 EDT',
      executivePulse: 'Reviewed payor mix transition showing commercial contracts now account for **62% of infusion revenue** (up from 51% in 2025). Oncology supportive care volume grew **18% MoM** following partnership with Regional Cancer Specialists. Pharmacy clean claim rate achieved **99.1%** with zero denial spikes.',
      recordingSummary: `### Commercial & Clinical Highlights
The shift towards ambulatory non-hospital infusion continues to deliver strong arbitrage against hospital outpatient departments (HOPD). Payors are actively directing rheumatology and neurology patients to Nova Infusion centers due to 40% lower total cost of care.

### Next Steps
- Implement streamlined automated prior authorization tool with covermymeds integration to shorten order-to-chair cycle from 7 days to 72 hours.`,
      tags: ['Nova Infusion', 'Commercial Payors', 'Prior Auth', 'Oncology']
    }
  ],
  weeklySyntheses: [
    {
      weekId: '2026-W36',
      weekRange: 'Aug 31 – Sep 6, 2026',
      status: 'Current Week',
      headline: 'Accelerating Organic Margin Expansion & Ambulatory Infusion Footprint',
      executiveSummary: `This week reflected strong cross-subsidiary operational discipline. **Senior Living portfolio crossed 92.8% occupancy**, Nova Infusion locked in commercial payor contracting with UnitedHealthcare, and debt refinancing successfully concluded to free **$310k in annual cash savings**.

Claude MCP processing analyzed 5 executive transcripts totaling 230 minutes of operational dialogue, identifying strong tailwinds in specialty infusion demand and stabilising post-acute nursing retention.`,
      keyAccomplishments: [
        '**Senior Living Occupancy Record:** Reached 92.8% portfolio average, reducing concession discounts by 30%.',
        '**Nova Infusion Network Win:** Signed full commercial contract with UHC for 6 ambulatory infusion suites.',
        '**Debt Refinancing Closed:** Re-priced bank syndicate facility saving 65 bps in spread.',
        '**AxisCare RPM Validation:** 38% reduction in CHF hospital readmissions demonstrated in clinical review.'
      ],
      emergingTrends: [
        {
          title: 'Shift from Inpatient to Ambulatory Specialty Care',
          detail: 'Commercial payors are aggressively incentivizing independent ambulatory infusion centers over health systems. Nova Infusion is positioned to capture this migration with 40% lower delivery cost.',
          sentiment: 'positive'
        },
        {
          title: 'Direct Nursing Pool Stabilization',
          detail: 'Agency nursing dependency dropped from 14% to 5.2% across senior communities over the past 60 days, reversing the primary cost inflator of 2025.',
          sentiment: 'positive'
        },
        {
          title: 'Biologic Drug Procurement Allocation',
          detail: 'National specialty pharma allocations for IVIG and specific monoclonal antibodies require proactive distributor pre-purchasing. Cash buffer allocated accordingly.',
          sentiment: 'neutral'
        }
      ],
      executiveWatchlist: [
        'Monitor Project Blue Ridge definitive documentation and Virginia regulatory transfer approvals.',
        'Track construction milestones for Nova Infusion Clinic #7 (North Columbus site).',
        'Confirm launch of automated prior authorization workflow by September 15.'
      ]
    },
    {
      weekId: '2026-W35',
      weekRange: 'Aug 24 – Aug 30, 2026',
      status: 'Prior Week',
      headline: 'Post-Acute Clinical Quality Milestones & Capex Governance',
      executiveSummary: `Prior week focused on standardizing clinical workflows in AxisCare and finalizing vendor consolidation for Senior Living facilities. Capital expenditures tracking remains within 2.1% of budget across all subsidiary projects.`,
      keyAccomplishments: [
        '**OASIS Documentation Accuracy:** Ranked in top 10% nationwide for CMS value-based incentive.',
        '**Dietary Vendor Consolidation:** Executed master food distribution contract saving $240k annualized.',
        '**Ambulatory Pharmacy Clean Inspections:** Ohio Board of Pharmacy pre-inspection passed with zero citations.'
      ],
      emergingTrends: [
        {
          title: 'Value-Based Purchasing Quality Multipliers',
          detail: 'Consistent documentation compliance is creating an estimated $350k upward reimbursement adjustment for 2027 fiscal year.',
          sentiment: 'positive'
        },
        {
          title: 'Home Health Labor Regional Divergence',
          detail: 'Physical therapy staffing remains tighter in rural territories while nursing recruitment has normalized.',
          sentiment: 'neutral'
        }
      ],
      executiveWatchlist: [
        'Complete Q3 Quality of Earnings review for Project Blue Ridge acquisition.',
        'Finalize commercial rates for specialty infusion network inclusion.'
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
   * Fetches the latest data from configured Google Apps Script Web App or Google Sheets CSV endpoint.
   * If not configured or if network fails, gracefully returns cached or default sample data.
   */
  async fetchData(forceRefresh = false) {
    const url = this.config.appsScriptUrl ? this.config.appsScriptUrl.trim() : '';

    if (!url) {
      // If no remote URL configured, ensure we have at least the rich sample dataset
      if (!this.data || !this.data.dailySummaries || this.data.dailySummaries.length === 0) {
        this.saveCache(DEFAULT_SAMPLE_DATA);
      }
      return {
        success: true,
        source: 'local_cache',
        data: this.data,
        message: 'Loaded from local storage. Add Google Sheets URL in settings to connect live.'
      };
    }

    try {
      // Add cache buster if force refresh
      const fetchUrl = forceRefresh ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} from Google endpoint`);
      }

      const raw = await response.json();
      const normalizedData = this.normalizeResponse(raw);

      if (normalizedData && normalizedData.dailySummaries && normalizedData.dailySummaries.length > 0) {
        this.saveCache(normalizedData);
        return {
          success: true,
          source: 'remote',
          data: normalizedData,
          message: 'Synced successfully with Google Sheets database.'
        };
      } else {
        throw new Error('Endpoint returned empty or invalid schema');
      }
    } catch (err) {
      console.warn('Sync failed, falling back to local cached data:', err);
      return {
        success: false,
        source: 'cache_fallback',
        error: err.message,
        data: this.data,
        message: `Offline or Google Sheets sync issue: ${err.message}. Showing cached data.`
      };
    }
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
        // Daily Recording Summary entry
        dailySummaries.push({
          date: dateVal,
          displayDate: row.Display_Date || this.formatDateString(dateVal),
          title: row.Title || row.Meeting_Title || 'Executive Daily Recording Briefing',
          meetingType: row.Meeting_Type || 'Transcript Ingestion',
          duration: row.Duration || 'Recorded Session',
          processedAt: row.Processed_At || dateVal,
          executivePulse: row.Executive_Summary || row.Executive_Pulse || '',
          recordingSummary: row.Recording_Summary || row.Transcript_Summary || row.Summary || '',
          tags: this.parseTags(row.Tags || row.Subsidiaries)
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
