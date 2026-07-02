import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Calendar, Home as BedIcon, AlertTriangle, 
  Clock, ArrowUpRight, Plus, CheckCircle2, Package, ShieldCheck, 
  Users2, ClipboardList, Stethoscope, ChevronRight, FileText,
  DollarSign, AlertCircle, TrendingUp, UserCheck, Bell, Heart,
  RotateCcw
} from 'lucide-react';
import { 
  collection, onSnapshot, query, limit, orderBy, doc, updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

// Required for the firebase-integration skill error handlers
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon: Icon, colorClass, onClick }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-950 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
            {value}
          </h3>
          <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="absolute bottom-2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-bold text-gray-500">View Division</span>
        <ArrowUpRight size={10} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function Home({ setActiveTab }: HomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time counts
  const [counts, setCounts] = useState({
    patients: 0,
    encounters: 0,
    appointments: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    lowStockSupplies: 0,
    pendingMrns: 0
  });

  // KPI Lists and states
  const [admittedPatients, setAdmittedPatients] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Loading state tracking for individual alerts being acknowledged
  const [acknowledgingIds, setAcknowledgingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number;

    // Helper to verify if document data belongs to authorized hospital tenant boundary
    const belongsToTenant = (data: any) => {
      if (!tenantId) return true; // Owner bypass has full visibility
      if (!data.hospital_id || data.hospital_id === 'demo-global') return true; 
      return data.hospital_id === tenantId;
    };

    // 1. Live patients count
    const pathPatients = 'patients';
    try {
      const unsubPatients = onSnapshot(collection(db, pathPatients), (snapshot) => {
        const filteredDocs = snapshot.docs.filter(doc => belongsToTenant(doc.data()));
        setCounts(prev => ({ ...prev, patients: filteredDocs.length }));
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathPatients);
      });
      unsubscribes.push(unsubPatients);
    } catch (e) { console.error(e); }

    // 2. Live clinical encounters count
    const pathEncounters = 'clinical_encounters';
    try {
      const unsubEncounters = onSnapshot(collection(db, pathEncounters), (snapshot) => {
        const filteredDocs = snapshot.docs.filter(doc => belongsToTenant(doc.data()));
        setCounts(prev => ({ ...prev, encounters: filteredDocs.length }));
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathEncounters);
      });
      unsubscribes.push(unsubEncounters);
    } catch (e) { console.error(e); }

    // 3. Live appointments count
    const pathAppointments = 'appointments';
    try {
      const unsubAppointments = onSnapshot(collection(db, pathAppointments), (snapshot) => {
        const filteredDocs = snapshot.docs.filter(doc => belongsToTenant(doc.data()));
        setCounts(prev => ({ ...prev, appointments: filteredDocs.length }));
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathAppointments);
      });
      unsubscribes.push(unsubAppointments);
    } catch (e) { console.error(e); }

    // 4. Live beds & Admitted Patients status
    const pathBeds = 'beds';
    try {
      const unsubBeds = onSnapshot(collection(db, pathBeds), (snapshot) => {
        let occupied = 0;
        const admittedList: any[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (belongsToTenant(data)) {
            if (data.status === 'occupied') {
              occupied++;
              admittedList.push({ id: doc.id, ...data });
            }
          }
        });
        const totalTenantBeds = snapshot.docs.filter(doc => belongsToTenant(doc.data())).length;
        setCounts(prev => ({ ...prev, occupiedBeds: occupied, totalBeds: totalTenantBeds }));
        setAdmittedPatients(admittedList);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathBeds);
      });
      unsubscribes.push(unsubBeds);
    } catch (e) { console.error(e); }

    // 5. Live supply items count
    const pathSupplies = 'supply_items';
    try {
      const unsubSupplies = onSnapshot(collection(db, pathSupplies), (snapshot) => {
        let lowStockCount = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (belongsToTenant(data)) {
            const qty = Number(data.qty_on_hand) || 0;
            const reorder = Number(data.reorder_level) || 0;
            if (qty <= reorder || data.status === 'low_stock' || data.status === 'out_of_stock') {
              lowStockCount++;
            }
          }
        });
        setCounts(prev => ({ ...prev, lowStockSupplies: lowStockCount }));
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathSupplies);
      });
      unsubscribes.push(unsubSupplies);
    } catch (e) { console.error(e); }

    // 6. Live pending MRN registrations
    const pathMrns = 'patient_mrn_registrations';
    try {
      const unsubMrns = onSnapshot(collection(db, pathMrns), (snapshot) => {
        let pending = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (belongsToTenant(data) && data.status === 'pending_verification') {
            pending++;
          }
        });
        setCounts(prev => ({ ...prev, pendingMrns: pending }));
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathMrns);
      });
      unsubscribes.push(unsubMrns);
    } catch (e) { console.error(e); }

    // 7. Live pending invoices (FinancialLedger status === 'pending')
    const pathLedger = 'financial_ledger';
    try {
      const unsubLedger = onSnapshot(collection(db, pathLedger), (snapshot) => {
        const pendingList: any[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (belongsToTenant(data) && data.status === 'pending') {
            pendingList.push({ id: doc.id, ...data });
          }
        });
        setPendingInvoices(pendingList);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathLedger);
      });
      unsubscribes.push(unsubLedger);
    } catch (e) { console.error(e); }

    // 8. Live active alerts (Notifications is_acknowledged !== true)
    const pathNotifications = 'notifications';
    try {
      const unsubNotifications = onSnapshot(collection(db, pathNotifications), (snapshot) => {
        const activeList: any[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (belongsToTenant(data) && (data.is_acknowledged === false || data.is_acknowledged === undefined)) {
            activeList.push({ id: doc.id, ...data });
          }
        });
        // Sort active alerts so critical are always on top
        activeList.sort((a, b) => {
          const order: Record<string, number> = { critical: 3, warning: 2, info: 1 };
          const orderA = order[a.severity] || 0;
          const orderB = order[b.severity] || 0;
          return orderB - orderA;
        });
        setActiveAlerts(activeList);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathNotifications);
      });
      unsubscribes.push(unsubNotifications);
    } catch (e) { console.error(e); }

    // 9. Live latest patient journey events / recent logs
    const pathEvents = 'patient_journey_events';
    try {
      const eventsQuery = query(collection(db, pathEvents), orderBy('event_time', 'desc'));
      const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
        const list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => belongsToTenant(item))
          .slice(0, 5);
        setRecentEvents(list);
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, pathEvents);
        setLoading(false);
      });
      unsubscribes.push(unsubEvents);
    } catch (e) { 
      console.error(e); 
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Action: Acknowledge live alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!alertId) return;
    setAcknowledgingIds(prev => ({ ...prev, [alertId]: true }));
    
    const docPath = `notifications/${alertId}`;
    try {
      const alertRef = doc(db, 'notifications', alertId);
      await updateDoc(alertRef, {
        is_acknowledged: true,
        acknowledged_by: auth.currentUser?.email || 'Admin Clinical Supervisor',
        acknowledged_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setAcknowledgingIds(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // Calculate sum of pending invoices
  const pendingInvoicesSum = pendingInvoices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcoming Interactive Hero Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs relative overflow-hidden p-6 sm:p-8">
        {/* Subtle decorative design elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Central Clinical Station
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-tight">
              Hospital Electronic Health Record
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl font-medium">
              Welcome back to the clinical supervisor dashboard. Real-time patient charts, secure biometric clearances, and resource allocations are active and synchronized.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shrink-0 w-full md:w-auto text-center md:text-right shadow-2xs">
            <div className="flex items-center justify-center md:justify-end gap-2 text-blue-600 font-bold text-sm mb-1">
              <Clock size={16} />
              <span className="font-mono tracking-tight">{formattedTime}</span>
            </div>
            <p className="text-xs font-semibold text-gray-800">{formattedDate}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Timezone: Africa/Addis_Ababa</p>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Interactive Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Registered" 
          value={counts.patients} 
          subtitle="Unique Medical Charts" 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Active Encounters" 
          value={counts.encounters} 
          subtitle="Completed / Live Triages" 
          icon={Activity} 
          colorClass="bg-indigo-50 text-indigo-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Today's Bookings" 
          value={counts.appointments} 
          subtitle="Outpatient / Ward Schedules" 
          icon={Calendar} 
          colorClass="bg-purple-50 text-purple-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Bed Occupancy" 
          value={counts.totalBeds > 0 ? `${counts.occupiedBeds} / ${counts.totalBeds}` : '0 / 0'} 
          subtitle={`${counts.totalBeds - counts.occupiedBeds} Wards Vacant`} 
          icon={BedIcon} 
          colorClass="bg-emerald-50 text-emerald-600"
          onClick={() => setActiveTab('Data')}
        />
      </div>

      {/* 3. Real-Time Key Performance Indicators (KPI) & Care Command Center */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-xs">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-gray-950 tracking-tight">Real-Time EHR Command Center</h2>
              <p className="text-xs text-gray-500 font-medium">Synchronized metrics streaming live from clinic operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Stream Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Card 1: Admitted Patients */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-emerald-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Admitted Patients</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">{admittedPatients.length}</span>
                    <span className="text-xs text-gray-400 font-semibold">on ward beds</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BedIcon size={18} />
                </div>
              </div>

              {/* Scrollable Patient List */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {admittedPatients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <UserCheck size={28} className="text-gray-300" />
                    <p className="text-xs font-bold text-gray-800">No Inpatient Admissions</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">All beds are currently available in the clinical wards.</p>
                  </div>
                ) : (
                  admittedPatients.map((bed, idx) => (
                    <div 
                      key={bed.id || idx}
                      className="p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 transition-all text-xs flex justify-between items-center group shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                          {bed.patient_name || 'Anonymous Patient'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium font-mono uppercase">
                          MRN: {bed.patient_uid || 'N/A'} • Bed {bed.bed_number}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold">
                          Ward: <strong className="text-gray-600">{bed.ward}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                          Admitted
                        </span>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
                          {bed.admission_date ? new Date(bed.admission_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Bed Occupancy: {counts.totalBeds > 0 ? Math.round((counts.occupiedBeds / counts.totalBeds) * 100) : 0}%</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-emerald-600 font-bold flex items-center gap-0.5">
                Manage Beds <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* KPI Card 2: Pending Invoices */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-amber-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Pending Invoices</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      {pendingInvoicesSum.toLocaleString('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-amber-600 font-extrabold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      {pendingInvoices.length} Bills
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Scrollable Financial Ledger */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {pendingInvoices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <CheckCircle2 size={28} className="text-gray-300 animate-pulse" />
                    <p className="text-xs font-bold text-gray-800">Financial Ledger Cleared</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">No pending payments or unbilled transactions exist currently.</p>
                  </div>
                ) : (
                  pendingInvoices.map((invoice, idx) => (
                    <div 
                      key={invoice.id || idx}
                      className="p-3 bg-white border border-gray-100 rounded-xl hover:border-amber-200 transition-all text-xs flex justify-between items-center group shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-gray-900 uppercase tracking-tight">
                          {invoice.patient_name || 'Anonymous Patient'}
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                          {invoice.service_type || 'Service'} Fee
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium leading-tight">
                          {invoice.description || 'Outpatient service billing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-950 font-mono">
                          {Number(invoice.amount).toLocaleString('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {invoice.tx_date ? new Date(invoice.tx_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Today'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Total outstanding ledger value</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-amber-600 font-bold flex items-center gap-0.5">
                Cashier Panel <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* KPI Card 3: Active Alerts & Remediation */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-rose-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Active Alerts</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">{activeAlerts.length}</span>
                    <span className="text-xs text-rose-600 font-extrabold uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                      Unresolved
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl relative">
                  <Bell size={18} className={activeAlerts.length > 0 ? 'animate-bounce' : ''} />
                  {activeAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Active Alerts List */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {activeAlerts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <ShieldCheck size={28} className="text-gray-300" />
                    <p className="text-xs font-bold text-gray-800">Clear Clinical Grid</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">No active critical alerts or patient alerts are pending response.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {activeAlerts.map((alert, idx) => {
                      const isCritical = alert.severity === 'critical';
                      const isWarning = alert.severity === 'warning';
                      const badgeColor = isCritical 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : isWarning 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100';

                      return (
                        <motion.div 
                          key={alert.id || idx}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-3 bg-white border border-gray-100 rounded-xl hover:border-rose-100 transition-all text-xs flex gap-2 justify-between items-start shadow-2xs`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                                {alert.severity || 'alert'}
                              </span>
                              <span className="font-extrabold text-gray-900 truncate uppercase tracking-tight">
                                {alert.title}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                              {alert.message}
                            </p>
                            {alert.patient_name && (
                              <p className="text-[9px] text-gray-400 font-semibold font-mono uppercase">
                                Patient: {alert.patient_name} • MRN: {alert.patient_uid || 'N/A'}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={acknowledgingIds[alert.id]}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shrink-0 cursor-pointer border border-transparent hover:border-emerald-100 disabled:opacity-50"
                            title="Acknowledge & Resolve Alert"
                          >
                            {acknowledgingIds[alert.id] ? (
                              <RotateCcw size={14} className="animate-spin text-emerald-600" />
                            ) : (
                              <CheckCircle2 size={14} className="hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Resolutions trigger real-time SMS status reports</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-rose-600 font-bold flex items-center gap-0.5">
                All Alerts <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Clinical Division Quick Controls & Notice Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Commands panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Stethoscope size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Clinical Operations Shortcuts</h3>
                <p className="text-xs text-gray-400 font-medium">Instantly access specific clinical registries and forms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/50 hover:bg-blue-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Add New Patient</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Assign unique MRN & chart</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/50 hover:bg-indigo-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Record Triage/Encounter</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Log active patient vitals</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 bg-gray-50/50 hover:bg-purple-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Write Prescription</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Generate digital drug sheet</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/50 hover:bg-emerald-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <BedIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Manage Ward Beds</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Review occupied and available beds</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-50 mt-6 pt-4 flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            <span>EHR System Authorization Level: Full Access Admin</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck size={12} className="inline" /> Security: SEC-A256
            </span>
          </div>
        </div>

        {/* Clinical Alert & Stock Level Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">EHR Active Indicators</h3>
                <p className="text-xs text-gray-400 font-medium">Items requiring clinical attention</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* MRN Verification Alert */}
              <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                counts.pendingMrns > 0 
                  ? 'bg-amber-50/40 border-amber-100 text-amber-800' 
                  : 'bg-gray-50/50 border-gray-100 text-gray-600'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Users2 size={16} className={counts.pendingMrns > 0 ? 'text-amber-500' : 'text-gray-400'} />
                  <div>
                    <h4 className="text-xs font-bold">MRN Registrations</h4>
                    <p className="text-[10px] opacity-80 font-semibold">{counts.pendingMrns} Pending Verification</p>
                  </div>
                </div>
                {counts.pendingMrns > 0 && (
                  <button 
                    onClick={() => setActiveTab('Data')}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Review
                  </button>
                )}
              </div>

              {/* Pharmacy Inventory Supply Alert */}
              <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                counts.lowStockSupplies > 0 
                  ? 'bg-rose-50/40 border-rose-100 text-rose-800' 
                  : 'bg-gray-50/50 border-gray-100 text-gray-600'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Package size={16} className={counts.lowStockSupplies > 0 ? 'text-rose-500' : 'text-gray-400'} />
                  <div>
                    <h4 className="text-xs font-bold">Clinic Inventory Status</h4>
                    <p className="text-[10px] opacity-80 font-semibold">{counts.lowStockSupplies} items near low stock limit</p>
                  </div>
                </div>
                {counts.lowStockSupplies > 0 && (
                  <button 
                    onClick={() => setActiveTab('Data')}
                    className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Restock
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-50 mt-4 pt-4">
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Biometric registrations are auto-verified against the national identity ledger if a fingerprint hash is stored.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Live Activity Timeline Feed (Recent Patient Journeys) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Active Patient Journey Feed</h3>
              <p className="text-xs text-gray-400 font-medium">Real-time status of clinical flow through departments</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('Data')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Timeline</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400 font-semibold animate-pulse">
            Loading real-time EHR timeline events...
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Activity size={24} className="mx-auto text-gray-300 mb-2 animate-pulse" />
            <h4 className="text-xs font-bold text-gray-800">No Patient Journeys Found</h4>
            <p className="text-[10px] text-gray-400 max-w-xs mx-auto mt-1">
              Add records or trigger auto-seed data inside the Clinical Explorer to view interactive timeline progress.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-gray-100 pl-6 ml-3 space-y-6">
            {recentEvents.map((event, index) => {
              const formattedTime = event.event_time 
                ? new Date(event.event_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                : 'Unknown Time';
              
              const stageColors: Record<string, string> = {
                registration: 'bg-blue-500',
                triage: 'bg-indigo-500',
                consultation: 'bg-purple-500',
                pharmacy: 'bg-emerald-500',
                laboratory: 'bg-rose-500',
                billing: 'bg-amber-500',
                discharged: 'bg-slate-500'
              };

              const stageColor = stageColors[event.stage] || 'bg-gray-400';

              return (
                <div key={event.id || index} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-4 ring-gray-50 transition-transform group-hover:scale-110 ${stageColor}`}></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-950 uppercase tracking-tight">
                          {event.patient_name || 'Anonymous Patient'}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 font-mono">
                          {event.patient_uid || 'N/A'}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase bg-gray-100 text-gray-700 tracking-wider">
                          {event.stage_label || event.stage}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 max-w-2xl font-medium leading-relaxed">
                        {event.notes || 'Routine department transit event recorded.'}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-semibold">
                        <span>Handled by: <strong className="text-gray-700 font-bold">{event.handled_by || 'Admin Staff'}</strong></span>
                        <span>•</span>
                        <span>Location: <strong className="text-gray-700 font-bold">{event.location || 'Unknown Ward'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-gray-400 self-end sm:self-center shrink-0">
                      <Clock size={10} />
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
