import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  CheckSquare, FileSpreadsheet, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, 
  Activity, Plus, Trash2, Filter, Clock, 
  HeartPulse, DollarSign, FlaskConical, Compass, Skull, UserCheck, Warehouse, 
  Coins, FileText, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Download, Eye,
  Pill, Sliders, Search, PackageX, Check, RotateCcw, ShieldAlert
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export interface QiAudit {
  id: string;
  department: string; // e.g. 'dispensary', 'finance', 'radiology', 'laboratory', 'liaison', 'outpatient', 'inpatient', 'death', 'performance', 'inventory', 'insurance', 'cashiers'
  auditDate: string;
  inspectorName: string;
  complianceScore: number; // 0 to 100
  status: 'Compliant' | 'Partial' | 'Non-Compliant';
  itemsAuditedCount: number;
  criticalIssuesCount: number;
  recommendations: string;
  checklist: { text: string; checked: boolean }[];
  notes?: string;
  hospital_id?: string;
}

export interface MedicationStock {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  minAlertLevel: number;
  dispensedCount: number;
  lastAuditedDate: string;
  status: 'In Stock' | 'Low Stock' | 'Stock Out';
}

export interface DispensationLog {
  id: string;
  prescriptionId: string;
  medicationName: string;
  qtyPrescribed: number;
  qtyDispensed: number;
  patientMrn: string;
  timestamp: string;
  auditStatus: 'Verified' | 'Pending Audit' | 'Discrepancy';
}

const INITIAL_MEDS: MedicationStock[] = [
  { id: 'MED-001', name: 'Amoxicillin 500mg', category: 'Antibiotic', stockLevel: 140, minAlertLevel: 30, dispensedCount: 420, lastAuditedDate: '2026-06-28', status: 'In Stock' },
  { id: 'MED-002', name: 'Paracetamol 500mg', category: 'Analgesic', stockLevel: 0, minAlertLevel: 50, dispensedCount: 890, lastAuditedDate: '2026-06-29', status: 'Stock Out' },
  { id: 'MED-003', name: 'Metformin 850mg', category: 'Antidiabetic', stockLevel: 15, minAlertLevel: 25, dispensedCount: 310, lastAuditedDate: '2026-06-27', status: 'Low Stock' },
  { id: 'MED-004', name: 'Atorvastatin 20mg', category: 'Cardiovascular', stockLevel: 85, minAlertLevel: 20, dispensedCount: 250, lastAuditedDate: '2026-06-29', status: 'In Stock' },
  { id: 'MED-005', name: 'Omeprazole 20mg', category: 'Gastrointestinal', stockLevel: 8, minAlertLevel: 15, dispensedCount: 480, lastAuditedDate: '2026-06-26', status: 'Low Stock' },
  { id: 'MED-006', name: 'Albuterol Inhaler', category: 'Respiratory', stockLevel: 42, minAlertLevel: 10, dispensedCount: 180, lastAuditedDate: '2026-06-28', status: 'In Stock' },
  { id: 'MED-007', name: 'Ibuprofen 400mg', category: 'NSAID', stockLevel: 0, minAlertLevel: 40, dispensedCount: 610, lastAuditedDate: '2026-06-29', status: 'Stock Out' },
];

const INITIAL_DISPENSATIONS: DispensationLog[] = [
  { id: 'DSP-901', prescriptionId: 'RX-7741', medicationName: 'Amoxicillin 500mg', qtyPrescribed: 15, qtyDispensed: 15, patientMrn: 'MRN-4810', timestamp: '2026-06-30T10:15:00Z', auditStatus: 'Verified' },
  { id: 'DSP-902', prescriptionId: 'RX-7742', medicationName: 'Paracetamol 500mg', qtyPrescribed: 20, qtyDispensed: 0, patientMrn: 'MRN-1928', timestamp: '2026-06-30T11:04:00Z', auditStatus: 'Pending Audit' },
  { id: 'DSP-903', prescriptionId: 'RX-7743', medicationName: 'Metformin 850mg', qtyPrescribed: 30, qtyDispensed: 15, patientMrn: 'MRN-8821', timestamp: '2026-06-30T12:30:00Z', auditStatus: 'Discrepancy' },
  { id: 'DSP-904', prescriptionId: 'RX-7744', medicationName: 'Atorvastatin 20mg', qtyPrescribed: 30, qtyDispensed: 30, patientMrn: 'MRN-2440', timestamp: '2026-06-30T13:45:00Z', auditStatus: 'Verified' },
];

const DEPARTMENTS = [
  { id: 'dispensary', label: 'Dispensary & Prescriptions', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { id: 'finance', label: 'Finance & Accounts', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'radiology', label: 'Radiology Imaging', icon: Compass, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'laboratory', label: 'Laboratory Diagnostics', icon: FlaskConical, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
  { id: 'liaison', label: 'Hospital Liaison', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { id: 'outpatient', label: 'Outpatient Services', icon: UserCheck, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { id: 'inpatient', label: 'Inpatient Wards', icon: Activity, color: 'text-violet-600 bg-violet-50 border-violet-100' },
  { id: 'death', label: 'Mortality & Death Audits', icon: Skull, color: 'text-slate-600 bg-slate-50 border-slate-100' },
  { id: 'performance', label: 'Performance & Quality', icon: Sparkles, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  { id: 'inventory', label: 'Inventory & Supplies', icon: Warehouse, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { id: 'insurance', label: 'Insurance & Claims', icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'cashiers', label: 'Cashier & Revenue', icon: Coins, color: 'text-lime-600 bg-lime-50 border-lime-100' },
];

const DEPARTMENT_CHECKLISTS: Record<string, string[]> = {
  dispensary: [
    "Prescription labeling is accurate and fully detailed with patient information.",
    "No expired pharmaceuticals are present in active dispensing stocks.",
    "Controlled substance registers are physically reconciled and double-signed.",
    "Drug allergy status profiles verified for all outpatient tickets.",
    "Refrigeration logs for biological therapeutics are up to date."
  ],
  finance: [
    "Daily revenue cash registers physically reconciled with bank reports.",
    "Accounts payable invoices are fully matched with physical purchase orders.",
    "Petty cash ledger displays no unexplained variances.",
    "Capital health equipment depreciation is logged for the cycle.",
    "Departmental spend variance checks remain under 5% deviation."
  ],
  radiology: [
    "Lead-apron shielding materials physically inspected for cracks.",
    "Weekly radiation emission calibration metrics are completed and signed off.",
    "Staff radiation dosage monitor badges collected and logged.",
    "Diagnostic imaging turnaround reports remain under 4 hours.",
    "Dual patient identity verification performed prior to scan exposure."
  ],
  laboratory: [
    "Specimen storage refrigeration temperature readings verified & logged.",
    "Quality control standard runs executed on key blood chemistry analyzers.",
    "Biohazardous waste collection bins sealed and processed securely.",
    "Critical laboratory panic value notifications initiated within 15 mins.",
    "Technical calibration certificate logs up to date."
  ],
  liaison: [
    "Inter-hospital emergency transport transfer records fully completed.",
    "Active provider-liaison referral logs matched with affiliate metrics.",
    "Liaison hotline availability logs showing 100% attendance during shift.",
    "External clinical feedback files routed to administration.",
    "Post-discharge liaison checkups executed within 48-hour protocol."
  ],
  outpatient: [
    "Patient triage response wait times remain under 20 minutes.",
    "Outpatient consult disinfection procedures completed per checklist.",
    "Prescription copy handed to patient during clinical exit.",
    "Outpatient diagnostic requests matched with institutional standards.",
    "Post-visit feedback survey invitations dispatched automatically."
  ],
  inpatient: [
    "Inpatient nursing clinical handovers completed with checklist verification.",
    "Bedrails, alarm call buttons, and safety indicators verified operational.",
    "Intravenous catheter site assessment logs updated.",
    "Inpatient dietary guideline instructions verified against allergy logs.",
    "Fall-risk assessments executed for geriatric or compromised inpatients."
  ],
  death: [
    "Mortality peer review committee audits registered for each death event.",
    "Certificate of Death and clinical logs filed under 4 hours.",
    "Immediate relative bereavement counseling referral offered and logged.",
    "Unexpected clinical death root-cause analysis completed within 7 days.",
    "Mortuary sanitation and temperature audit logged."
  ],
  performance: [
    "Annual clinical staff competencies registered in HR audit portal.",
    "Institutional hand-hygiene monitors showing compliance above 90%.",
    "Clinical protocol deviation forms submitted to medical board.",
    "Surgical checklist protocols (Time Out) executed for 100% of cases.",
    "Overall patient care experience satisfaction feedback matches target."
  ],
  inventory: [
    "Critical emergency triage crash-cart inventories fully stocked.",
    "Personal Protective Equipment (PPE) reserves match 30-day target.",
    "Expired clinical consumables cataloged and removed from supply chain.",
    "Storage climate control sensors verified and calibrated.",
    "Vendor safety certificates uploaded and cataloged."
  ],
  insurance: [
    "Pre-authorization medical documents uploaded for scheduled procedures.",
    "Claim denial trends analyzed with corrective adjustment plans.",
    "National medical insurance code tables updated to latest version.",
    "Co-payment financial estimations explained to patient.",
    "Public healthcare insurance records synchronized daily."
  ],
  cashiers: [
    "Physical register drawer cash counts match electronic POS reports.",
    "Supervisory approval overrides logged for all transaction voids.",
    "Credit card receipt batches printed and settled for the day.",
    "Public invoice printing stations loaded and fully functional.",
    "Emergency cash-handling safe drops logged every 4 hours."
  ],
};

const RANDOM_INSPECTORS = ["Dr. Helen Kassa", "Dir. Mark Addis", "Audit Head Thomas", "QA Lead Martha", "Dr. Yohannes Alula"];

export default function QualityImprovement() {
  const [activeDept, setActiveDept] = useState('dispensary');
  const [audits, setAudits] = useState<QiAudit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Form states
  const [newInspector, setNewInspector] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newScore, setNewScore] = useState(90);
  const [customChecklist, setCustomChecklist] = useState<{ text: string; checked: boolean }[]>([]);

  // Dispensary custom system states
  const [dispensaryMeds, setDispensaryMeds] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('dispensary_meds');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_MEDS;
  });

  const [dispensations, setDispensations] = useState<DispensationLog[]>(() => {
    const saved = localStorage.getItem('dispensary_dispensations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_DISPENSATIONS;
  });

  const [medFilter, setMedFilter] = useState('');
  const [dispensaryFeedback, setDispensaryFeedback] = useState<{ type: 'success' | 'warning' | 'error', text: string } | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('dispensary_meds', JSON.stringify(dispensaryMeds));
  }, [dispensaryMeds]);

  useEffect(() => {
    localStorage.setItem('dispensary_dispensations', JSON.stringify(dispensations));
  }, [dispensations]);

  // Simulate a prescription dispense action for a specific medication
  const handleSimulateDispense = (medId: string) => {
    const medsList = [...dispensaryMeds];
    const medIndex = medsList.findIndex(m => m.id === medId);
    if (medIndex === -1) return;

    const med = medsList[medIndex];
    const qtyPrescribed = Math.floor(Math.random() * 25) + 10; // 10 to 34 pills
    let qtyDispensed = 0;
    let auditStatus: 'Verified' | 'Pending Audit' | 'Discrepancy' = 'Verified';
    let feedbackText = '';
    let feedbackType: 'success' | 'warning' | 'error' = 'success';

    if (med.stockLevel >= qtyPrescribed) {
      qtyDispensed = qtyPrescribed;
      med.stockLevel -= qtyPrescribed;
      med.dispensedCount += qtyPrescribed;
      feedbackText = `✓ Successfully dispensed ${qtyDispensed} units of ${med.name}. Stock level updated.`;
      feedbackType = 'success';
    } else if (med.stockLevel > 0) {
      qtyDispensed = med.stockLevel;
      med.dispensedCount += med.stockLevel;
      med.stockLevel = 0;
      med.status = 'Stock Out';
      auditStatus = 'Discrepancy';
      feedbackText = `⚠️ Partial Dispensation: Dispensed only ${qtyDispensed} of ${qtyPrescribed} units for ${med.name} due to low stock! STOCK OUT triggered.`;
      feedbackType = 'warning';
    } else {
      qtyDispensed = 0;
      med.status = 'Stock Out';
      auditStatus = 'Pending Audit';
      feedbackText = `❌ CRITICAL STOCK OUT: Cannot dispense ${med.name}! Prescription unfulfilled. Clinical audit flagged.`;
      feedbackType = 'error';
    }

    // Update medication state
    if (med.stockLevel === 0) {
      med.status = 'Stock Out';
    } else if (med.stockLevel <= med.minAlertLevel) {
      med.status = 'Low Stock';
    } else {
      med.status = 'In Stock';
    }
    med.lastAuditedDate = new Date().toISOString().split('T')[0];
    medsList[medIndex] = med;
    setDispensaryMeds(medsList);

    // Add dispensation log
    const rxId = `RX-${Math.floor(1000 + Math.random() * 9000)}`;
    const dspId = `DSP-${Math.floor(100 + Math.random() * 900)}`;
    const newLog: DispensationLog = {
      id: dspId,
      prescriptionId: rxId,
      medicationName: med.name,
      qtyPrescribed,
      qtyDispensed,
      patientMrn: `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      auditStatus
    };

    setDispensations([newLog, ...dispensations]);
    setDispensaryFeedback({ type: feedbackType, text: feedbackText });
    
    // Auto clear feedback after 6 seconds
    setTimeout(() => {
      setDispensaryFeedback(current => current?.text === feedbackText ? null : current);
    }, 6000);
  };

  // Restock / Replenish medication inventory
  const handleRestockMedication = (medId: string) => {
    const medsList = [...dispensaryMeds];
    const medIndex = medsList.findIndex(m => m.id === medId);
    if (medIndex === -1) return;

    const med = medsList[medIndex];
    med.stockLevel += 100; // Refill 100 units
    med.status = 'In Stock';
    med.lastAuditedDate = new Date().toISOString().split('T')[0];
    medsList[medIndex] = med;
    setDispensaryMeds(medsList);

    const feedbackText = `📦 Restocked 100 units of ${med.name}. New level: ${med.stockLevel}. Status updated.`;
    setDispensaryFeedback({ type: 'success', text: feedbackText });
    setTimeout(() => {
      setDispensaryFeedback(current => current?.text === feedbackText ? null : current);
    }, 4000);
  };

  // Re-seed or restore initial stock levels for audit simulation
  const handleResetDispensary = () => {
    setDispensaryMeds(INITIAL_MEDS);
    setDispensations(INITIAL_DISPENSATIONS);
    setDispensaryFeedback({ type: 'success', text: "🔄 Dispensary Stock levels and Dispensed audit logs have been reset to factory baseline." });
    setTimeout(() => setDispensaryFeedback(null), 3000);
  };

  // Simulate a random patient prescription coming in to dispense
  const handleSimulateGlobalOutflow = () => {
    const randomIndex = Math.floor(Math.random() * dispensaryMeds.length);
    handleSimulateDispense(dispensaryMeds[randomIndex].id);
  };

  // Audit and reconcile a specific log entry (dispensed audit tools)
  const handleReconcileLog = (logId: string, newStatus: 'Verified' | 'Discrepancy') => {
    setDispensations(prev => prev.map(log => {
      if (log.id === logId) {
        return { ...log, auditStatus: newStatus };
      }
      return log;
    }));

    const feedbackText = `✓ Dispensation Log ${logId} has been audited and marked as [${newStatus}].`;
    setDispensaryFeedback({ type: 'success', text: feedbackText });
    setTimeout(() => {
      setDispensaryFeedback(current => current?.text === feedbackText ? null : current);
    }, 4000);
  };

  const activeTenantId = localStorage.getItem('active_hospital_tenant') || 'demo-global';

  // Load Audits from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'qi_audits'), (snapshot) => {
      const docsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QiAudit[];
      
      // Filter by hospital if needed
      const filtered = docsList.filter(a => !a.hospital_id || a.hospital_id === activeTenantId);
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());
      setAudits(filtered);
    }, (error) => {
      console.warn("Firestore subscription error for QI audits:", error);
    });

    return unsubscribe;
  }, [activeTenantId]);

  // Set checklist items when department changes or modal opens
  useEffect(() => {
    const defaultChecks = DEPARTMENT_CHECKLISTS[activeDept] || [];
    setCustomChecklist(defaultChecks.map(text => ({ text, checked: true })));
  }, [activeDept]);

  // Handle auto-generation of 12 audits (one for each department)
  const handleAutoGenerateAudits = async () => {
    setIsGenerating(true);
    try {
      // Clear or seed new ones
      for (const dept of DEPARTMENTS) {
        const checks = DEPARTMENT_CHECKLISTS[dept.id] || [];
        const score = Math.floor(Math.random() * 30) + 71; // 71 - 100
        const checkedItems = checks.map((text, idx) => ({
          text,
          checked: idx === 0 ? true : Math.random() > 0.15 // mostly true
        }));
        
        const passedCount = checkedItems.filter(c => c.checked).length;
        const calculatedScore = Math.round((passedCount / checks.length) * 100);
        const status = calculatedScore >= 90 ? 'Compliant' : calculatedScore >= 75 ? 'Partial' : 'Non-Compliant';
        const criticalIssuesCount = checks.length - passedCount;

        const dateOffset = Math.floor(Math.random() * 10);
        const auditDate = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString();

        await addDoc(collection(db, 'qi_audits'), {
          department: dept.id,
          auditDate,
          inspectorName: RANDOM_INSPECTORS[Math.floor(Math.random() * RANDOM_INSPECTORS.length)],
          complianceScore: calculatedScore,
          status,
          itemsAuditedCount: checks.length,
          criticalIssuesCount,
          checklist: checkedItems,
          recommendations: criticalIssuesCount > 0 
            ? `Immediate team sign-off and correction required for ${criticalIssuesCount} outstanding safety items.`
            : "Continue routine diagnostic vigilance. Excellent operational conformity detected.",
          notes: `Automatic clinical evaluation generated on day sequence ${dateOffset}. Zero tolerance for workflow omissions.`,
          hospital_id: activeTenantId
        });
      }
    } catch (err) {
      console.error("Failed to auto generate audits:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Create custom audit
  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspector.trim()) {
      alert("Please specify inspector name.");
      return;
    }

    try {
      const totalChecks = customChecklist.length;
      const passedCount = customChecklist.filter(c => c.checked).length;
      const finalScore = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;
      const status = finalScore >= 90 ? 'Compliant' : finalScore >= 75 ? 'Partial' : 'Non-Compliant';
      const criticalIssuesCount = totalChecks - passedCount;

      await addDoc(collection(db, 'qi_audits'), {
        department: activeDept,
        auditDate: new Date().toISOString(),
        inspectorName: newInspector.trim(),
        complianceScore: finalScore,
        status,
        itemsAuditedCount: totalChecks,
        criticalIssuesCount,
        checklist: customChecklist,
        recommendations: criticalIssuesCount > 0
          ? `Corrective training and clinical monitoring ordered for failed audit indicators.`
          : `All parameters verified in full compliance with hospital bylaws.`,
        notes: newNotes.trim() || 'Manual clinical audit record logged.',
        hospital_id: activeTenantId
      });

      setIsModalOpen(false);
      setNewInspector('');
      setNewNotes('');
    } catch (err) {
      console.error("Failed to create manual audit:", err);
    }
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this quality improvement audit entry?")) return;
    try {
      await deleteDoc(doc(db, 'qi_audits', id));
    } catch (err) {
      console.error("Error deleting audit:", err);
    }
  };

  // Toggle checklist checkbox in custom form
  const handleToggleCheck = (index: number) => {
    setCustomChecklist(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  };

  // Calculate high-level stats
  const activeDeptAudits = audits.filter(a => a.department === activeDept);
  const avgCompliance = activeDeptAudits.length > 0 
    ? Math.round(activeDeptAudits.reduce((acc, curr) => acc + curr.complianceScore, 0) / activeDeptAudits.length) 
    : 0;

  const totalAuditsAllDepts = audits.length;
  const criticalAlertsAllDepts = audits.filter(a => a.status === 'Non-Compliant').length;

  // Prepare chart data for compliance score history (all depts and selected dept)
  const chartData = activeDeptAudits
    .map(a => ({
      date: new Date(a.auditDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: a.complianceScore,
      issues: a.criticalIssuesCount
    }))
    .reverse();

  // Pie chart of compliance levels across all logged audits
  const compliantCount = audits.filter(a => a.status === 'Compliant').length;
  const partialCount = audits.filter(a => a.status === 'Partial').length;
  const nonCompliantCount = audits.filter(a => a.status === 'Non-Compliant').length;

  const pieData = [
    { name: 'Compliant (90%+)', value: compliantCount || 0, color: '#10b981' },
    { name: 'Partial (75%-89%)', value: partialCount || 0, color: '#f59e0b' },
    { name: 'Non-Compliant (<75%)', value: nonCompliantCount || 0, color: '#ef4444' }
  ].filter(p => p.value > 0);

  const selectedDeptMeta = DEPARTMENTS.find(d => d.id === activeDept) || DEPARTMENTS[0];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Audits Processed</span>
            <span className="text-2xl font-extrabold text-gray-950 font-mono">{totalAuditsAllDepts}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-indigo-600">
            <FileSpreadsheet size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Avg Department Score</span>
            <span className={`text-2xl font-extrabold font-mono ${avgCompliance >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {avgCompliance}%
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${avgCompliance >= 90 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Non-Compliant Alerts</span>
            <span className={`text-2xl font-extrabold font-mono ${criticalAlertsAllDepts > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {criticalAlertsAllDepts}
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${criticalAlertsAllDepts > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex flex-col justify-center gap-2">
          <button
            onClick={handleAutoGenerateAudits}
            disabled={isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Simulating Audits...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Auto-Generate Daily Audits</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Manual Department Audit</span>
          </button>
        </div>

      </div>

      {/* Main Grid: left navigation tabs, right details & charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation grid for departments */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-gray-150 p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} className="text-indigo-600" />
              <span>Audit Departments ({DEPARTMENTS.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {DEPARTMENTS.map((dept) => {
              const IconComp = dept.icon;
              const deptAudits = audits.filter(a => a.department === dept.id);
              const deptAvg = deptAudits.length > 0 
                ? Math.round(deptAudits.reduce((acc, curr) => acc + curr.complianceScore, 0) / deptAudits.length) 
                : null;
              const isSelected = activeDept === dept.id;

              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDept(dept.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-md border ${dept.color}`}>
                      <IconComp size={14} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">{dept.label}</span>
                  </div>
                  {deptAvg !== null && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                      deptAvg >= 90 ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' :
                      deptAvg >= 75 ? 'bg-amber-50 border border-amber-150 text-amber-700' :
                      'bg-rose-50 border border-rose-150 text-rose-700'
                    }`}>
                      {deptAvg}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit charts and metrics container */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Department Overview & Line Chart */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg border ${selectedDeptMeta.color}`}>
                    <selectedDeptMeta.icon size={18} />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-950">{selectedDeptMeta.label} Quality Dashboard</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active parameters and compliance score indicators derived from {activeDeptAudits.length} recorded inspections.
                </p>
              </div>

              {avgCompliance > 0 && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historical Average</div>
                  <div className={`text-2xl font-black font-mono ${avgCompliance >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {avgCompliance}%
                  </div>
                </div>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Historical Compliance Trend</div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Compliance Score (%)" 
                        stroke="#4f46e5" 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 1, fill: '#fff' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500 italic">
                No active audit history for this department. Use the trigger above to automatically generate high-fidelity history or register a manual clinical audit.
              </div>
            )}
          </div>

          {/* Table of specific department audits */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" />
              <span>Inspection History Logs</span>
            </h3>

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Auditor / Inspector</th>
                    <th className="px-4 py-2.5 text-center">Indicators Check</th>
                    <th className="px-4 py-2.5">Score</th>
                    <th className="px-4 py-2.5">Conformity</th>
                    <th className="px-4 py-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {activeDeptAudits.length > 0 ? (
                    activeDeptAudits.map((audit) => {
                      const isExpanded = expandedAuditId === audit.id;
                      const checksPassed = audit.checklist ? audit.checklist.filter(c => c.checked).length : 0;
                      const checksTotal = audit.checklist ? audit.checklist.length : 0;

                      return (
                        <React.Fragment key={audit.id}>
                          <tr 
                            onClick={() => setExpandedAuditId(isExpanded ? null : audit.id)}
                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3 text-gray-600 font-mono">
                              {new Date(audit.auditDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-950">
                              {audit.inspectorName}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-500">
                              {checksPassed} / {checksTotal}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-gray-900">
                              {audit.complianceScore}%
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                audit.status === 'Compliant' ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' :
                                audit.status === 'Partial' ? 'bg-amber-50 border border-amber-150 text-amber-700' :
                                'bg-rose-50 border border-rose-150 text-rose-700'
                              }`}>
                                {audit.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => handleDeleteAudit(audit.id, e)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded details container showing checklists */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-gray-50/50 p-4 border-t border-b border-gray-100">
                                <div className="space-y-3 text-xs">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Notes & Clinical Insights</span>
                                      <p className="text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-150 text-[11px] font-medium">
                                        {audit.notes || 'No notes compiled.'}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Actionable Recommendations</span>
                                      <p className="text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-150 text-[11px] font-medium">
                                        {audit.recommendations || 'No recommendations documented.'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="font-extrabold text-gray-700 block text-[10px] uppercase">Indicators checklist Status</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-gray-150">
                                      {audit.checklist && audit.checklist.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-[11px] font-medium text-gray-700">
                                          {item.checked ? (
                                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                          ) : (
                                            <AlertTriangle size={14} className="text-rose-500 shrink-0 animate-pulse" />
                                          )}
                                          <span className={item.checked ? '' : 'text-rose-700 line-through decoration-rose-200'}>
                                            {item.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                        No inspections recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispensary Prescription Medication Out & Audit tools */}
          {activeDept === 'dispensary' && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 space-y-5 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
                      <Pill size={16} />
                    </span>
                    <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                      Prescription Stock-Out & Dispensation Audit Station
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Audit outward clinical prescriptions against active pharmacy inventory. Verify stock-outs, monitor dispensation rates, and execute compliance reviews.
                  </p>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleSimulateGlobalOutflow}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Generate a random client prescription request and record its dispensing details"
                  >
                    <Sparkles size={13} />
                    <span>Simulate Rx Outflow 💊</span>
                  </button>
                  <button
                    onClick={handleResetDispensary}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-gray-200"
                    title="Reset stock inventory and audit trail to baseline values"
                  >
                    <RotateCcw size={12} />
                    <span>Reset baseline</span>
                  </button>
                </div>
              </div>

              {/* Feedback Alert Banners */}
              {dispensaryFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn transition-all ${
                  dispensaryFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
                  dispensaryFeedback.type === 'warning' ? 'bg-amber-50 border-amber-150 text-amber-800' :
                  'bg-rose-50 border-rose-150 text-rose-800'
                }`}>
                  {dispensaryFeedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                  {dispensaryFeedback.type === 'warning' && <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />}
                  {dispensaryFeedback.type === 'error' && <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />}
                  <div className="leading-normal font-semibold">
                    {dispensaryFeedback.text}
                  </div>
                </div>
              )}

              {/* Filtering bar */}
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-250">
                <Search size={14} className="text-gray-400 ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter stock by pharmaceutical name or category..."
                  value={medFilter}
                  onChange={(e) => setMedFilter(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium"
                />
                {medFilter && (
                  <button 
                    onClick={() => setMedFilter('')}
                    className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 hover:bg-gray-200 rounded font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: Active stock and out registers */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                      Pharmacy Active Inventory Monitor
                    </span>
                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {dispensaryMeds.filter(m => m.stockLevel === 0).length} Stock-outs detected
                    </span>
                  </div>

                  <div className="border border-gray-150 rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
                    {dispensaryMeds
                      .filter(m => m.name.toLowerCase().includes(medFilter.toLowerCase()) || m.category.toLowerCase().includes(medFilter.toLowerCase()))
                      .map((med) => {
                        const isStockOut = med.stockLevel === 0;
                        const isLowStock = !isStockOut && med.stockLevel <= med.minAlertLevel;
                        const stockPercentage = Math.min(100, Math.round((med.stockLevel / 150) * 100));

                        return (
                          <div key={med.id} className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-gray-50/40 ${isStockOut ? 'bg-rose-50/20' : ''}`}>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                                  {med.id}
                                </span>
                                <h4 className="text-xs font-bold text-gray-950 truncate">{med.name}</h4>
                                <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  {med.category}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-[120px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isStockOut ? 'bg-rose-500' :
                                      isLowStock ? 'bg-amber-400' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${stockPercentage}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-extrabold text-gray-600 shrink-0">
                                  Stock: {med.stockLevel} units
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="text-right">
                                {isStockOut ? (
                                  <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 text-[9px] font-black rounded-md inline-flex items-center gap-0.5 animate-pulse">
                                    <PackageX size={10} />
                                    <span>STOCK OUT ⚠️</span>
                                  </span>
                                ) : isLowStock ? (
                                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-extrabold rounded-md inline-flex items-center gap-0.5">
                                    <AlertTriangle size={10} />
                                    <span>LOW STOCK</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[9px] font-bold rounded-md">
                                    Adequate
                                  </span>
                                )}
                                <span className="block text-[9px] text-gray-400 font-mono mt-0.5">Audited: {med.lastAuditedDate}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSimulateDispense(med.id)}
                                  className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                                  title="Dispense a new prescription from this stock"
                                >
                                  Dispense 💊
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRestockMedication(med.id)}
                                  className="p-1 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-250 text-gray-700 text-[10px] font-semibold rounded-md cursor-pointer transition-colors"
                                  title="Add +100 units to inventory stock"
                                >
                                  Restock 📦
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Right Column: Outward Dispensed prescription ledger with audit checklist tools */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                      Prescription Dispensed Audit Logs
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 font-mono">
                      {dispensations.length} records total
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {dispensations.map((log) => {
                      return (
                        <div key={log.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-150 space-y-2.5 hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] font-black text-gray-500 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">
                                {log.id}
                              </span>
                              <span className="font-mono text-[9px] font-semibold text-gray-400">
                                Rx: {log.prescriptionId}
                              </span>
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-950">
                              <span>{log.medicationName}</span>
                              <span className="font-mono text-gray-600">
                                {log.qtyDispensed} / {log.qtyPrescribed} units
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>Patient MRN: <strong className="text-gray-600 font-mono">{log.patientMrn}</strong></span>
                              <span>
                                {log.qtyDispensed === log.qtyPrescribed 
                                  ? 'Fully Dispensed' 
                                  : log.qtyDispensed === 0 
                                  ? 'Unfulfilled (Stock Out ⚠️)' 
                                  : `Shortfilled (Partial ⚠️)`
                                }
                              </span>
                            </div>
                          </div>

                          {/* Audit and reconcile buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                            <div className="flex items-center gap-1">
                              {log.auditStatus === 'Verified' ? (
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Check size={8} /> Verified Log
                                </span>
                              ) : log.auditStatus === 'Pending Audit' ? (
                                <span className="bg-amber-50 border border-amber-150 text-amber-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                  <Clock size={8} /> Pending Audit
                                </span>
                              ) : (
                                <span className="bg-rose-50 border border-rose-150 text-rose-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <AlertTriangle size={8} /> Discrepancy Flag
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleReconcileLog(log.id, 'Verified')}
                                className="px-2 py-0.5 bg-white border border-gray-250 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-[9px] font-extrabold rounded text-gray-600 cursor-pointer transition-all"
                                title="Verify this dispensation log after physical inventory match"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReconcileLog(log.id, 'Discrepancy')}
                                className="px-2 py-0.5 bg-white border border-gray-250 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-[9px] font-extrabold rounded text-gray-600 cursor-pointer transition-all"
                                title="Flag this dispensation log for auditing discrepancies"
                              >
                                Flag
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Compliance Levels across entire facility (doughnut breakdown) */}
          {totalAuditsAllDepts > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Facility Compliance Distribution</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Consolidated compliance status for all departments. Active directives prioritize resolving non-compliant areas immediately.
                </p>
              </div>

              <div className="md:col-span-4 h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-4 space-y-2">
                {pieData.map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-gray-700">{data.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">{data.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Manual Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>Log Manual {selectedDeptMeta.label} Audit</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Inspector Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Martha Addis"
                    value={newInspector}
                    onChange={(e) => setNewInspector(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Audit Department
                  </label>
                  <select
                    value={activeDept}
                    onChange={(e) => setActiveDept(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist inputs */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Checklist Indicators Verification (Toggle to verify compliance)
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-150 rounded-lg p-3 bg-gray-50/50">
                  {customChecklist.map((item, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-start gap-2.5 p-1.5 hover:bg-white rounded transition-colors cursor-pointer text-[11px] font-medium text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheck(idx)}
                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Audit Notes & Findings
                </label>
                <textarea
                  placeholder="Incorporate findings, clinical deviations, or procedural context..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Confirm & Save Audit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
