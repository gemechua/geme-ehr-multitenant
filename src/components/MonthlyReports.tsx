import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Calendar, User, Trash2, 
  Download, RefreshCw, CheckCircle2, ChevronRight, HelpCircle,
  HeartPulse, DollarSign, Compass, FlaskConical, FileText, UserCheck, 
  Activity, Skull, Sparkles, Warehouse, Coins, Check, FileDown, Eye
} from 'lucide-react';

// Monthly Report schema structure
export interface MonthlyReport {
  id: string;
  departmentId: string;
  month: string;        // e.g. "2026-06"
  author: string;       // e.g. "Dr. Marcus Vance"
  createdAt: string;
  data: Record<string, any>; // Dynamic attributes depending on department
}

// Field definition metadata for each department schema
interface FieldSchema {
  key: string;
  label: string;
  type: 'number' | 'text' | 'percentage' | 'currency' | 'select';
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
  suffix?: string;
  prefix?: string;
}

// Map of all 12 departments with their names, styling, icons, and exact fields schema
const DEPARTMENT_METADATA: Record<string, {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: FieldSchema[];
}> = {
  dispensary: {
    label: 'Dispensary & Prescriptions',
    icon: HeartPulse,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
    fields: [
      { key: 'totalDispensed', label: 'Total Prescriptions Dispensed', type: 'number', placeholder: 'e.g. 4200', min: 0 },
      { key: 'stockOutIncidents', label: 'Stock-Out Incidents Checked', type: 'number', placeholder: 'e.g. 3', min: 0 },
      { key: 'discrepanciesFlagged', label: 'Discrepancies Audited', type: 'number', placeholder: 'e.g. 1', min: 0 },
      { key: 'formulationsInspected', label: 'Formulations Checked', type: 'number', placeholder: 'e.g. 150', min: 0 },
      { key: 'complianceRate', label: 'Storage Temp Compliance', type: 'percentage', placeholder: 'e.g. 98.5', min: 0, max: 100 }
    ]
  },
  finance: {
    label: 'Finance & Accounts',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    fields: [
      { key: 'grossRevenue', label: 'Total Gross Revenue', type: 'currency', placeholder: 'e.g. 245000', min: 0 },
      { key: 'operatingExpenses', label: 'Operating Expenditures', type: 'currency', placeholder: 'e.g. 185000', min: 0 },
      { key: 'budgetVariance', label: 'Spend Variance Dev.', type: 'percentage', placeholder: 'e.g. -2.4', min: -100, max: 100 },
      { key: 'unreconciledCount', label: 'Unreconciled Variances', type: 'number', placeholder: 'e.g. 0', min: 0 },
      { key: 'auditStatus', label: 'Financial Audit Status', type: 'select', options: ['Approved', 'Pending Review', 'Discrepancy'] }
    ]
  },
  radiology: {
    label: 'Radiology Imaging',
    icon: Compass,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    fields: [
      { key: 'totalScans', label: 'Total Diagnostic Scans', type: 'number', placeholder: 'e.g. 850', min: 0 },
      { key: 'avgTurnaround', label: 'Average Turnaround Time', type: 'number', suffix: ' hrs', placeholder: 'e.g. 3.2', min: 0 },
      { key: 'calibrationChecks', label: 'Shield & Emission Tests', type: 'number', placeholder: 'e.g. 4', min: 0 },
      { key: 'safetyScore', label: 'Radiation Safety Score', type: 'percentage', placeholder: 'e.g. 99.2', min: 0, max: 100 }
    ]
  },
  laboratory: {
    label: 'Laboratory Diagnostics',
    icon: FlaskConical,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
    fields: [
      { key: 'specimensProcessed', label: 'Specimens Processed', type: 'number', placeholder: 'e.g. 12500', min: 0 },
      { key: 'criticalNotifications', label: 'Panic Values Notified', type: 'number', placeholder: 'e.g. 14', min: 0 },
      { key: 'tempAlarms', label: 'Temp Range Alarms', type: 'number', placeholder: 'e.g. 0', min: 0 },
      { key: 'analyzerCalibrations', label: 'Analyzer Calibration Runs', type: 'number', placeholder: 'e.g. 30', min: 0 }
    ]
  },
  liaison: {
    label: 'Hospital Liaison',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
    fields: [
      { key: 'satisfactionIndex', label: 'Patient Satisfaction Score', type: 'percentage', placeholder: 'e.g. 94.8', min: 0, max: 100 },
      { key: 'transfersOut', label: 'Inter-facility Transfers Out', type: 'number', placeholder: 'e.g. 12', min: 0 },
      { key: 'transfersIn', label: 'Inter-facility Transfers In', type: 'number', placeholder: 'e.g. 24', min: 0 },
      { key: 'casesResolved', label: 'Liaison Patient Cases Solved', type: 'number', placeholder: 'e.g. 45', min: 0 }
    ]
  },
  outpatient: {
    label: 'Outpatient Services',
    icon: UserCheck,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-100',
    fields: [
      { key: 'totalConsultations', label: 'Walk-in Consultations', type: 'number', placeholder: 'e.g. 3400', min: 0 },
      { key: 'avgWaitTime', label: 'Average Wait Time', type: 'number', suffix: ' mins', placeholder: 'e.g. 24', min: 0 },
      { key: 'noShowRate', label: 'Patient No-Show Rate', type: 'percentage', placeholder: 'e.g. 8.4', min: 0, max: 100 },
      { key: 'referralsGenerated', label: 'Referrals Letters Issued', type: 'number', placeholder: 'e.g. 220', min: 0 }
    ]
  },
  inpatient: {
    label: 'Inpatient Wards',
    icon: Activity,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-100',
    fields: [
      { key: 'bedAdmissions', label: 'Total Bed Admissions', type: 'number', placeholder: 'e.g. 450', min: 0 },
      { key: 'avgStayLength', label: 'Average Length of Stay', type: 'number', suffix: ' days', placeholder: 'e.g. 4.5', min: 0 },
      { key: 'occupancyRate', label: 'Ward Occupancy Rate', type: 'percentage', placeholder: 'e.g. 82.3', min: 0, max: 100 },
      { key: 'infectionRate', label: 'Hospital-Acquired Infection %', type: 'percentage', placeholder: 'e.g. 0.12', min: 0, max: 100 }
    ]
  },
  death: {
    label: 'Mortality & Death Audits',
    icon: Skull,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-100',
    fields: [
      { key: 'totalMortalities', label: 'Total Mortalities Logged', type: 'number', placeholder: 'e.g. 4', min: 0 },
      { key: 'autopsiesConducted', label: 'Autopsies Ordered/Conducted', type: 'number', placeholder: 'e.g. 1', min: 0 },
      { key: 'auditsCompleted', label: 'Clinical Death Reviews Completed', type: 'number', placeholder: 'e.g. 4', min: 0 },
      { key: 'discrepancyRate', label: 'Unexpected Death Review Flag %', type: 'percentage', placeholder: 'e.g. 0.0', min: 0, max: 100 }
    ]
  },
  performance: {
    label: 'Performance & Quality',
    icon: Sparkles,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-100',
    fields: [
      { key: 'guidelineCompliance', label: 'Clinical Guideline Adherence', type: 'percentage', placeholder: 'e.g. 96.5', min: 0, max: 100 },
      { key: 'nearMissEvents', label: 'Near-Miss Incidents Audited', type: 'number', placeholder: 'e.g. 2', min: 0 },
      { key: 'handHygieneRate', label: 'Hand Hygiene Conformity', type: 'percentage', placeholder: 'e.g. 98.0', min: 0, max: 100 },
      { key: 'activeCaps', label: 'Active Corrective Actions (CAPA)', type: 'number', placeholder: 'e.g. 1', min: 0 }
    ]
  },
  inventory: {
    label: 'Inventory & Supplies',
    icon: Warehouse,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
    fields: [
      { key: 'purchaseOrders', label: 'Purchase Orders Executed', type: 'number', placeholder: 'e.g. 110', min: 0 },
      { key: 'criticalStockouts', label: 'Critical Stockout Incidents', type: 'number', placeholder: 'e.g. 0', min: 0 },
      { key: 'inventoryValue', label: 'Total Stock Valuation', type: 'currency', placeholder: 'e.g. 84000', min: 0 },
      { key: 'disposedExpired', label: 'Disposed/Expired Roster Count', type: 'number', placeholder: 'e.g. 45', min: 0 }
    ]
  },
  insurance: {
    label: 'Insurance & Claims',
    icon: FileSpreadsheet,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    fields: [
      { key: 'claimsSubmitted', label: 'Total Billing Claims Sent', type: 'number', placeholder: 'e.g. 1450', min: 0 },
      { key: 'acceptanceRate', label: 'Initial Claim Acceptance Rate', type: 'percentage', placeholder: 'e.g. 95.4', min: 0, max: 100 },
      { key: 'disputedAppeals', label: 'Disputed Claims in Appeal', type: 'number', placeholder: 'e.g. 18', min: 0 },
      { key: 'avgRecoveryDays', label: 'Avg Claims Recovery Speed', type: 'number', suffix: ' days', placeholder: 'e.g. 14.5', min: 0 }
    ]
  },
  cashiers: {
    label: 'Cashier & Revenue',
    icon: Coins,
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-100',
    fields: [
      { key: 'cashCollected', label: 'Cash Drawer Receipts', type: 'currency', placeholder: 'e.g. 45000', min: 0 },
      { key: 'digitalCollected', label: 'Digital/POS Collections', type: 'currency', placeholder: 'e.g. 195000', min: 0 },
      { key: 'varianceAmt', label: 'Register Variance / Shortfalls', type: 'currency', placeholder: 'e.g. 0', min: -500, max: 500 },
      { key: 'terminalAudits', label: 'POS Terminal Safety Audits', type: 'number', placeholder: 'e.g. 8', min: 0 }
    ]
  }
};

const INITIAL_REPORTS: MonthlyReport[] = [
  // Dispensary
  { id: 'REP-DIS-2605', departmentId: 'dispensary', month: '2026-05', author: 'Robert Sinclair', createdAt: '2026-05-28T16:45:00Z', data: { totalDispensed: 4120, stockOutIncidents: 4, discrepanciesFlagged: 1, formulationsInspected: 120, complianceRate: 98.0 } },
  { id: 'REP-DIS-2606', departmentId: 'dispensary', month: '2026-06', author: 'Robert Sinclair', createdAt: '2026-06-29T11:30:00Z', data: { totalDispensed: 4350, stockOutIncidents: 2, discrepanciesFlagged: 0, formulationsInspected: 145, complianceRate: 99.4 } },
  
  // Finance
  { id: 'REP-FIN-2605', departmentId: 'finance', month: '2026-05', author: 'John Doe', createdAt: '2026-06-02T10:15:00Z', data: { grossRevenue: 238000, operatingExpenses: 181000, budgetVariance: -1.8, unreconciledCount: 0, auditStatus: 'Approved' } },
  { id: 'REP-FIN-2606', departmentId: 'finance', month: '2026-06', author: 'John Doe', createdAt: '2026-06-30T09:00:00Z', data: { grossRevenue: 251000, operatingExpenses: 187000, budgetVariance: 2.1, unreconciledCount: 1, auditStatus: 'Pending Review' } },

  // Radiology
  { id: 'REP-RAD-2606', departmentId: 'radiology', month: '2026-06', author: 'Helen Cartwright, RN', createdAt: '2026-06-28T14:20:00Z', data: { totalScans: 810, avgTurnaround: 3.1, calibrationChecks: 4, safetyScore: 99.5 } },

  // Laboratory
  { id: 'REP-LAB-2606', departmentId: 'laboratory', month: '2026-06', author: 'Robert Sinclair', createdAt: '2026-06-29T15:00:00Z', data: { specimensProcessed: 12100, criticalNotifications: 11, tempAlarms: 0, analyzerCalibrations: 28 } },

  // Inpatient
  { id: 'REP-INP-2606', departmentId: 'inpatient', month: '2026-06', author: 'Clara Oswald, RN', createdAt: '2026-06-29T17:30:00Z', data: { bedAdmissions: 432, avgStayLength: 4.2, occupancyRate: 84.1, infectionRate: 0.11 } }
];

export default function MonthlyReports() {
  const [reports, setReports] = useState<MonthlyReport[]>(() => {
    const saved = localStorage.getItem('monthly_department_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_REPORTS;
  });

  const [activeDept, setActiveDept] = useState<string>('dispensary');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Dynamic Form states
  const [formMonth, setFormMonth] = useState('2026-06');
  const [formAuthor, setFormAuthor] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    localStorage.setItem('monthly_department_reports', JSON.stringify(reports));
  }, [reports]);

  // Reset form data when the department changes
  useEffect(() => {
    const meta = DEPARTMENT_METADATA[activeDept];
    if (!meta) return;
    
    const initialData: Record<string, any> = {};
    meta.fields.forEach(f => {
      if (f.type === 'select') {
        initialData[f.key] = f.options?.[0] || '';
      } else {
        initialData[f.key] = '';
      }
    });
    setFormData(initialData);
  }, [activeDept]);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuthor.trim()) {
      triggerToast('error', 'Please enter a valid supervisor / author name.');
      return;
    }

    // Basic validation of fields
    const meta = DEPARTMENT_METADATA[activeDept];
    for (const f of meta.fields) {
      const val = formData[f.key];
      if (val === undefined || val === '') {
        triggerToast('error', `Please fill out field: "${f.label}"`);
        return;
      }
    }

    const uniqueId = `REP-${activeDept.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(8, 12)}`;
    
    // Parse numeric fields properly
    const processedData: Record<string, any> = {};
    meta.fields.forEach(f => {
      if (f.type !== 'select') {
        processedData[f.key] = Number(formData[f.key]);
      } else {
        processedData[f.key] = formData[f.key];
      }
    });

    const newReport: MonthlyReport = {
      id: uniqueId,
      departmentId: activeDept,
      month: formMonth,
      author: formAuthor.trim(),
      createdAt: new Date().toISOString(),
      data: processedData
    };

    setReports([newReport, ...reports]);
    setFormAuthor('');
    setShowForm(false);
    triggerToast('success', `✓ Successfully submitted and archived Monthly Report ${uniqueId} for ${meta.label}.`);
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete monthly report archive ${id}?`)) {
      setReports(prev => prev.filter(r => r.id !== id));
      triggerToast('success', 'Monthly report archive successfully deleted.');
    }
  };

  const handleResetBaseline = () => {
    if (window.confirm('Reset all monthly reports back to baseline template? Custom entries will be overridden.')) {
      setReports(INITIAL_REPORTS);
      triggerToast('success', 'Monthly report archives have been reset to default clinical template.');
    }
  };

  const handleDownloadCSV = (report: MonthlyReport) => {
    const meta = DEPARTMENT_METADATA[report.departmentId];
    if (!meta) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Report ID,Department,Month,Author,Created At\n";
    csvContent += `${report.id},${meta.label},${report.month},${report.author},${report.createdAt}\n\n`;
    
    csvContent += "Metric Key,Metric Value\n";
    meta.fields.forEach(f => {
      csvContent += `"${f.label}","${report.data[f.key]}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.id}_monthly_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', '✓ Report CSV downloaded successfully.');
  };

  // Helper to format values elegantly based on schema field type
  const formatValue = (val: any, field: FieldSchema) => {
    if (val === undefined || val === null || val === '') return '-';
    switch (field.type) {
      case 'currency':
        return `${Number(val).toLocaleString()} USD`;
      case 'percentage':
        return `${val}%`;
      case 'number':
        return Number(val).toLocaleString() + (field.suffix || '');
      default:
        return String(val) + (field.suffix || '');
    }
  };

  // Filtering reports
  const activeReports = reports.filter(r => {
    const matchesDept = r.departmentId === activeDept;
    const matchesSearch = r.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.month.includes(searchQuery);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                <FileSpreadsheet size={18} />
              </span>
              <h2 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                Monthly Performance Report Collector
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Collate, view, and store individual clinical operational statistics across all 12 primary hospital departments.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Plus size={14} />
              <span>Submit {DEPARTMENT_METADATA[activeDept]?.label.split(' ')[0]} Report</span>
            </button>
            <button
              onClick={handleResetBaseline}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-250 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Reset report register to default templates"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {toast && (
          <div className={`mt-4 p-3 rounded-lg border text-xs font-bold animate-fadeIn ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
              : 'bg-rose-50 border-rose-150 text-rose-800'
          }`}>
            {toast.text}
          </div>
        )}
      </div>

      {/* 2. Department Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(DEPARTMENT_METADATA).map(([key, meta]) => {
          const isActive = activeDept === key;
          const count = reports.filter(r => r.departmentId === key).length;
          const Icon = meta.icon;

          return (
            <button
              key={key}
              onClick={() => {
                setActiveDept(key);
                setShowForm(false);
              }}
              className={`p-3 text-left rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                isActive 
                  ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600' 
                  : 'bg-gray-50/50 hover:bg-white border-gray-150'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-1 rounded-lg ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}>
                  <Icon size={14} />
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-900 block truncate leading-tight">
                  {meta.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Action Layout (Grid with Form Drawer & Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dynamic Collector Input Form (Drawer) */}
        {showForm && (
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className={`p-1.5 rounded-lg ${DEPARTMENT_METADATA[activeDept].bgColor} ${DEPARTMENT_METADATA[activeDept].color}`}>
                  {React.createElement(DEPARTMENT_METADATA[activeDept].icon, { size: 12 })}
                </span>
                Submit {DEPARTMENT_METADATA[activeDept].label} Report
              </h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddReport} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Report Month</label>
                <input
                  type="month"
                  required
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Department Supervisor / Author</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Practitioner Sinclair"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Dynamic schema input fields based on active department definition */}
              <div className="space-y-3.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                  Department Specific Indicators
                </span>
                {DEPARTMENT_METADATA[activeDept].fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 flex justify-between">
                      <span>{f.label}</span>
                      {f.type === 'percentage' && <span className="text-gray-400 font-mono">%</span>}
                      {f.type === 'currency' && <span className="text-gray-400 font-mono">USD</span>}
                    </label>

                    {f.type === 'select' ? (
                      <select
                        value={formData[f.key] || ''}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-gray-700 font-medium"
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        min={f.min !== undefined ? f.min : undefined}
                        max={f.max !== undefined ? f.max : undefined}
                        required
                        placeholder={f.placeholder}
                        value={formData[f.key] || ''}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-gray-800 font-medium"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
              >
                Archive Report Entry
              </button>

            </form>
          </div>
        )}

        {/* Individual Department Table & Summary Panel */}
        <div className={`bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs ${showForm ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                Active Registry
              </span>
              <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-tight flex items-center gap-1.5">
                {DEPARTMENT_METADATA[activeDept].label} Performance Logs
              </h3>
            </div>

            {/* Filter toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by supervisor or month..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2 py-1 text-[11px] border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-700 w-44"
                />
              </div>
            </div>
          </div>

          {/* Department Scheme Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-150 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Supervisor / Author</th>
                  
                  {/* Dynamic Department Columns */}
                  {DEPARTMENT_METADATA[activeDept].fields.map(f => (
                    <th key={f.key} className="py-2.5 px-3">{f.label}</th>
                  ))}

                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {activeReports.length === 0 ? (
                  <tr>
                    <td colSpan={4 + DEPARTMENT_METADATA[activeDept].fields.length} className="py-12 text-center text-gray-400">
                      <FileSpreadsheet size={28} className="mx-auto mb-2 text-gray-300 animate-pulse" />
                      <p className="font-bold text-sm">No monthly performance records</p>
                      <p className="text-xs text-gray-400 mt-1">Submit a new report above to begin tracking indicators.</p>
                    </td>
                  </tr>
                ) : (
                  activeReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-600">
                        {report.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-md inline-flex items-center gap-1">
                          <Calendar size={10} />
                          {report.month}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {report.author}
                      </td>

                      {/* Render dynamic attributes corresponding to active department */}
                      {DEPARTMENT_METADATA[activeDept].fields.map(f => {
                        const val = report.data[f.key];
                        return (
                          <td key={f.key} className="py-3 px-3 font-mono font-bold text-gray-700">
                            {formatValue(val, f)}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadCSV(report)}
                            className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                            title="Download CSV performance sheet"
                          >
                            <FileDown size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 cursor-pointer"
                            title="Delete report entry"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Department Insights / Guidance Banner */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 flex items-start gap-2.5 text-[11px] text-gray-500 leading-relaxed">
            <HelpCircle size={14} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-gray-800 uppercase tracking-wide block mb-0.5">
                Guidance on Department Metrics
              </span>
              This table renders the dedicated schema registered under standard EMR bylaws. Ensure values represent fully audited operational aggregates matching clinical log sheets for the specified month.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
