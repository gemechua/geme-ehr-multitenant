import React, { useState, useEffect } from 'react';
import { 
  Activity, TrendingUp, Plus, Search, Calendar, User, Trash2, 
  HelpCircle, Sparkles, Check, CheckCircle2, AlertTriangle, 
  FileDown, RotateCcw, HeartPulse, DollarSign, Compass, FlaskConical, 
  FileText, UserCheck, Skull, Warehouse, Coins, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export interface ClinicalServiceKPI {
  id: string;
  departmentId: string;
  month: string;           // e.g. "2026-06"
  reporterName: string;    // e.g. "Dr. Sarah Jenkins"
  createdAt: string;
  
  // Clinical Cases Schema
  clinicalCasesTotal: number;
  criticalSeverityCases: number;
  successImprovementRate: number; // percentage, e.g. 94.5
  unplannedReadmissions: number;

  // Services Oriented Schema
  servicesRenderedTotal: number;
  avgServiceDeliveryTime: number; // in mins or hours
  serviceSatisfactionRate: number; // percentage, e.g. 96.2
  serviceCapacityUtilization: number; // percentage, e.g. 85.0

  status: 'Draft' | 'Approved' | 'Flagged';
}

const DEPARTMENTS = [
  { id: 'dispensary', label: 'Dispensary & Prescriptions', icon: HeartPulse, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-100' },
  { id: 'finance', label: 'Finance & Accounts', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  { id: 'radiology', label: 'Radiology Imaging', icon: Compass, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' },
  { id: 'laboratory', label: 'Laboratory Diagnostics', icon: FlaskConical, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-100' },
  { id: 'liaison', label: 'Hospital Liaison', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  { id: 'outpatient', label: 'Outpatient Services', icon: UserCheck, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-100' },
  { id: 'inpatient', label: 'Inpatient Wards', icon: Activity, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
  { id: 'death', label: 'Mortality & Death Audits', icon: Skull, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-100' },
  { id: 'performance', label: 'Performance & Quality', icon: Sparkles, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-100' },
  { id: 'inventory', label: 'Inventory & Supplies', icon: Warehouse, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-100' },
  { id: 'insurance', label: 'Insurance & Claims', icon: FileSpreadsheet, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  { id: 'cashiers', label: 'Cashier & Revenue', icon: Coins, color: 'text-lime-600', bgColor: 'bg-lime-50', borderColor: 'border-lime-100' }
];

const INITIAL_KPIS: ClinicalServiceKPI[] = [
  { id: 'KPI-DIS-06', departmentId: 'dispensary', month: '2026-06', reporterName: 'Robert Sinclair', createdAt: '2026-06-28T14:30:00Z', clinicalCasesTotal: 480, criticalSeverityCases: 42, successImprovementRate: 97.8, unplannedReadmissions: 4, servicesRenderedTotal: 4350, avgServiceDeliveryTime: 12, serviceSatisfactionRate: 95.8, serviceCapacityUtilization: 88.0, status: 'Approved' },
  { id: 'KPI-DIS-05', departmentId: 'dispensary', month: '2026-05', reporterName: 'Robert Sinclair', createdAt: '2026-05-28T10:15:00Z', clinicalCasesTotal: 450, criticalSeverityCases: 35, successImprovementRate: 98.2, unplannedReadmissions: 2, servicesRenderedTotal: 4120, avgServiceDeliveryTime: 14, serviceSatisfactionRate: 94.5, serviceCapacityUtilization: 85.0, status: 'Approved' },
  
  { id: 'KPI-INP-06', departmentId: 'inpatient', month: '2026-06', reporterName: 'Clara Oswald, RN', createdAt: '2026-06-29T16:00:00Z', clinicalCasesTotal: 432, criticalSeverityCases: 110, successImprovementRate: 94.2, unplannedReadmissions: 28, servicesRenderedTotal: 1850, avgServiceDeliveryTime: 96, serviceSatisfactionRate: 92.0, serviceCapacityUtilization: 84.5, status: 'Approved' },
  { id: 'KPI-OUT-06', departmentId: 'outpatient', month: '2026-06', reporterName: 'Dr. Sarah Jenkins', createdAt: '2026-06-29T11:45:00Z', clinicalCasesTotal: 3400, criticalSeverityCases: 180, successImprovementRate: 96.5, unplannedReadmissions: 42, servicesRenderedTotal: 3820, avgServiceDeliveryTime: 22, serviceSatisfactionRate: 94.8, serviceCapacityUtilization: 78.0, status: 'Approved' },
  
  { id: 'KPI-RAD-06', departmentId: 'radiology', month: '2026-06', reporterName: 'Helen Cartwright, RN', createdAt: '2026-06-30T09:12:00Z', clinicalCasesTotal: 810, criticalSeverityCases: 75, successImprovementRate: 99.4, unplannedReadmissions: 0, servicesRenderedTotal: 950, avgServiceDeliveryTime: 45, serviceSatisfactionRate: 97.2, serviceCapacityUtilization: 72.0, status: 'Draft' },
  { id: 'KPI-LAB-06', departmentId: 'laboratory', month: '2026-06', reporterName: 'Dr. Evelyn Foster', createdAt: '2026-06-30T10:04:00Z', clinicalCasesTotal: 12100, criticalSeverityCases: 840, successImprovementRate: 99.8, unplannedReadmissions: 12, servicesRenderedTotal: 12500, avgServiceDeliveryTime: 35, serviceSatisfactionRate: 98.1, serviceCapacityUtilization: 92.0, status: 'Approved' }
];

export default function ClinicalKPIs() {
  const [kpis, setKpis] = useState<ClinicalServiceKPI[]>(() => {
    const saved = localStorage.getItem('clinical_service_kpis');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_KPIS;
  });

  const [activeDept, setActiveDept] = useState<string>('dispensary');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [formMonth, setFormMonth] = useState('2026-06');
  const [formReporter, setFormReporter] = useState('');
  
  // Clinical case states
  const [casesTotal, setCasesTotal] = useState('');
  const [criticalCases, setCriticalCases] = useState('');
  const [successRate, setSuccessRate] = useState('');
  const [readmissions, setReadmissions] = useState('');

  // Service Oriented states
  const [servicesTotal, setServicesTotal] = useState('');
  const [avgServiceTime, setAvgServiceTime] = useState('');
  const [satisfactionRate, setSatisfactionRate] = useState('');
  const [capacityUtilization, setCapacityUtilization] = useState('');

  useEffect(() => {
    localStorage.setItem('clinical_service_kpis', JSON.stringify(kpis));
  }, [kpis]);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setCasesTotal('');
    setCriticalCases('');
    setSuccessRate('');
    setReadmissions('');
    setServicesTotal('');
    setAvgServiceTime('');
    setSatisfactionRate('');
    setCapacityUtilization('');
  };

  const handleAddKPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReporter.trim()) {
      triggerToast('error', 'Please enter a valid supervisor / reporter name.');
      return;
    }

    const uniqueId = `KPI-${activeDept.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(8, 12)}`;
    
    const newRecord: ClinicalServiceKPI = {
      id: uniqueId,
      departmentId: activeDept,
      month: formMonth,
      reporterName: formReporter.trim(),
      createdAt: new Date().toISOString(),
      clinicalCasesTotal: Number(casesTotal) || 0,
      criticalSeverityCases: Number(criticalCases) || 0,
      successImprovementRate: Number(successRate) || 0,
      unplannedReadmissions: Number(readmissions) || 0,
      servicesRenderedTotal: Number(servicesTotal) || 0,
      avgServiceDeliveryTime: Number(avgServiceTime) || 0,
      serviceSatisfactionRate: Number(satisfactionRate) || 0,
      serviceCapacityUtilization: Number(capacityUtilization) || 0,
      status: 'Draft'
    };

    setKpis([newRecord, ...kpis]);
    setFormReporter('');
    resetForm();
    setShowForm(false);
    triggerToast('success', `✓ KPI performance log ${uniqueId} for ${DEPARTMENT_METADATA[activeDept].label} has been recorded in Draft status.`);
  };

  const handleDeleteKPI = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete KPI record ${id}?`)) {
      setKpis(prev => prev.filter(k => k.id !== id));
      triggerToast('success', 'KPI performance log deleted successfully.');
    }
  };

  const handleApproveKPI = (id: string) => {
    setKpis(prev => prev.map(k => {
      if (k.id === id) {
        return { ...k, status: 'Approved' };
      }
      return k;
    }));
    triggerToast('success', `✓ KPI Record ${id} has been audited and approved successfully.`);
  };

  const handleResetBaseline = () => {
    if (window.confirm('Reset all clinical and service KPI data to default clinical template? This overrides custom modifications.')) {
      setKpis(INITIAL_KPIS);
      triggerToast('success', 'KPI registry has been restored to default baseline.');
    }
  };

  const handleDownloadCSV = (kpi: ClinicalServiceKPI) => {
    const meta = DEPARTMENT_METADATA[kpi.departmentId];
    if (!meta) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "KPI Roster,Clinical Case KPIs,Services Oriented KPIs\n";
    csvContent += `Record ID,${kpi.id},Department,${meta.label}\n`;
    csvContent += `Month,${kpi.month},Author,${kpi.reporterName}\n\n`;
    
    csvContent += "Category,KPI Metric Name,Value\n";
    csvContent += `Clinical,Total Clinical Cases,${kpi.clinicalCasesTotal}\n`;
    csvContent += `Clinical,Critical Severity Cases,${kpi.criticalSeverityCases}\n`;
    csvContent += `Clinical,Success / Improvement Rate (%),${kpi.successImprovementRate}%\n`;
    csvContent += `Clinical,Unplanned Readmissions,${kpi.unplannedReadmissions}\n`;
    csvContent += `Services,Total Services Rendered,${kpi.servicesRenderedTotal}\n`;
    csvContent += `Services,Average Delivery Time (mins),${kpi.avgServiceDeliveryTime}\n`;
    csvContent += `Services,Satisfaction Rate (%),${kpi.serviceSatisfactionRate}%\n`;
    csvContent += `Services,Capacity Utilization (%),${kpi.serviceCapacityUtilization}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${kpi.id}_clinical_kpis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', '✓ KPI CSV performance sheet exported successfully.');
  };

  const DEPARTMENT_METADATA = DEPARTMENTS.reduce((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {} as Record<string, typeof DEPARTMENTS[0]>);

  // Filter KPI lists
  const activeKPIs = kpis.filter(k => {
    const matchesDept = k.departmentId === activeDept;
    const matchesSearch = k.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          k.month.includes(searchQuery);
    return matchesDept && matchesSearch;
  });

  // Recharts chart dataset mapping
  const chartData = [...kpis]
    .filter(k => k.departmentId === activeDept)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(k => ({
      month: k.month,
      'Clinical Cases Handled': k.clinicalCasesTotal,
      'Services Rendered': k.servicesRenderedTotal,
      'Service Satisfaction %': k.serviceSatisfactionRate,
      'Success Rate %': k.successImprovementRate
    }));

  return (
    <div className="space-y-6">
      
      {/* 1. Header Block */}
      <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                <Activity size={18} />
              </span>
              <h2 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                Clinical Cases & Services KPI Collector
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Integrate, audit, and analyze hospital indicators. Track Case Volume, Critical Severity Outcomes, and Operational Services throughput across all 12 units.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Plus size={14} />
              <span>Log {DEPARTMENT_METADATA[activeDept]?.label.split(' ')[0]} KPIs</span>
            </button>
            <button
              onClick={handleResetBaseline}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-250 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Reset all KPI logs to system baseline"
            >
              <RotateCcw size={12} />
              <span>Reset baseline</span>
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

      {/* 2. Department grid selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDept === dept.id;
          const count = kpis.filter(k => k.departmentId === dept.id).length;
          const Icon = dept.icon;

          return (
            <button
              key={dept.id}
              onClick={() => {
                setActiveDept(dept.id);
                setShowForm(false);
              }}
              className={`p-3 text-left rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                isActive 
                  ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600' 
                  : 'bg-gray-50/50 hover:bg-white border-gray-150'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-1 rounded-lg ${dept.bgColor} ${dept.color} border ${dept.borderColor}`}>
                  <Icon size={14} />
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {count} logs
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-900 block truncate leading-tight">
                  {dept.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Primary Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input form collector */}
        {showForm && (
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs animate-fadeIn">
            
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className={`p-1 rounded-lg ${DEPARTMENT_METADATA[activeDept].bgColor} ${DEPARTMENT_METADATA[activeDept].color}`}>
                  {React.createElement(DEPARTMENT_METADATA[activeDept].icon, { size: 12 })}
                </span>
                Log {DEPARTMENT_METADATA[activeDept].label.split(' ')[0]} KPIs
              </h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddKPI} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Report Month</label>
                  <input
                    type="month"
                    required
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Supervisor Reporter</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supervisor Sinclair"
                    value={formReporter}
                    onChange={(e) => setFormReporter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* SECTION A: Clinical Cases KPI Schema */}
              <div className="space-y-3 p-3 bg-rose-50/20 border border-rose-100 rounded-xl">
                <div className="flex items-center gap-1 text-rose-700 font-bold text-xs uppercase tracking-wider">
                  <HeartPulse size={12} />
                  <span>Clinical Cases KPI Schema</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Total Cases Handled</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 520"
                      value={casesTotal}
                      onChange={(e) => setCasesTotal(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Critical / High Severity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 45"
                      value={criticalCases}
                      onChange={(e) => setCriticalCases(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Treatment Success %</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 98.4"
                      value={successRate}
                      onChange={(e) => setSuccessRate(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">30-day Readmissions</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 3"
                      value={readmissions}
                      onChange={(e) => setReadmissions(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Services Oriented KPI Schema */}
              <div className="space-y-3 p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <Activity size={12} />
                  <span>Services Oriented KPI Schema</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Services Rendered (Total)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 4100"
                      value={servicesTotal}
                      onChange={(e) => setServicesTotal(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Avg Delivery Speed (mins)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 15"
                      value={avgServiceTime}
                      onChange={(e) => setAvgServiceTime(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Service Satisfaction %</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 96.5"
                      value={satisfactionRate}
                      onChange={(e) => setSatisfactionRate(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Staff Capacity Util. %</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 84.0"
                      value={capacityUtilization}
                      onChange={(e) => setCapacityUtilization(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
              >
                Archive KPI Submission
              </button>

            </form>
          </div>
        )}

        {/* Dashboard table, visual progress charts & schema detail */}
        <div className={`space-y-5 ${showForm ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* Charts view if datasets exist */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                Visual Department Trends
              </span>
              <h4 className="text-xs font-extrabold text-gray-950 uppercase tracking-tight mb-4 flex items-center gap-1">
                <span>Clinical Volumes vs. Service Satisfaction Trends for {DEPARTMENT_METADATA[activeDept].label}</span>
              </h4>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#4f46e5' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#10b981' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="Clinical Cases Handled" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={25} />
                    <Bar yAxisId="left" dataKey="Services Rendered" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={15} />
                    <Line yAxisId="right" type="monotone" dataKey="Service Satisfaction %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="Success Rate %" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table list */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                  Audited Logs
                </span>
                <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-tight flex items-center gap-1.5">
                  {DEPARTMENT_METADATA[activeDept].label} Clinical & Service KPIs
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search KPI supervisor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2 py-1 text-[11px] border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-700 w-44"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-150 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">ID / Month</th>
                    <th className="py-2.5 px-3">Reporter</th>
                    <th className="py-2.5 px-3 text-rose-700">Clinical Cases Handled (Total)</th>
                    <th className="py-2.5 px-3 text-rose-700">Critical / Success Rates</th>
                    <th className="py-2.5 px-3 text-emerald-700">Services Rendered (Total)</th>
                    <th className="py-2.5 px-3 text-emerald-700">Delivery Speed / Satisfaction</th>
                    <th className="py-2.5 px-3">Audit status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {activeKPIs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <Activity size={28} className="mx-auto mb-2 text-gray-300 animate-pulse" />
                        <p className="font-bold text-sm">No KPI logs registered for this department</p>
                        <p className="text-xs text-gray-400 mt-1">Submit clinical and services oriented metrics using the Log button above.</p>
                      </td>
                    </tr>
                  ) : (
                    activeKPIs.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-gray-50/50 transition-colors">
                        
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-gray-600">{kpi.id}</div>
                          <div className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">{kpi.month}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{kpi.reporterName}</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">{new Date(kpi.createdAt).toLocaleDateString()}</div>
                        </td>

                        {/* Clinical Cases Total */}
                        <td className="py-3 px-3 font-mono font-extrabold text-gray-800">
                          {kpi.clinicalCasesTotal.toLocaleString()} cases
                        </td>

                        {/* Clinical Specific Metrics */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-gray-700">Success: <strong className="text-rose-600">{kpi.successImprovementRate}%</strong></div>
                          <div className="text-[10px] font-mono text-gray-400 mt-0.5">Critical: {kpi.criticalSeverityCases} | Readmitted: {kpi.unplannedReadmissions}</div>
                        </td>

                        {/* Services Rendered Total */}
                        <td className="py-3 px-3 font-mono font-extrabold text-gray-800">
                          {kpi.servicesRenderedTotal.toLocaleString()} services
                        </td>

                        {/* Services Specific Metrics */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-gray-700">Satisfy: <strong className="text-emerald-600">{kpi.serviceSatisfactionRate}%</strong></div>
                          <div className="text-[10px] font-mono text-gray-400 mt-0.5">Avg speed: {kpi.avgServiceDeliveryTime}m | Capacity: {kpi.serviceCapacityUtilization}%</div>
                        </td>

                        {/* Audit Status */}
                        <td className="py-3 px-3">
                          {kpi.status === 'Approved' ? (
                            <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              <Check size={8} /> Approved
                            </span>
                          ) : (
                            <span className="bg-amber-50 border border-amber-150 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 animate-pulse">
                              <HelpCircle size={8} /> Pending Audit
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {kpi.status !== 'Approved' && (
                              <button
                                onClick={() => handleApproveKPI(kpi.id)}
                                className="p-1 px-1.5 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-black cursor-pointer"
                                title="Approve & Lock performance metrics"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadCSV(kpi)}
                              className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                              title="Export KPI metrics as CSV sheet"
                            >
                              <FileDown size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteKPI(kpi.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 cursor-pointer"
                              title="Delete KPI record"
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

            {/* Explanatory footer */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 flex items-start gap-2 text-[11px] text-gray-500 leading-normal">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-gray-800 uppercase tracking-wide block">
                  Regulatory EMR Integrity Safeguard
                </span>
                This panel displays the audited Clinical and Service-Oriented metrics mapped according to hospital bylaws. High volumes or low success rates automatically flag diagnostic audit reviews.
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
