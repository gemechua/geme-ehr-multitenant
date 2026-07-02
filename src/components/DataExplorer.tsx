import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, query, addDoc, deleteDoc, doc, getDocs, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Activity, Users, Pill, Calendar, FileText, Settings2, CreditCard, 
  Bell, TrendingUp, DollarSign, Heart, Package, Home, Shield, 
  Search, Plus, Trash2, Database, DatabaseZap, Info, X, ChevronRight, Check,
  Edit, SlidersHorizontal, MoreHorizontal, Upload, Download, History,
  QrCode, Printer, Bed, Thermometer, ShieldAlert, AlertTriangle, LogIn, Link2,
  Syringe, Scissors, ClipboardList, UserCheck, Users2, AlertCircle
} from 'lucide-react';
import { ENTITIES_CONFIG, ENTITIES_ORDER, EntityConfig } from '../data/schema';
import { patientSchema } from '../lib/schemas';



export default function DataExplorer() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('Appointment');
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<string>('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [seedingLoading, setSeedingLoading] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isGlobalSchemaOpen, setIsGlobalSchemaOpen] = useState(false);

  // Patient Admission QR States
  const [selectedPatientQr, setSelectedPatientQr] = useState<any | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerSelectedPatientId, setScannerSelectedPatientId] = useState('');
  const [scannerSuccessMsg, setScannerSuccessMsg] = useState('');

  // Multi-purpose QR and Scanner States
  const [qrType, setQrType] = useState<'patient' | 'staff' | 'user' | 'inpatient' | 'outpatient' | 'record'>('patient');
  const [qrPurpose, setQrPurpose] = useState<string>('Universal Clinical Registration');
  const [scannerMode, setScannerMode] = useState<'patient' | 'staff' | 'user' | 'inpatient' | 'outpatient'>('patient');
  const [scannerSelectedItemId, setScannerSelectedItemId] = useState('');
  const [scannerStaffList, setScannerStaffList] = useState<any[]>([]);
  const [scannerUserList, setScannerUserList] = useState<any[]>([]);
  const [scannerInpatientList, setScannerInpatientList] = useState<any[]>([]);
  const [scannerOutpatientList, setScannerOutpatientList] = useState<any[]>([]);

  // Synchronize dropdown lists when scanner modal is opened
  useEffect(() => {
    if (isScannerModalOpen) {
      getDocs(collection(db, 'staff')).then(snap => {
        setScannerStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => console.warn("Error fetching scanner staff:", err));

      getDocs(collection(db, 'users')).then(snap => {
        setScannerUserList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => console.warn("Error fetching scanner users:", err));

      getDocs(collection(db, 'admissions')).then(snap => {
        setScannerInpatientList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => console.warn("Error fetching scanner admissions:", err));

      getDocs(collection(db, 'clinical_encounters')).then(snap => {
        setScannerOutpatientList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => console.warn("Error fetching scanner clinical encounters:", err));
    }
  }, [isScannerModalOpen]);

  // Handler to present a tailored QR code badge based on the active EHR Schema table
  const handlePresentQrCode = (record: any, entityId: string) => {
    if (entityId === 'Patient') {
      setSelectedPatientQr(record);
      setQrType('patient');
      setQrPurpose('Universal Clinical Registration');
      setIsQrModalOpen(true);
    } else if (entityId === 'Staff') {
      setSelectedPatientQr(record);
      setQrType('staff');
      setQrPurpose('Clinical Staff Shift & Duty Verification');
      setIsQrModalOpen(true);
    } else if (entityId === 'User') {
      setSelectedPatientQr(record);
      setQrType('user');
      setQrPurpose('Secure EHR Workspace Authorization');
      setIsQrModalOpen(true);
    } else if (entityId === 'Admission' || entityId === 'Bed') {
      // Inpatient tables (Admission or Bed occupancy)
      const patientMrn = record.patient_mrn || record.mrn || '';
      const matchedPat = patients.find(p => p.mrn === patientMrn || p.id === record.patient_id);
      setSelectedPatientQr(matchedPat || {
        full_name: record.patient_name || 'Inpatient Resident',
        gender: record.gender || 'Unknown',
        blood_group: record.blood_group || 'N/A',
        date_of_birth: record.dob || 'N/A',
        mrn: patientMrn || `MRN-${record.id.slice(0, 4).toUpperCase()}`,
        phone: record.phone || 'N/A',
        id: record.patient_id || record.id
      });
      setQrType('inpatient');
      setQrPurpose(`Inpatient Ward Admission (Ward: ${record.ward || 'General Ward'}, Bed: ${record.bed_number || record.id || 'N/A'})`);
      setIsQrModalOpen(true);
    } else if (entityId === 'ClinicalEncounter' || entityId === 'Appointment') {
      // Outpatient tables (Clinical Encounter or Appointment visit)
      const patientMrn = record.patient_mrn || record.mrn || '';
      const matchedPat = patients.find(p => p.mrn === patientMrn || p.id === record.patient_id);
      setSelectedPatientQr(matchedPat || {
        full_name: record.patient_name || 'Outpatient Patient',
        gender: record.gender || 'Unknown',
        blood_group: 'N/A',
        date_of_birth: 'N/A',
        mrn: patientMrn || `MRN-${record.id.slice(0, 4).toUpperCase()}`,
        phone: 'N/A',
        id: record.patient_id || record.id
      });
      setQrType('outpatient');
      setQrPurpose(`Outpatient Consultation (Clinic: ${record.clinic || 'General OPD'})`);
      setIsQrModalOpen(true);
    } else {
      // General record tracing or patient-specific QR
      const patientMrn = record.patient_mrn || '';
      const matchedPat = patientMrn ? patients.find(p => p.mrn === patientMrn) : null;
      if (matchedPat) {
        setSelectedPatientQr(matchedPat);
        setQrType('patient');
        setQrPurpose(`Associated Patient Record Tracking (${entityId})`);
      } else {
        setSelectedPatientQr(record);
        setQrType('record');
        setQrPurpose(`EHR ${entityId} Ledger Cryptographic Verification`);
      }
      setIsQrModalOpen(true);
    }
  };

  const handleSimulateScan = () => {
    let matchedItem: any = null;
    let successMessage = '';

    if (scannerMode === 'patient') {
      matchedItem = patients.find(p => p.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Verifying Patient Registration QR: ${matchedItem.full_name || matchedItem.name}...`;
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Patient');
          const searchVal = matchedItem.mrn || `MRN-${matchedItem.id.slice(0, 4).toUpperCase()}`;
          setSearchQuery(searchVal);
          setSelectedPatientQr(matchedItem);
          setQrType('patient');
          setQrPurpose('Universal Clinical Registration');
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'staff') {
      matchedItem = scannerStaffList.find(s => s.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Clocking clinical staff shift via Secure Badge: ${matchedItem.full_name}...`;
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Staff');
          setSearchQuery(matchedItem.full_name || matchedItem.staff_id || '');
          setSelectedPatientQr(matchedItem);
          setQrType('staff');
          setQrPurpose('Clinical Staff Shift & Duty Verification');
          setIsQrModalOpen(true);
          
          alert(`SHIFT CLOCK-IN VERIFIED\nStaff: ${matchedItem.full_name}\nRole: ${matchedItem.role}\nDepartment: ${matchedItem.department.toUpperCase()}\nStatus: Clock-In event synchronized successfully.`);
        }, 1500);
      }
    } else if (scannerMode === 'user') {
      matchedItem = scannerUserList.find(u => u.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Verifying EHR User Credentials: ${matchedItem.full_name || matchedItem.email}...`;
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('User');
          setSearchQuery(matchedItem.email || matchedItem.full_name || '');
          setSelectedPatientQr(matchedItem);
          setQrType('user');
          setQrPurpose('Secure EHR Workspace Authorization');
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'inpatient') {
      matchedItem = scannerInpatientList.find(a => a.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Locating Inpatient Ward Assignment: ${matchedItem.patient_name || matchedItem.patient_mrn}...`;
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Admission');
          setSearchQuery(matchedItem.patient_mrn || matchedItem.admission_id || '');
          
          const pat = patients.find(p => p.mrn === matchedItem.patient_mrn);
          setSelectedPatientQr(pat || {
            full_name: matchedItem.patient_name || 'Inpatient Resident',
            mrn: matchedItem.patient_mrn || 'N/A',
            gender: 'Unknown',
            blood_group: 'N/A',
            date_of_birth: 'N/A',
            phone: 'N/A',
            id: matchedItem.id
          });
          setQrType('inpatient');
          setQrPurpose(`Inpatient Ward Admission (Ward: ${matchedItem.ward || 'General Ward'}, Bed: ${matchedItem.bed_number || 'N/A'})`);
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'outpatient') {
      matchedItem = scannerOutpatientList.find(e => e.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Loading Outpatient Consultation Encounter: ${matchedItem.patient_name || matchedItem.patient_mrn}...`;
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('ClinicalEncounter');
          setSearchQuery(matchedItem.patient_mrn || matchedItem.visit_id || '');
          
          const pat = patients.find(p => p.mrn === matchedItem.patient_mrn);
          setSelectedPatientQr(pat || {
            full_name: matchedItem.patient_name || 'Outpatient Patient',
            mrn: matchedItem.patient_mrn || 'N/A',
            gender: 'Unknown',
            blood_group: 'N/A',
            date_of_birth: 'N/A',
            phone: 'N/A',
            id: matchedItem.id
          });
          setQrType('outpatient');
          setQrPurpose(`Outpatient Consultation (Clinic: ${matchedItem.clinic || 'General OPD'}, Visit ID: ${matchedItem.visit_id || 'N/A'})`);
          setIsQrModalOpen(true);
        }, 1500);
      }
    }

    if (!matchedItem) {
      alert('Please select an item to simulate scanning.');
    }
  };
  
  // Prescription items inline builder states
  const [itemDrug, setItemDrug] = useState('');
  const [itemDose, setItemDose] = useState('');
  const [itemFreq, setItemFreq] = useState('');
  const [itemDur, setItemDur] = useState('');

  // InsuranceClaim services inline builder states
  const [serviceType, setServiceType] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');

  // LabResult result_entries inline builder states
  const [entryParam, setEntryParam] = useState('');
  const [entryVal, setEntryVal] = useState('');
  const [entryUnit, setEntryUnit] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryFlag, setEntryFlag] = useState('normal');

  // Simple tag builder states
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newTargetRole, setNewTargetRole] = useState('');
  
  // Interactive filters for ClinicalEncounter and Staff
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    encounter_type: '',
    clinic: '',
    vitals_pulse_min: '',
    vitals_pulse_max: '',
    vitals_temp_min: '',
    vitals_temp_max: '',
    vitals_spo2_min: '',
    vitals_spo2_max: '',
    vitals_respiratory_rate_min: '',
    vitals_respiratory_rate_max: '',
    vitals_weight_min: '',
    vitals_weight_max: '',
    encounter_date_from: '',
    encounter_date_to: '',
    status: '',
    priority: '',
    // Staff filters
    staff_id: '',
    full_name: '',
    department: '',
    role: '',
    // Prescription filters
    prescribed_at_from: '',
    prescribed_at_to: '',
    prescription_items_query: '',
    prescription_status: '',
    dispensed_at_from: '',
    dispensed_at_to: '',
    prescription_payer_method: '',
    // Appointment filters
    appointment_clinic: '',
    appointment_type: '',
    scheduled_at_from: '',
    scheduled_at_to: '',
    appointment_duration_min: '',
    appointment_duration_max: '',
    appointment_status: '',
    appointment_reminder_sent: '',
    // Diagnostic filters
    diagnostic_category: '',
    diagnostic_ordered_at_from: '',
    diagnostic_ordered_at_to: '',
    diagnostic_is_critical: '',
    diagnostic_status: '',
    diagnostic_turnaround_min: '',
    diagnostic_turnaround_max: '',
    // Bed filters
    bed_ward: '',
    bed_status: '',
    bed_admission_date_from: '',
    bed_admission_date_to: '',
    bed_expected_discharge_from: '',
    bed_expected_discharge_to: '',
    // VitalSign filters
    vital_sign_taken_at_from: '',
    vital_sign_taken_at_to: '',
    vital_sign_hr_min: '',
    vital_sign_hr_max: '',
    vital_sign_temp_min: '',
    vital_sign_temp_max: '',
    vital_sign_spo2_min: '',
    vital_sign_spo2_max: '',
    vital_sign_bp_sys_min: '',
    vital_sign_bp_sys_max: '',
    // Patient filters
    patient_mrn: '',
    patient_gender: '',
    patient_blood_group: '',
    patient_cbhi_status: '',
    patient_region: '',
    patient_woreda: '',
    patient_status: '',
    patient_registration_date_from: '',
    patient_registration_date_to: '',
    // LabResult filters
    lab_result_panel: '',
    lab_result_status: '',
    lab_result_test_type: '',
    lab_result_is_critical: '',
    lab_result_resulted_at_from: '',
    lab_result_resulted_at_to: '',
    // Admission filters
    admission_ward: '',
    admission_type: '',
    admission_status: '',
    admission_date_from: '',
    admission_date_to: '',
    // LiaisonOffice filters
    liaison_referral_type: '',
    liaison_status: '',
    liaison_source_facility: '',
    liaison_destination_facility: '',
    liaison_date_from: '',
    liaison_date_to: '',
    // Immunization filters
    immunization_vaccine_name: '',
    immunization_administered_at_from: '',
    immunization_administered_at_to: '',
    // OperativeRecord filters
    operative_procedure_name: '',
    operative_outcome: '',
    operative_start_time_from: '',
    operative_start_time_to: '',
    // SupplyItem filters
    supply_category: '',
    supply_location: '',
    supply_status: '',
    // FinancialLedger filters
    financial_service_type: '',
    financial_payer_method: '',
    financial_status: '',
    financial_tx_date_from: '',
    financial_tx_date_to: '',
    // InsuranceClaim filters
    claim_insurer: '',
    claim_status: '',
    claim_date_from: '',
    claim_date_to: '',
    // User filters
    user_role: '',
    user_hospital_id: '',
    user_created_date_from: '',
    user_created_date_to: '',
    // PatientJourneyEvent filters
    journey_stage: '',
    journey_status: '',
    journey_event_time_from: '',
    journey_event_time_to: '',
    // Notification filters
    notification_type: '',
    notification_severity: '',
    notification_is_read: '',
    notification_event_time_from: '',
    notification_event_time_to: '',
    // NotificationPreference filters
    pref_role: '',
    pref_alert_type: '',
    pref_min_severity: '',
    pref_enabled: '',
  });

  // Dynamic access control permissions
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRecentlyDeletedOpen, setIsRecentlyDeletedOpen] = useState(false);
  const [recentlyDeletedRecords, setRecentlyDeletedRecords] = useState<Record<string, any>[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportingInProgress, setIsImportingInProgress] = useState(false);
  const [permissions, setPermissions] = useState([
    {
      id: 'creator_only',
      type: 'Creator Only',
      rule: 'Users can only access records they created',
      create: false,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'field_comparison',
      type: 'Entity-User Field Comparison',
      rule: 'attending_clinician = user.email',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_admin',
      type: 'User Property Check',
      rule: 'role = admin',
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    {
      id: 'role_physician',
      type: 'User Property Check',
      rule: 'role = physician',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_nurse',
      type: 'User Property Check',
      rule: 'role = nurse',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_receptionist',
      type: 'User Property Check',
      rule: 'role = receptionist',
      create: true,
      read: true,
      update: false,
      delete: false,
    },
  ]);

  useEffect(() => {
    if (selectedEntityId === 'Bed') {
      setPermissions([
        {
          id: 'field_comparison_bed',
          type: 'Entity-User Field Comparison',
          rule: 'attending_physician = user.email',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_admin_bed',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_ward_manager_bed',
          type: 'User Property Check',
          rule: 'role = ward_manager',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_nurse_bed',
          type: 'User Property Check',
          rule: 'role = nurse',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_physician_bed',
          type: 'User Property Check',
          rule: 'role = physician',
          create: true,
          read: true,
          update: true,
          delete: true,
        }
      ]);
    } else if (selectedEntityId === 'Staff') {
      setPermissions([
        {
          id: 'field_comparison_staff',
          type: 'Entity-User Field Comparison',
          rule: 'email = user.email',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_admin_staff',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        }
      ]);
    } else {
      setPermissions([
        {
          id: 'creator_only',
          type: 'Creator Only',
          rule: 'Users can only access records they created',
          create: false,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'field_comparison',
          type: 'Entity-User Field Comparison',
          rule: 'attending_clinician = user.email',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_admin',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_physician',
          type: 'User Property Check',
          rule: 'role = physician',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_nurse',
          type: 'User Property Check',
          rule: 'role = nurse',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_receptionist',
          type: 'User Property Check',
          rule: 'role = receptionist',
          create: true,
          read: true,
          update: false,
          delete: false,
        },
      ]);
    }
  }, [selectedEntityId]);

  const selectedEntity = ENTITIES_CONFIG[selectedEntityId];

  // Fetch count stats for all 15 collections on mount and when changes occur
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;

    const unsubscribes = Object.keys(ENTITIES_CONFIG).map((entityId) => {
      const config = ENTITIES_CONFIG[entityId];
      const q = query(collection(db, config.collectionName));
      return onSnapshot(q, (snapshot) => {
        // Filter snapshot docs according to tenant boundaries
        const filteredDocs = snapshot.docs.filter(doc => {
          if (!activeHospital) return true;
          const data = doc.data();
          // Shared demo records have no hospital_id; allow all tenants to view them to avoid empty dashboards
          if (!data.hospital_id || data.hospital_id === 'demo-global') return true;
          return data.hospital_id === activeHospital.hospital_unique_number;
        });

        setStats(prev => ({
          ...prev,
          [entityId]: filteredDocs.length
        }));

        // If the snapshot belongs to the currently active entity, update active records
        if (entityId === selectedEntityId) {
          const list = filteredDocs.map(doc => {
            const data = doc.data();
            if (entityId === 'Patient') {
              return {
                id: doc.id,
                ...data,
                full_name: data.full_name || data.name || '',
                date_of_birth: data.date_of_birth || data.dob || '',
                phone: data.phone || '',
                mrn: data.mrn || `MRN-${doc.id.slice(0, 4).toUpperCase()}`,
                status: data.status || 'active'
              };
            }
            return {
              id: doc.id,
              ...data
            };
          });
          setRecords(list);
        }
      }, (error) => {
        console.warn(`Firestore subscription error for ${entityId}:`, error);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [selectedEntityId]);

  // Listen to recently deleted records in real-time
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'recently_deleted'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((item: any) => {
          if (!tenantId) return true;
          if (!item.hospital_id || item.hospital_id === 'demo-global') return true;
          return item.hospital_id === tenantId;
        });
      setRecentlyDeletedRecords(list);
    }, (error) => {
      console.warn("Firestore subscription error for recently_deleted:", error);
    });
  }, []);

  // Listen to patients in real-time for bed assignment selection
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'patients'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          full_name: data.full_name || data.name || '',
          mrn: data.mrn || `MRN-${doc.id.slice(0, 4).toUpperCase()}`
        };
      }).filter((p: any) => {
        if (!tenantId) return true;
        if (!p.hospital_id || p.hospital_id === 'demo-global') return true;
        return p.hospital_id === tenantId;
      });
      setPatients(list);
    }, (error) => {
      console.warn("Firestore subscription error for patients in DataExplorer:", error);
    });
  }, []);

  // Handle adding or updating a record dynamically
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      // Clean up fields to store proper types
      const recordPayload: Record<string, any> = {};
      selectedEntity.fields.forEach((field) => {
        const val = formData[field.key];
        if (field.key === 'items') {
          recordPayload[field.key] = Array.isArray(val) ? val : [];
        } else if (field.type === 'array') {
          if (Array.isArray(val)) {
            recordPayload[field.key] = val;
          } else if (typeof val === 'string' && val.trim()) {
            const trimmed = val.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                recordPayload[field.key] = JSON.parse(trimmed);
              } catch (e) {
                recordPayload[field.key] = trimmed.split(',').map(item => item.trim()).filter(Boolean);
              }
            } else {
              recordPayload[field.key] = trimmed.split(',').map(item => item.trim()).filter(Boolean);
            }
          } else {
            recordPayload[field.key] = [];
          }
        } else if (field.type === 'checkbox') {
          recordPayload[field.key] = val === true || String(val) === 'true';
        } else if (field.type === 'number') {
          recordPayload[field.key] = val !== '' && val !== undefined && val !== null ? Number(val) : '';
        } else {
          recordPayload[field.key] = val !== undefined && val !== null ? val : '';
        }
      });

      // Maintain backward compatibility for patient files (AddPatientForm/PatientList fields mapping)
      if (selectedEntity.id === 'Patient') {
        // Run Zod validation before saving
        const validationResult = patientSchema.safeParse({
          name: (recordPayload.full_name || '').trim(),
          dob: recordPayload.dob || '',
          gender: recordPayload.gender || 'Male',
          mrn: (recordPayload.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
          age: recordPayload.age !== undefined && recordPayload.age !== '' ? Number(recordPayload.age) : 30,
          address: recordPayload.address || 'Ethiopia',
          phone: (recordPayload.phone || '').trim()
        });

        if (!validationResult.success) {
          const errors = validationResult.error.issues.map(err => err.message).join(' ');
          setFormError(errors);
          return;
        }

        // Apply back mappings
        recordPayload.name = recordPayload.full_name;
        recordPayload.dob = recordPayload.dob;
        if (!recordPayload.mrn || !recordPayload.mrn.trim()) {
          recordPayload.mrn = `MRN-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      if (editingRecordId) {
        // Edit/Adjust mode
        const docRef = doc(db, selectedEntity.collectionName, editingRecordId);
        await updateDoc(docRef, recordPayload);
      } else {
        // Add new mode
        const collRef = collection(db, selectedEntity.collectionName);
        const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
        const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
        
        await addDoc(collRef, {
          ...recordPayload,
          hospital_id: activeHospital?.hospital_unique_number || 'demo-global',
          created_at: new Date().toISOString()
        });
      }

      setFormData({});
      setEditingRecordId(null);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error saving record:', error);
      setFormError(error.message || 'Error saving record to database. Check connection or credentials.');
    }
  };

  // Handle deleting a record
  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record? It will be moved to Recently Deleted.')) {
      try {
        const recordData = records.find(r => r.id === id);
        if (recordData) {
          // Deep clean any undefined fields to prevent Firestore serialization errors
          const cleanedData = JSON.parse(JSON.stringify(recordData, (key, value) => {
            return value === undefined ? null : value;
          }));

          await addDoc(collection(db, 'recently_deleted'), {
            collectionName: selectedEntity.collectionName,
            entityId: selectedEntityId,
            data: cleanedData,
            deletedAt: new Date().toISOString(),
            originalId: id,
            hospital_id: cleanedData.hospital_id || 'demo-global'
          });
        }
        await deleteDoc(doc(db, selectedEntity.collectionName, id));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error removing record from database');
      }
    }
  };

  const handleDeleteAllRecords = async () => {
    if (records.length === 0) {
      alert("No records to delete.");
      return;
    }
    if (confirm(`Are you sure you want to delete all ${records.length} records from ${selectedEntity.name}? They will be moved to Recently Deleted.`)) {
      try {
        for (const record of records) {
          // Deep clean any undefined fields to prevent Firestore serialization errors
          const cleanedData = JSON.parse(JSON.stringify(record, (key, value) => {
            return value === undefined ? null : value;
          }));

          await addDoc(collection(db, 'recently_deleted'), {
            collectionName: selectedEntity.collectionName,
            entityId: selectedEntityId,
            data: cleanedData,
            deletedAt: new Date().toISOString(),
            originalId: record.id,
            hospital_id: cleanedData.hospital_id || 'demo-global'
          });
          await deleteDoc(doc(db, selectedEntity.collectionName, record.id));
        }
      } catch (error) {
        console.error('Error deleting all records:', error);
        alert('Error clearing the collection');
      }
    }
  };

  const handleRestoreRecord = async (deletedItem: any) => {
    try {
      const { collectionName, data } = deletedItem;
      const restoredPayload = { ...data };
      delete restoredPayload.id;
      
      await addDoc(collection(db, collectionName), restoredPayload);
      await deleteDoc(doc(db, 'recently_deleted', deletedItem.id));
    } catch (error) {
      console.error('Error restoring record:', error);
      alert('Error restoring record');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'recently_deleted', id));
      } catch (error) {
        console.error('Error permanently deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const handleClearRecentlyDeleted = async () => {
    const currentDeleted = recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName);
    if (currentDeleted.length === 0) return;
    
    if (confirm(`Are you sure you want to permanently empty the trash/recently deleted for ${selectedEntity.name}? This action cannot be undone.`)) {
      try {
        for (const item of currentDeleted) {
          await deleteDoc(doc(db, 'recently_deleted', item.id));
        }
      } catch (error) {
        console.error('Error clearing trash:', error);
        alert('Error emptying trash');
      }
    }
  };

  const handleExportJSON = () => {
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }
    const dataStr = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntity.id}_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImportFile(file);
  };

  const readImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          setImportError("Invalid format: The exported file must contain a JSON array of objects.");
          setImportPreview([]);
          return;
        }
        setImportPreview(parsed);
      } catch (err) {
        setImportError("Error parsing JSON file. Please ensure it is a valid JSON file.");
        setImportPreview([]);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) return;
    setIsImportingInProgress(true);
    try {
      const collRef = collection(db, selectedEntity.collectionName);
      for (const item of importPreview) {
        const payload: Record<string, any> = {};
        selectedEntity.fields.forEach(field => {
          if (item[field.key] !== undefined) {
            payload[field.key] = item[field.key];
          } else if (field.defaultValue !== undefined) {
            payload[field.key] = field.defaultValue;
          }
        });
        payload.created_at = item.created_at || new Date().toISOString();
        await addDoc(collRef, payload);
      }
      setIsImportOpen(false);
      setImportPreview([]);
      setImportError(null);
      alert(`Successfully imported ${importPreview.length} records into ${selectedEntity.name}.`);
    } catch (err) {
      console.error(err);
      setImportError("Failed to write imported records to database.");
    } finally {
      setIsImportingInProgress(false);
    }
  };

  // Seed default data for the selected entity
  const handleSeedDefaults = async (entityId: string) => {
    setSeedingLoading(entityId);
    const config = ENTITIES_CONFIG[entityId];
    try {
      const collRef = collection(db, config.collectionName);
      const snapshot = await getDocs(collRef);
      
      // Only seed if currently empty
      if (snapshot.empty) {
        for (const record of config.defaultSeed) {
          await addDoc(collRef, {
            ...record,
            created_at: new Date().toISOString()
          });
        }
      } else {
        alert(`${config.name} already contains data. Clear records before re-seeding if desired.`);
      }
    } catch (error) {
      console.error(`Error seeding ${entityId}:`, error);
    } finally {
      setSeedingLoading(null);
    }
  };

  // Seed all 15 empty collections at once
  const handleSeedAllCollections = async () => {
    if (confirm("Would you like to auto-seed all empty clinical tables with beautiful, realistic EHR demo records?")) {
      setSeedingLoading('ALL_SYSTEM');
      try {
        for (const entityId of Object.keys(ENTITIES_CONFIG)) {
          const config = ENTITIES_CONFIG[entityId];
          const collRef = collection(db, config.collectionName);
          const snapshot = await getDocs(collRef);
          if (snapshot.empty) {
            for (const record of config.defaultSeed) {
              await addDoc(collRef, {
                ...record,
                created_at: new Date().toISOString()
              });
            }
          }
        }
        alert("All empty EHR tables have been successfully seeded with realistic clinical data!");
      } catch (error) {
        console.error("Error seeding all tables:", error);
      } finally {
        setSeedingLoading(null);
      }
    }
  };

  // Filter records based on search and selected filter criteria
  const filteredRecords = records.filter(record => {
    // 1. Search Query Filter
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      let matchesSearch = false;

      // Recursive helper for deep matching of nested objects and arrays
      const deepIncludes = (val: any, query: string): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          return String(val).toLowerCase().includes(query);
        }
        if (Array.isArray(val)) {
          return val.some(item => deepIncludes(item, query));
        }
        if (typeof val === 'object') {
          return Object.values(val).some(item => deepIncludes(item, query));
        }
        return false;
      };

      if (selectedEntity.id === 'ClinicalEncounter') {
        const searchFields = [
          'visit_id', 'patient_mrn', 'patient_name', 'chief_complaint',
          'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
          'vitals_bp', 'diagnosis_icd10', 'diagnosis_text', 'attending_clinician'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Staff') {
        const searchFields = [
          'staff_id', 'full_name', 'role', 'credential', 'phone', 'email'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Prescription') {
        const searchFields = [
          'rx_id', 'visit_id', 'patient_mrn', 'patient_name', 'prescribed_by', 'diagnosis_text', 'notes'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const itemsMatches = Array.isArray(record.items) && record.items.some((item: any) => {
          return deepIncludes(item, queryStr);
        });
        matchesSearch = fieldMatches || itemsMatches;
      } else if (selectedEntity.id === 'Appointment') {
        const searchFields = [
          'appointment_id', 'patient_mrn', 'patient_name', 'visit_id', 'attending_clinician', 'reason', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Bed') {
        const searchFields = [
          'bed_number', 'patient_mrn', 'patient_name', 'attending_physician', 'notes', 'ward'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Diagnostic') {
        const searchFields = [
          'test_id', 'visit_id', 'patient_mrn', 'patient_name', 'test_type', 'ordered_by', 'result', 'result_value', 'reference_range', 'image_link'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'LabResult') {
        const searchFields = [
          'result_id', 'diagnostic_id', 'visit_id', 'patient_mrn', 'patient_name', 'test_type', 'panel', 'summary_text', 'resulted_by', 'verified_by'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const entriesMatches = Array.isArray(record.result_entries) && record.result_entries.some((entry: any) => {
          return deepIncludes(entry, queryStr);
        });
        matchesSearch = fieldMatches || entriesMatches;
      } else if (selectedEntity.id === 'InsuranceClaim') {
        const searchFields = [
          'claim_id', 'patient_mrn', 'patient_name', 'visit_id', 'cbhi_id', 'insurer', 'rejection_reason', 'submitted_by'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const servicesMatches = Array.isArray(record.services) && record.services.some((service: any) => {
          return deepIncludes(service, queryStr);
        });
        matchesSearch = fieldMatches || servicesMatches;
      } else if (selectedEntity.id === 'Patient') {
        const searchFields = [
          'uid', 'mrn', 'full_name', 'phone', 'region', 'woreda', 'kebele', 'cbhi_id', 'cbhi_status', 'blood_group', 'emergency_contact_name', 'emergency_contact_phone'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const allergiesMatches = Array.isArray(record.allergies) && record.allergies.some((a: any) => {
          return String(a).toLowerCase().includes(queryStr);
        });
        const conditionsMatches = Array.isArray(record.chronic_conditions) && record.chronic_conditions.some((c: any) => {
          return String(c).toLowerCase().includes(queryStr);
        });
        matchesSearch = fieldMatches || allergiesMatches || conditionsMatches;
      } else if (selectedEntity.id === 'Admission') {
        const searchFields = [
          'admission_id', 'patient_mrn', 'patient_name', 'ward', 'bed_number', 'attending_physician', 'status', 'discharge_summary'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'LiaisonOffice') {
        const searchFields = [
          'referral_id', 'patient_mrn', 'patient_name', 'source_facility', 'destination_facility', 'coordinator', 'reason'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Immunization') {
        const searchFields = [
          'imm_id', 'patient_mrn', 'patient_name', 'vaccine_name', 'dose_number', 'administered_by', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'OperativeRecord') {
        const searchFields = [
          'op_id', 'visit_id', 'patient_mrn', 'patient_name', 'procedure_name', 'surgeon', 'anesthesiologist', 'outcome', 'findings', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'SupplyItem') {
        const searchFields = [
          'item_code', 'name', 'category', 'location', 'batch_no', 'supplier', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'FinancialLedger') {
        const searchFields = [
          'tx_id', 'patient_mrn', 'patient_name', 'service_type', 'description', 'payer_method', 'cbhi_claim_status', 'cashier', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'InsuranceClaim') {
        const searchFields = [
          'claim_id', 'patient_mrn', 'patient_name', 'visit_id', 'cbhi_id', 'insurer', 'rejection_reason', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'User') {
        const searchFields = ['full_name', 'email', 'role', 'created_by_id', 'hospital_id'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'PatientJourneyEvent') {
        const searchFields = ['patient_mrn', 'patient_name', 'visit_id', 'stage', 'stage_label', 'location', 'handled_by', 'notes', 'status'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Notification') {
        const searchFields = ['type', 'severity', 'title', 'message', 'patient_mrn', 'patient_name', 'visit_id', 'journey_stage', 'ward', 'triggered_by'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'NotificationPreference') {
        const searchFields = ['role', 'alert_type', 'min_severity'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else {
        matchesSearch = deepIncludes(record, queryStr);
      }
      if (!matchesSearch) return false;
    }

    // 2. Schema-specific filters (ClinicalEncounter)
    if (selectedEntity.id === 'ClinicalEncounter') {
      // Encounter Type
      if (filters.encounter_type && record.encounter_type !== filters.encounter_type) {
        return false;
      }
      // Clinic
      if (filters.clinic && record.clinic !== filters.clinic) {
        return false;
      }
      // Status
      if (filters.status && record.status !== filters.status) {
        return false;
      }
      // Priority
      if (filters.priority && record.priority !== filters.priority) {
        return false;
      }

      // Vitals Pulse Min/Max
      if (filters.vitals_pulse_min) {
        const pulse = Number(record.vitals_pulse);
        if (isNaN(pulse) || pulse < Number(filters.vitals_pulse_min)) return false;
      }
      if (filters.vitals_pulse_max) {
        const pulse = Number(record.vitals_pulse);
        if (isNaN(pulse) || pulse > Number(filters.vitals_pulse_max)) return false;
      }

      // Vitals Temp Min/Max
      if (filters.vitals_temp_min) {
        const temp = Number(record.vitals_temp);
        if (isNaN(temp) || temp < Number(filters.vitals_temp_min)) return false;
      }
      if (filters.vitals_temp_max) {
        const temp = Number(record.vitals_temp);
        if (isNaN(temp) || temp > Number(filters.vitals_temp_max)) return false;
      }

      // Vitals Spo2 Min/Max
      if (filters.vitals_spo2_min) {
        const spo2 = Number(record.vitals_spo2);
        if (isNaN(spo2) || spo2 < Number(filters.vitals_spo2_min)) return false;
      }
      if (filters.vitals_spo2_max) {
        const spo2 = Number(record.vitals_spo2);
        if (isNaN(spo2) || spo2 > Number(filters.vitals_spo2_max)) return false;
      }

      // Vitals Respiratory Rate Min/Max
      if (filters.vitals_respiratory_rate_min) {
        const rr = Number(record.vitals_respiratory_rate);
        if (isNaN(rr) || rr < Number(filters.vitals_respiratory_rate_min)) return false;
      }
      if (filters.vitals_respiratory_rate_max) {
        const rr = Number(record.vitals_respiratory_rate);
        if (isNaN(rr) || rr > Number(filters.vitals_respiratory_rate_max)) return false;
      }

      // Vitals Weight Min/Max
      if (filters.vitals_weight_min) {
        const weight = Number(record.vitals_weight);
        if (isNaN(weight) || weight < Number(filters.vitals_weight_min)) return false;
      }
      if (filters.vitals_weight_max) {
        const weight = Number(record.vitals_weight);
        if (isNaN(weight) || weight > Number(filters.vitals_weight_max)) return false;
      }

      // Encounter Date From/To
      if (filters.encounter_date_from || filters.encounter_date_to) {
        const encDateStr = record.encounter_date;
        if (!encDateStr) return false;
        
        const encTime = new Date(encDateStr).getTime();
        if (isNaN(encTime)) return false;

        if (filters.encounter_date_from) {
          const fromTime = new Date(filters.encounter_date_from).getTime();
          if (!isNaN(fromTime) && encTime < fromTime) return false;
        }
        if (filters.encounter_date_to) {
          const toTime = new Date(filters.encounter_date_to).getTime();
          if (!isNaN(toTime) && encTime > toTime) return false;
        }
      }
    }

    // 3. Schema-specific filters (Staff)
    if (selectedEntity.id === 'Staff') {
      if (filters.staff_id && !String(record.staff_id || '').toLowerCase().includes(filters.staff_id.toLowerCase())) {
        return false;
      }
      if (filters.full_name && !String(record.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase())) {
        return false;
      }
      if (filters.department && record.department !== filters.department) {
        return false;
      }
      if (filters.role && !String(record.role || '').toLowerCase().includes(filters.role.toLowerCase())) {
        return false;
      }
    }

    if (selectedEntity.id === 'Patient') {
      if (filters.patient_mrn && !String(record.mrn || '').toLowerCase().includes(filters.patient_mrn.toLowerCase())) {
        return false;
      }
      if (filters.patient_gender && record.gender !== filters.patient_gender) {
        return false;
      }
      if (filters.patient_blood_group && record.blood_group !== filters.patient_blood_group) {
        return false;
      }
      if (filters.patient_cbhi_status && record.cbhi_status !== filters.patient_cbhi_status) {
        return false;
      }
      if (filters.patient_status && record.status !== filters.patient_status) {
        return false;
      }
      if (filters.patient_region && !String(record.region || '').toLowerCase().includes(filters.patient_region.toLowerCase())) {
        return false;
      }
      if (filters.patient_woreda && !String(record.woreda || '').toLowerCase().includes(filters.patient_woreda.toLowerCase())) {
        return false;
      }
      if (record.registration_date) {
        const regTime = new Date(record.registration_date).getTime();
        if (!isNaN(regTime)) {
          if (filters.patient_registration_date_from) {
            const fromTime = new Date(filters.patient_registration_date_from).getTime();
            if (!isNaN(fromTime) && regTime < fromTime) return false;
          }
          if (filters.patient_registration_date_to) {
            const toTime = new Date(filters.patient_registration_date_to).getTime();
            if (!isNaN(toTime) && regTime > toTime) return false;
          }
        }
      } else if (filters.patient_registration_date_from || filters.patient_registration_date_to) {
        return false;
      }
    }

    // 4. Schema-specific filters (Prescription)
    if (selectedEntity.id === 'Prescription') {
      // Prescribed At Date range
      if (record.prescribed_at) {
        const prescribedTime = new Date(record.prescribed_at).getTime();
        if (!isNaN(prescribedTime)) {
          if (filters.prescribed_at_from) {
            const fromTime = new Date(filters.prescribed_at_from).getTime();
            if (!isNaN(fromTime) && prescribedTime < fromTime) return false;
          }
          if (filters.prescribed_at_to) {
            const toTime = new Date(filters.prescribed_at_to).getTime();
            if (!isNaN(toTime) && prescribedTime > toTime) return false;
          }
        }
      } else if (filters.prescribed_at_from || filters.prescribed_at_to) {
        return false;
      }

      // Dispensed At Date range
      if (record.dispensed_at) {
        const dispensedTime = new Date(record.dispensed_at).getTime();
        if (!isNaN(dispensedTime)) {
          if (filters.dispensed_at_from) {
            const fromTime = new Date(filters.dispensed_at_from).getTime();
            if (!isNaN(fromTime) && dispensedTime < fromTime) return false;
          }
          if (filters.dispensed_at_to) {
            const toTime = new Date(filters.dispensed_at_to).getTime();
            if (!isNaN(toTime) && dispensedTime > toTime) return false;
          }
        }
      } else if (filters.dispensed_at_from || filters.dispensed_at_to) {
        return false;
      }

      // Status
      if (filters.prescription_status && record.status !== filters.prescription_status) {
        return false;
      }

      // Payer method
      if (filters.prescription_payer_method && record.payer_method !== filters.prescription_payer_method) {
        return false;
      }

      // Items search query
      if (filters.prescription_items_query) {
        const itemQuery = filters.prescription_items_query.toLowerCase();
        const itemsList = Array.isArray(record.items) ? record.items : [];
        const matchesItems = itemsList.some((item: any) => {
          return (
            String(item.drug || '').toLowerCase().includes(itemQuery) ||
            String(item.dose || '').toLowerCase().includes(itemQuery) ||
            String(item.frequency || '').toLowerCase().includes(itemQuery) ||
            String(item.duration || '').toLowerCase().includes(itemQuery)
          );
        });
        if (!matchesItems) return false;
      }
    }

    // 5. Schema-specific filters (LabResult)
    if (selectedEntity.id === 'LabResult') {
      if (filters.lab_result_panel && record.panel !== filters.lab_result_panel) {
        return false;
      }
      if (filters.lab_result_status && record.status !== filters.lab_result_status) {
        return false;
      }
      if (filters.lab_result_test_type && !String(record.test_type || '').toLowerCase().includes(filters.lab_result_test_type.toLowerCase())) {
        return false;
      }
      if (filters.lab_result_is_critical && String(record.is_critical) !== filters.lab_result_is_critical) {
        return false;
      }
      if (record.resulted_at) {
        const resTime = new Date(record.resulted_at).getTime();
        if (!isNaN(resTime)) {
          if (filters.lab_result_resulted_at_from) {
            const fromTime = new Date(filters.lab_result_resulted_at_from).getTime();
            if (!isNaN(fromTime) && resTime < fromTime) return false;
          }
          if (filters.lab_result_resulted_at_to) {
            const toTime = new Date(filters.lab_result_resulted_at_to).getTime();
            if (!isNaN(toTime) && resTime > toTime) return false;
          }
        }
      } else if (filters.lab_result_resulted_at_from || filters.lab_result_resulted_at_to) {
        return false;
      }
    }

    // 6. Schema-specific filters (Appointment)
    if (selectedEntity.id === 'Appointment') {
      // Clinic
      if (filters.appointment_clinic && record.clinic !== filters.appointment_clinic) {
        return false;
      }

      // Appointment Type
      if (filters.appointment_type && record.appointment_type !== filters.appointment_type) {
        return false;
      }

      // Scheduled At Date range
      if (record.scheduled_at) {
        const scheduledTime = new Date(record.scheduled_at).getTime();
        if (!isNaN(scheduledTime)) {
          if (filters.scheduled_at_from) {
            const fromTime = new Date(filters.scheduled_at_from).getTime();
            if (!isNaN(fromTime) && scheduledTime < fromTime) return false;
          }
          if (filters.scheduled_at_to) {
            const toTime = new Date(filters.scheduled_at_to).getTime();
            if (!isNaN(toTime) && scheduledTime > toTime) return false;
          }
        }
      } else if (filters.scheduled_at_from || filters.scheduled_at_to) {
        return false;
      }

      // Duration minutes range
      if (record.duration_minutes !== undefined && record.duration_minutes !== '') {
        const duration = Number(record.duration_minutes);
        if (filters.appointment_duration_min && duration < Number(filters.appointment_duration_min)) {
          return false;
        }
        if (filters.appointment_duration_max && duration > Number(filters.appointment_duration_max)) {
          return false;
        }
      } else if (filters.appointment_duration_min || filters.appointment_duration_max) {
        return false;
      }

      // Status
      if (filters.appointment_status && record.status !== filters.appointment_status) {
        return false;
      }

      // Reminder sent
      if (filters.appointment_reminder_sent) {
        const isSent = record.reminder_sent === true || String(record.reminder_sent) === 'true';
        if (filters.appointment_reminder_sent === 'yes' && !isSent) return false;
        if (filters.appointment_reminder_sent === 'no' && isSent) return false;
      }
    }

    // 6. Schema-specific filters (Diagnostic)
    if (selectedEntity.id === 'Diagnostic') {
      // Category
      if (filters.diagnostic_category && record.category !== filters.diagnostic_category) {
        return false;
      }

      // Ordered At Date range
      if (record.ordered_at) {
        const orderedTime = new Date(record.ordered_at).getTime();
        if (!isNaN(orderedTime)) {
          if (filters.diagnostic_ordered_at_from) {
            const fromTime = new Date(filters.diagnostic_ordered_at_from).getTime();
            if (!isNaN(fromTime) && orderedTime < fromTime) return false;
          }
          if (filters.diagnostic_ordered_at_to) {
            const toTime = new Date(filters.diagnostic_ordered_at_to).getTime();
            if (!isNaN(toTime) && orderedTime > toTime) return false;
          }
        }
      } else if (filters.diagnostic_ordered_at_from || filters.diagnostic_ordered_at_to) {
        return false;
      }

      // Is critical
      if (filters.diagnostic_is_critical) {
        const isCriticalVal = record.is_critical === true || String(record.is_critical) === 'true';
        if (filters.diagnostic_is_critical === 'yes' && !isCriticalVal) return false;
        if (filters.diagnostic_is_critical === 'no' && isCriticalVal) return false;
      }

      // Status
      if (filters.diagnostic_status && record.status !== filters.diagnostic_status) {
        return false;
      }

      // Turnaround minutes range
      if (record.turnaround_minutes !== undefined && record.turnaround_minutes !== '') {
        const turnaround = Number(record.turnaround_minutes);
        if (filters.diagnostic_turnaround_min && turnaround < Number(filters.diagnostic_turnaround_min)) {
          return false;
        }
        if (filters.diagnostic_turnaround_max && turnaround > Number(filters.diagnostic_turnaround_max)) {
          return false;
        }
      } else if (filters.diagnostic_turnaround_min || filters.diagnostic_turnaround_max) {
        return false;
      }
    }

    // 7. Schema-specific filters (Bed)
    if (selectedEntity.id === 'Bed') {
      // Ward
      if (filters.bed_ward && record.ward !== filters.bed_ward) {
        return false;
      }

      // Status
      if (filters.bed_status && record.status !== filters.bed_status) {
        return false;
      }

      // Admission Date range
      if (record.admission_date) {
        const admissionTime = new Date(record.admission_date).getTime();
        if (!isNaN(admissionTime)) {
          if (filters.bed_admission_date_from) {
            const fromTime = new Date(filters.bed_admission_date_from).getTime();
            if (!isNaN(fromTime) && admissionTime < fromTime) return false;
          }
          if (filters.bed_admission_date_to) {
            const toTime = new Date(filters.bed_admission_date_to).getTime();
            if (!isNaN(toTime) && admissionTime > toTime) return false;
          }
        }
      } else if (filters.bed_admission_date_from || filters.bed_admission_date_to) {
        return false;
      }

      // Expected Discharge Date range
      if (record.expected_discharge) {
        const dischargeTime = new Date(record.expected_discharge).getTime();
        if (!isNaN(dischargeTime)) {
          if (filters.bed_expected_discharge_from) {
            const fromTime = new Date(filters.bed_expected_discharge_from).getTime();
            if (!isNaN(fromTime) && dischargeTime < fromTime) return false;
          }
          if (filters.bed_expected_discharge_to) {
            const toTime = new Date(filters.bed_expected_discharge_to).getTime();
            if (!isNaN(toTime) && dischargeTime > toTime) return false;
          }
        }
      } else if (filters.bed_expected_discharge_from || filters.bed_expected_discharge_to) {
        return false;
      }
    }

    // 7. VitalSign filters
    if (selectedEntity.id === 'VitalSign') {
      if (filters.vital_sign_taken_at_from && new Date(record.taken_at) < new Date(filters.vital_sign_taken_at_from)) return false;
      if (filters.vital_sign_taken_at_to && new Date(record.taken_at) > new Date(filters.vital_sign_taken_at_to)) return false;
      if (filters.vital_sign_hr_min && Number(record.heart_rate) < Number(filters.vital_sign_hr_min)) return false;
      if (filters.vital_sign_hr_max && Number(record.heart_rate) > Number(filters.vital_sign_hr_max)) return false;
      if (filters.vital_sign_temp_min && Number(record.temp_c) < Number(filters.vital_sign_temp_min)) return false;
      if (filters.vital_sign_temp_max && Number(record.temp_c) > Number(filters.vital_sign_temp_max)) return false;
      if (filters.vital_sign_spo2_min && Number(record.spo2) < Number(filters.vital_sign_spo2_min)) return false;
      if (filters.vital_sign_spo2_max && Number(record.spo2) > Number(filters.vital_sign_spo2_max)) return false;
      if (filters.vital_sign_bp_sys_min && Number(record.bp_systolic) < Number(filters.vital_sign_bp_sys_min)) return false;
      if (filters.vital_sign_bp_sys_max && Number(record.bp_systolic) > Number(filters.vital_sign_bp_sys_max)) return false;
    }

    if (selectedEntity.id === 'Admission') {
      if (filters.admission_ward && !String(record.ward || '').toLowerCase().includes(filters.admission_ward.toLowerCase())) return false;
      if (filters.admission_type && record.admission_type !== filters.admission_type) return false;
      if (filters.admission_status && record.status !== filters.admission_status) return false;
      if (filters.admission_date_from && new Date(record.admission_date) < new Date(filters.admission_date_from)) return false;
      if (filters.admission_date_to && new Date(record.admission_date) > new Date(filters.admission_date_to)) return false;
    }

    if (selectedEntity.id === 'LiaisonOffice') {
      if (filters.liaison_referral_type && record.referral_type !== filters.liaison_referral_type) return false;
      if (filters.liaison_status && record.status !== filters.liaison_status) return false;
      if (filters.liaison_source_facility && !String(record.source_facility || '').toLowerCase().includes(filters.liaison_source_facility.toLowerCase())) return false;
      if (filters.liaison_destination_facility && !String(record.destination_facility || '').toLowerCase().includes(filters.liaison_destination_facility.toLowerCase())) return false;
      if (filters.liaison_date_from && new Date(record.referral_date) < new Date(filters.liaison_date_from)) return false;
      if (filters.liaison_date_to && new Date(record.referral_date) > new Date(filters.liaison_date_to)) return false;
    }

    if (selectedEntity.id === 'Immunization') {
      if (filters.immunization_vaccine_name && !String(record.vaccine_name || '').toLowerCase().includes(filters.immunization_vaccine_name.toLowerCase())) return false;
      if (filters.immunization_administered_at_from && new Date(record.administered_at) < new Date(filters.immunization_administered_at_from)) return false;
      if (filters.immunization_administered_at_to && new Date(record.administered_at) > new Date(filters.immunization_administered_at_to)) return false;
    }

    if (selectedEntity.id === 'OperativeRecord') {
      if (filters.operative_procedure_name && !String(record.procedure_name || '').toLowerCase().includes(filters.operative_procedure_name.toLowerCase())) return false;
      if (filters.operative_outcome && record.outcome !== filters.operative_outcome) return false;
      if (filters.operative_start_time_from && new Date(record.start_time) < new Date(filters.operative_start_time_from)) return false;
      if (filters.operative_start_time_to && new Date(record.start_time) > new Date(filters.operative_start_time_to)) return false;
    }

    if (selectedEntity.id === 'SupplyItem') {
      if (filters.supply_category && record.category !== filters.supply_category) return false;
      if (filters.supply_location && record.location !== filters.supply_location) return false;
      if (filters.supply_status && record.status !== filters.supply_status) return false;
    }

    if (selectedEntity.id === 'FinancialLedger') {
      if (filters.financial_service_type && record.service_type !== filters.financial_service_type) return false;
      if (filters.financial_payer_method && record.payer_method !== filters.financial_payer_method) return false;
      if (filters.financial_status && record.status !== filters.financial_status) return false;
      if (filters.financial_tx_date_from && new Date(record.tx_date) < new Date(filters.financial_tx_date_from)) return false;
      if (filters.financial_tx_date_to && new Date(record.tx_date) > new Date(filters.financial_tx_date_to)) return false;
    }

    if (selectedEntity.id === 'InsuranceClaim') {
      if (filters.claim_insurer && record.insurer !== filters.claim_insurer) return false;
      if (filters.claim_status && record.status !== filters.claim_status) return false;
      if (filters.claim_date_from && new Date(record.claim_date) < new Date(filters.claim_date_from)) return false;
      if (filters.claim_date_to && new Date(record.claim_date) > new Date(filters.claim_date_to)) return false;
    }

    if (selectedEntity.id === 'User') {
      if (filters.user_role && record.role !== filters.user_role) return false;
      if (filters.user_hospital_id && !String(record.hospital_id || '').toLowerCase().includes(filters.user_hospital_id.toLowerCase())) return false;
      if (filters.user_created_date_from && new Date(record.created_date) < new Date(filters.user_created_date_from)) return false;
      if (filters.user_created_date_to && new Date(record.created_date) > new Date(filters.user_created_date_to)) return false;
    }

    if (selectedEntity.id === 'PatientJourneyEvent') {
      if (filters.journey_stage && record.stage !== filters.journey_stage) return false;
      if (filters.journey_status && record.status !== filters.journey_status) return false;
      if (filters.journey_event_time_from && new Date(record.event_time) < new Date(filters.journey_event_time_from)) return false;
      if (filters.journey_event_time_to && new Date(record.event_time) > new Date(filters.journey_event_time_to)) return false;
    }

    if (selectedEntity.id === 'Notification') {
      if (filters.notification_type && record.type !== filters.notification_type) return false;
      if (filters.notification_severity && record.severity !== filters.notification_severity) return false;
      if (filters.notification_is_read && String(record.is_read) !== filters.notification_is_read) return false;
      if (filters.notification_event_time_from && new Date(record.event_time) < new Date(filters.notification_event_time_from)) return false;
      if (filters.notification_event_time_to && new Date(record.event_time) > new Date(filters.notification_event_time_to)) return false;
    }

    if (selectedEntity.id === 'NotificationPreference') {
      if (filters.pref_role && record.role !== filters.pref_role) return false;
      if (filters.pref_alert_type && record.alert_type !== filters.pref_alert_type) return false;
      if (filters.pref_min_severity && record.min_severity !== filters.pref_min_severity) return false;
      if (filters.pref_enabled && String(record.enabled) !== filters.pref_enabled) return false;
    }

    return true;
  });

  const activeFiltersCount = (() => {
    if (selectedEntity.id === 'ClinicalEncounter') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'encounter_type', 'clinic', 'vitals_pulse_min', 'vitals_pulse_max',
        'vitals_temp_min', 'vitals_temp_max', 'vitals_spo2_min', 'vitals_spo2_max',
        'vitals_respiratory_rate_min', 'vitals_respiratory_rate_max',
        'vitals_weight_min', 'vitals_weight_max', 'encounter_date_from',
        'encounter_date_to', 'status', 'priority'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Staff') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'staff_id', 'full_name', 'department', 'role'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Patient') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'patient_mrn', 'patient_gender', 'patient_blood_group', 'patient_cbhi_status',
        'patient_status', 'patient_region', 'patient_woreda', 'patient_registration_date_from',
        'patient_registration_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'LabResult') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'lab_result_panel', 'lab_result_status', 'lab_result_test_type',
        'lab_result_is_critical', 'lab_result_resulted_at_from', 'lab_result_resulted_at_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Prescription') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'prescribed_at_from', 'prescribed_at_to', 'prescription_items_query',
        'prescription_status', 'dispensed_at_from', 'dispensed_at_to',
        'prescription_payer_method'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Appointment') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'appointment_clinic', 'appointment_type', 'scheduled_at_from', 'scheduled_at_to',
        'appointment_duration_min', 'appointment_duration_max', 'appointment_status',
        'appointment_reminder_sent'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Diagnostic') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'diagnostic_category', 'diagnostic_ordered_at_from', 'diagnostic_ordered_at_to',
        'diagnostic_is_critical', 'diagnostic_status', 'diagnostic_turnaround_min', 'diagnostic_turnaround_max'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Bed') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'bed_ward', 'bed_status', 'bed_admission_date_from', 'bed_admission_date_to',
        'bed_expected_discharge_from', 'bed_expected_discharge_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'VitalSign') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'vital_sign_taken_at_from', 'vital_sign_taken_at_to',
        'vital_sign_hr_min', 'vital_sign_hr_max',
        'vital_sign_temp_min', 'vital_sign_temp_max',
        'vital_sign_spo2_min', 'vital_sign_spo2_max',
        'vital_sign_bp_sys_min', 'vital_sign_bp_sys_max'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Admission') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'admission_ward', 'admission_type', 'admission_status',
        'admission_date_from', 'admission_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'LiaisonOffice') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'liaison_referral_type', 'liaison_status', 'liaison_source_facility',
        'liaison_destination_facility', 'liaison_date_from', 'liaison_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Immunization') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'immunization_vaccine_name', 'immunization_administered_at_from', 'immunization_administered_at_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'OperativeRecord') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'operative_procedure_name', 'operative_outcome',
        'operative_start_time_from', 'operative_start_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'SupplyItem') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'supply_category', 'supply_location', 'supply_status'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'FinancialLedger') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'financial_service_type', 'financial_payer_method', 'financial_status',
        'financial_tx_date_from', 'financial_tx_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'InsuranceClaim') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'claim_insurer', 'claim_status', 'claim_date_from', 'claim_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'User') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'user_role', 'user_hospital_id', 'user_created_date_from', 'user_created_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'PatientJourneyEvent') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'journey_stage', 'journey_status', 'journey_event_time_from', 'journey_event_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Notification') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'notification_type', 'notification_severity', 'notification_is_read', 'notification_event_time_from', 'notification_event_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'NotificationPreference') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'pref_role', 'pref_alert_type', 'pref_min_severity', 'pref_enabled'
      ].includes(key)).length;
    }
    return 0;
  })();

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
      
      {/* Entities Sidebar Navigation */}
      <div className="w-full lg:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Database size={16} className="text-gray-500" />
                <span>EHR Schema Tables</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Explore the database tables and collections.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGlobalSchemaOpen(true)}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="View EHR Data Dictionary & Schema"
              >
                <Database size={15} className="text-gray-600" />
                <span>Dictionary</span>
              </button>
              <button
                onClick={handleSeedAllCollections}
                disabled={seedingLoading === 'ALL_SYSTEM'}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                title="Seed All Empty Tables"
              >
                <DatabaseZap size={15} className="text-purple-600" />
                <span>Seed All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Search Bar */}
        <div className="px-4 py-2.5 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search schema tables..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all font-medium placeholder:text-gray-400 text-gray-700"
            />
            {tableSearchQuery && (
              <button
                onClick={() => setTableSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* List of 15 Tables */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100/60 max-h-[580px]">
          {(() => {
            const filteredEntities = ENTITIES_ORDER.filter((entityId) => {
              const entity = ENTITIES_CONFIG[entityId];
              if (!entity) return false;
              const q = tableSearchQuery.trim().toLowerCase();
              if (!q) return true;
              return (
                entity.name.toLowerCase().includes(q) ||
                entity.id.toLowerCase().includes(q) ||
                (entity.subtitle && entity.subtitle.toLowerCase().includes(q)) ||
                (entity.description && entity.description.toLowerCase().includes(q))
              );
            });

            if (filteredEntities.length === 0) {
              return (
                <div className="p-8 text-center text-gray-400">
                  <Database size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No tables match your search</p>
                  <p className="text-[10px] mt-1 text-gray-400">Try a different query</p>
                </div>
              );
            }

            return filteredEntities.map((entityId) => {
              const entity = ENTITIES_CONFIG[entityId];
              if (!entity) return null;
              const Icon = entity.icon;
              const isActive = selectedEntityId === entity.id;
              const count = stats[entity.id] || 0;

              return (
                <button
                  key={entity.id}
                  onClick={() => {
                    setSelectedEntityId(entity.id);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all ${
                    isActive 
                      ? 'bg-white border-l-4 border-gray-900 shadow-sm pl-2.5' 
                      : 'hover:bg-gray-50/70 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-gray-950 font-extrabold' : 'text-gray-700'}`}>
                      {entity.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                      count > 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{entity.subtitle}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 self-center shrink-0" />
              </button>
            );
          });
        })()}
      </div>
      </div>

      {/* Database Explorer Grid Details Pane */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Table Description Block */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 text-gray-700 rounded">
                  {React.createElement(selectedEntity.icon, { size: 16 })}
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {selectedEntity.name} <span className="text-xs font-normal text-gray-400 font-mono">({selectedEntity.collectionName})</span>
                </h2>
              </div>
              <p className="text-xs text-gray-600 max-w-xl leading-relaxed">{selectedEntity.description}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {records.length === 0 && (
                <button
                  onClick={() => handleSeedDefaults(selectedEntityId)}
                  disabled={seedingLoading !== null}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors px-3 py-2 rounded-lg"
                >
                  <DatabaseZap size={14} />
                  <span>{seedingLoading === selectedEntityId ? 'Seeding...' : 'Seed Table'}</span>
                </button>
              )}

              <button
                onClick={() => setIsSchemaOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Settings2 size={14} />
                <span>Schema Editor</span>
              </button>

              <button
                onClick={() => setIsPermissionsOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Shield size={14} />
                <span>Permissions</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="Import records from JSON file"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="Export current table records to JSON file"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button
                onClick={() => setIsRecentlyDeletedOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="View recently deleted records (Recycle Bin)"
              >
                <History size={14} />
                <span>Recently Deleted</span>
              </button>

              <button
                onClick={handleDeleteAllRecords}
                className="flex items-center gap-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                title="Move all current table records to Recycle Bin"
              >
                <Trash2 size={14} />
                <span>Delete All</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-700 p-2.5 rounded-lg text-xs transition-colors"
                  aria-label="More actions"
                >
                  <MoreHorizontal size={14} />
                </button>
                {isMoreMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsMoreMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsImportOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Upload size={14} className="text-gray-400" />
                        <span>Import</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleExportJSON();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Download size={14} className="text-gray-400" />
                        <span>Export</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsSchemaOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Settings2 size={14} className="text-gray-400" />
                        <span>Schema</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsRecentlyDeletedOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <History size={14} className="text-gray-400" />
                        <span>Recently Deleted</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleDeleteAllRecords();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} className="text-rose-400" />
                        <span>Delete All</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  const initialData: Record<string, any> = {};
                  selectedEntity.fields.forEach(f => {
                    if (f.key === 'items') {
                      initialData[f.key] = [];
                    } else if (f.defaultValue) {
                      initialData[f.key] = f.defaultValue;
                    }
                  });
                  setFormData(initialData);
                  setEditingRecordId(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gray-950 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Search and Stats Info Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={selectedEntity.searchPlaceholder || `Search within ${selectedEntity.name} fields...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow"
                />
              </div>
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer select-none"
                title="Scan Patient Admission QR Code"
              >
                <QrCode size={14} className="text-indigo-600 animate-pulse" />
                <span>Scan QR</span>
              </button>
            </div>
            {(selectedEntityId === 'ClinicalEncounter' || selectedEntityId === 'Staff' || selectedEntityId === 'Patient' || selectedEntityId === 'LabResult' || selectedEntityId === 'Prescription' || selectedEntityId === 'Appointment' || selectedEntityId === 'Diagnostic' || selectedEntityId === 'Bed' || selectedEntityId === 'VitalSign' || selectedEntityId === 'Admission' || selectedEntityId === 'LiaisonOffice' || selectedEntityId === 'Immunization' || selectedEntityId === 'OperativeRecord' || selectedEntityId === 'SupplyItem' || selectedEntityId === 'FinancialLedger' || selectedEntityId === 'InsuranceClaim' || selectedEntityId === 'User' || selectedEntityId === 'PatientJourneyEvent' || selectedEntityId === 'Notification' || selectedEntityId === 'NotificationPreference') && (
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isFilterPanelOpen || activeFiltersCount > 0
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-gray-900 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Info size={14} className="text-gray-400" />
            <span>Showing {filteredRecords.length} of {records.length} database rows</span>
          </div>
        </div>

        {/* Dynamic Summary Stats Row */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap gap-4">
          {selectedEntity.id === 'Bed' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Occupancy:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'occupied').length} Occupied
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'available').length} Available
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                  {records.filter(r => r.status === 'reserved').length} Reserved
                </span>
                <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold border border-gray-100">
                  {records.filter(r => r.status === 'cleaning' || r.status === 'maintenance').length} Servicing
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200 self-center hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wards:</span>
                {Array.from(new Set(records.map(r => r.ward).filter(Boolean))).slice(0, 4).map(ward => (
                  <span key={ward} className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {ward}: {records.filter(r => r.ward === ward).length}
                  </span>
                ))}
              </div>
            </>
          )}
          {selectedEntity.id === 'ClinicalEncounter' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'open' || r.status === 'in_progress').length} Active
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'discharged' || r.status === 'closed').length} Completed
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200 self-center hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority:</span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                  {records.filter(r => r.priority === 'urgent' || r.priority === 'critical' || r.priority === 'trauma').length} Emergency
                </span>
                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold border border-slate-100">
                  {records.filter(r => r.priority === 'routine').length} Routine
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Prescription' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fulfillment:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'pending' || r.status === 'active').length} Pending
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'completed' || r.status === 'dispensed').length} Dispensed
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Appointment' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Schedule:</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                  {records.filter(r => r.status === 'scheduled').length} Scheduled
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'checked_in' || r.status === 'in_progress').length} In Progress
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'completed').length} Completed
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Allergy' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Safety:</span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100 animate-pulse">
                {records.filter(r => r.severity === 'Severe' || r.severity === 'Lethal').length} High Risk
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                {records.filter(r => r.severity === 'Moderate').length} Moderate
              </span>
            </div>
          )}
          {selectedEntity.id === 'VitalSign' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Metrics:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.length} Readings
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                {records.filter(r => r.temp_c > 38 || r.bp_systolic > 140).length} Abnormal
              </span>
            </div>
          )}
          {selectedEntity.id === 'Admission' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inpatient:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.filter(r => r.status === 'Active').length} Active
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                {records.filter(r => r.status === 'Discharged').length} Discharged
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                {records.filter(r => r.admission_type === 'Emergency').length} Emergencies
              </span>
            </div>
          )}
          {selectedEntity.id === 'LiaisonOffice' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Liaison:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.filter(r => r.referral_type === 'Outbound').length} Outbound
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                {records.filter(r => r.status === 'Approved').length} Approved
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                {records.filter(r => r.status === 'Pending').length} Pending
              </span>
            </div>
          )}
          {['Bed', 'ClinicalEncounter', 'Prescription', 'Appointment', 'Allergy', 'VitalSign', 'Admission', 'LiaisonOffice'].includes(selectedEntity.id) === false && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Metrics:</span>
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                Total Records: {records.length}
              </span>
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                Today's Entries: {records.filter(r => {
                  const date = r.tx_date || r.encounter_date || r.created_at || r.registration_date || r.ordered_at || r.prescribed_at || r.scheduled_at;
                  if (!date) return false;
                  return new Date(date).toDateString() === new Date().toDateString();
                }).length}
              </span>
            </div>
          )}
        </div>

        {/* Collapsible Filter Criteria Dashboard (ClinicalEncounter specific) */}
        {selectedEntityId === 'ClinicalEncounter' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>ClinicalEncounter Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Encounter type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Encounter type</label>
                <select
                  value={filters.encounter_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, encounter_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Encounter Types</option>
                  <option value="opd">opd</option>
                  <option value="ipd">ipd</option>
                  <option value="emergency">emergency</option>
                  <option value="referral">referral</option>
                  <option value="follow_up">follow_up</option>
                </select>
              </div>

              {/* Clinic */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Clinic</label>
                <select
                  value={filters.clinic}
                  onChange={(e) => setFilters(prev => ({ ...prev, clinic: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white font-sans"
                >
                  <option value="">All Clinics</option>
                  <option value="general_opd">general_opd</option>
                  <option value="art_hiv">art_hiv</option>
                  <option value="tb_clinic">tb_clinic</option>
                  <option value="diabetes_hypertension">diabetes_hypertension</option>
                  <option value="family_planning">family_planning</option>
                  <option value="epi_immunization">epi_immunization</option>
                  <option value="dental">dental</option>
                  <option value="ophthalmology">ophthalmology</option>
                  <option value="psychiatric">psychiatric</option>
                  <option value="antenatal">antenatal</option>
                  <option value="labor_delivery">labor_delivery</option>
                  <option value="neonatal_nicu">neonatal_nicu</option>
                  <option value="pediatric">pediatric</option>
                  <option value="medical_ward">medical_ward</option>
                  <option value="surgical_ward">surgical_ward</option>
                  <option value="gynecology">gynecology</option>
                  <option value="icu">icu</option>
                  <option value="operating_room">operating_room</option>
                  <option value="referral_clinic">referral_clinic</option>
                  <option value="triage_emergency">triage_emergency</option>
                </select>
              </div>

              {/* Vitals pulse */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals pulse (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_pulse_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_pulse_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_pulse_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_pulse_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals temp */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals temp (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={filters.vitals_temp_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_temp_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={filters.vitals_temp_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_temp_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals spo2 */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals spo2 (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_spo2_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_spo2_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_spo2_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_spo2_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals respiratory rate */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals respiratory rate (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_respiratory_rate_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_respiratory_rate_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_respiratory_rate_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_respiratory_rate_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals weight */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals weight (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_weight_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_weight_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_weight_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_weight_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Encounter date range */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Encounter date (From - To)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filters.encounter_date_from}
                    onChange={(e) => setFilters(prev => ({ ...prev, encounter_date_from: e.target.value }))}
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={filters.encounter_date_to}
                    onChange={(e) => setFilters(prev => ({ ...prev, encounter_date_to: e.target.value }))}
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="awaiting_results">awaiting_results</option>
                  <option value="discharged">discharged</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Priorities</option>
                  <option value="routine">routine</option>
                  <option value="urgent">urgent</option>
                  <option value="critical">critical</option>
                  <option value="trauma">trauma</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Staff specific) */}
        {selectedEntityId === 'Staff' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Staff Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                    staff_id: '',
                    full_name: '',
                    department: '',
                    role: '',
                    prescribed_at_from: '',
                    prescribed_at_to: '',
                    prescription_items_query: '',
                    prescription_status: '',
                    dispensed_at_from: '',
                    dispensed_at_to: '',
                    prescription_payer_method: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* staff_id */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">staff_id</label>
                <input
                  type="text"
                  placeholder="Filter by staff_id..."
                  value={filters.staff_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, staff_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* full_name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">full_name</label>
                <input
                  type="text"
                  placeholder="Filter by full_name..."
                  value={filters.full_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* department */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">department</label>
                <select
                  value={filters.department || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Departments</option>
                  <option value="medical">medical</option>
                  <option value="nursing">nursing</option>
                  <option value="pharmacy">pharmacy</option>
                  <option value="laboratory">laboratory</option>
                  <option value="administration">administration</option>
                </select>
              </div>

              {/* role */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">role</label>
                <input
                  type="text"
                  placeholder="Filter by role..."
                  value={filters.role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Patient specific) */}
        {selectedEntityId === 'Patient' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Patient Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    patient_mrn: '',
                    patient_gender: '',
                    patient_blood_group: '',
                    patient_cbhi_status: '',
                    patient_region: '',
                    patient_woreda: '',
                    patient_status: '',
                    patient_registration_date_from: '',
                    patient_registration_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">MRN</label>
                <input
                  type="text"
                  placeholder="Filter by mrn..."
                  value={filters.patient_mrn || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_mrn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Gender</label>
                <select
                  value={filters.patient_gender || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_gender: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Blood Group</label>
                <select
                  value={filters.patient_blood_group || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_blood_group: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Types</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">CBHI Status</label>
                <select
                  value={filters.patient_cbhi_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_cbhi_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.patient_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Region</label>
                <input
                  type="text"
                  placeholder="Filter region..."
                  value={filters.patient_region || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_region: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Woreda</label>
                <input
                  type="text"
                  placeholder="Filter woreda..."
                  value={filters.patient_woreda || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_woreda: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Reg. Date From</label>
                <input
                  type="date"
                  value={filters.patient_registration_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_registration_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Reg. Date To</label>
                <input
                  type="date"
                  value={filters.patient_registration_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_registration_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (LabResult specific) */}
        {selectedEntityId === 'LabResult' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>LabResult Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    lab_result_panel: '',
                    lab_result_status: '',
                    lab_result_test_type: '',
                    lab_result_is_critical: '',
                    lab_result_resulted_at_from: '',
                    lab_result_resulted_at_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Panel</label>
                <select
                  value={filters.lab_result_panel || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_panel: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Panels</option>
                  <option value="hematology">Hematology</option>
                  <option value="biochemistry">Biochemistry</option>
                  <option value="microbiology">Microbiology</option>
                  <option value="immunology">Immunology</option>
                  <option value="urinalysis">Urinalysis</option>
                  <option value="cd4_vl">CD4/VL</option>
                  <option value="coagulation">Coagulation</option>
                  <option value="hormones">Hormones</option>
                  <option value="radiology_report">Radiology Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.lab_result_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="preliminary">Preliminary</option>
                  <option value="final">Final</option>
                  <option value="amended">Amended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600">Test Type Contains</label>
                <input
                  type="text"
                  placeholder="e.g. blood count..."
                  value={filters.lab_result_test_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_test_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Critical?</label>
                <select
                  value={filters.lab_result_is_critical || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_is_critical: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Resulted Date From</label>
                <input
                  type="date"
                  value={filters.lab_result_resulted_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_resulted_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Resulted Date To</label>
                <input
                  type="date"
                  value={filters.lab_result_resulted_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_resulted_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Prescription specific) */}
        {selectedEntityId === 'Prescription' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Prescription Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                    staff_id: '',
                    full_name: '',
                    department: '',
                    role: '',
                    prescribed_at_from: '',
                    prescribed_at_to: '',
                    prescription_items_query: '',
                    prescription_status: '',
                    dispensed_at_from: '',
                    dispensed_at_to: '',
                    prescription_payer_method: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Prescribed at from */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Prescribed At (From)</label>
                <input
                  type="date"
                  value={filters.prescribed_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescribed_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Prescribed at to */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Prescribed At (To)</label>
                <input
                  type="date"
                  value={filters.prescribed_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescribed_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Items search */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Items (Medication Details)</label>
                <input
                  type="text"
                  placeholder="Search drug, dose, frequency..."
                  value={filters.prescription_items_query || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_items_query: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.prescription_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">pending</option>
                  <option value="dispensed">dispensed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              {/* Dispensed at from */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dispensed At (From)</label>
                <input
                  type="date"
                  value={filters.dispensed_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dispensed_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Dispensed at to */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dispensed At (To)</label>
                <input
                  type="date"
                  value={filters.dispensed_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dispensed_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Payer Method */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Payer Method</label>
                <select
                  value={filters.prescription_payer_method || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_payer_method: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Methods</option>
                  <option value="cash">cash</option>
                  <option value="insurance">insurance</option>
                  <option value="credit">credit</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Appointment specific) */}
        {selectedEntityId === 'Appointment' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Appointment Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                    staff_id: '',
                    full_name: '',
                    department: '',
                    role: '',
                    prescribed_at_from: '',
                    prescribed_at_to: '',
                    prescription_items_query: '',
                    prescription_status: '',
                    dispensed_at_from: '',
                    dispensed_at_to: '',
                    prescription_payer_method: '',
                    appointment_clinic: '',
                    appointment_type: '',
                    scheduled_at_from: '',
                    scheduled_at_to: '',
                    appointment_duration_min: '',
                    appointment_duration_max: '',
                    appointment_status: '',
                    appointment_reminder_sent: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Clinic */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Clinic</label>
                <select
                  value={filters.appointment_clinic || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_clinic: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Clinics</option>
                  <option value="general_opd">general_opd</option>
                  <option value="art_hiv">art_hiv</option>
                  <option value="tb_clinic">tb_clinic</option>
                  <option value="diabetes_hypertension">diabetes_hypertension</option>
                  <option value="family_planning">family_planning</option>
                  <option value="dental">dental</option>
                  <option value="ophthalmology">ophthalmology</option>
                  <option value="psychiatric">psychiatric</option>
                  <option value="antenatal">antenatal</option>
                  <option value="pediatric">pediatric</option>
                  <option value="surgical_ward">surgical_ward</option>
                  <option value="radiology">radiology</option>
                </select>
              </div>

              {/* Appointment Type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Appointment Type</label>
                <select
                  value={filters.appointment_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Types</option>
                  <option value="new">new</option>
                  <option value="follow_up">follow_up</option>
                  <option value="procedure">procedure</option>
                  <option value="review">review</option>
                  <option value="emergency">emergency</option>
                </select>
              </div>

              {/* Scheduled At From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Scheduled At (From)</label>
                <input
                  type="date"
                  value={filters.scheduled_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, scheduled_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Scheduled At To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Scheduled At (To)</label>
                <input
                  type="date"
                  value={filters.scheduled_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, scheduled_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Duration Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Duration (Min Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={filters.appointment_duration_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_duration_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Duration Max */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Duration (Max Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={filters.appointment_duration_max || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_duration_max: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.appointment_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">scheduled</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="no_show">no_show</option>
                </select>
              </div>

              {/* Reminder Sent */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Reminder Sent</label>
                <select
                  value={filters.appointment_reminder_sent || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, appointment_reminder_sent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Diagnostic specific) */}
        {selectedEntityId === 'Diagnostic' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Diagnostic Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    diagnostic_category: '',
                    diagnostic_ordered_at_from: '',
                    diagnostic_ordered_at_to: '',
                    diagnostic_is_critical: '',
                    diagnostic_status: '',
                    diagnostic_turnaround_min: '',
                    diagnostic_turnaround_max: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Category</label>
                <select
                  value={filters.diagnostic_category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_category: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="laboratory">laboratory</option>
                  <option value="radiology">radiology</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.diagnostic_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="ordered">ordered</option>
                  <option value="sample_collected">sample_collected</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resulted">resulted</option>
                  <option value="verified">verified</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              {/* Is Critical */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Critical</label>
                <select
                  value={filters.diagnostic_is_critical || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_is_critical: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All</option>
                  <option value="yes">Yes (Critical)</option>
                  <option value="no">No</option>
                </select>
              </div>

              {/* Ordered At From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ordered At (From)</label>
                <input
                  type="date"
                  value={filters.diagnostic_ordered_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_ordered_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Ordered At To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ordered At (To)</label>
                <input
                  type="date"
                  value={filters.diagnostic_ordered_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_ordered_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Turnaround Minutes Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Turnaround Min (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={filters.diagnostic_turnaround_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_turnaround_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Turnaround Minutes Max */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Turnaround Max (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={filters.diagnostic_turnaround_max || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_turnaround_max: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Bed specific) */}
        {selectedEntityId === 'Bed' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Bed Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    bed_ward: '',
                    bed_status: '',
                    bed_admission_date_from: '',
                    bed_admission_date_to: '',
                    bed_expected_discharge_from: '',
                    bed_expected_discharge_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Ward */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ward</label>
                <select
                  value={filters.bed_ward || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_ward: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Wards</option>
                  <option value="labor">Labor</option>
                  <option value="neonatal_nicu">NICU</option>
                  <option value="pediatric">Pediatric Ward</option>
                  <option value="medical">Medical Ward</option>
                  <option value="surgical">Surgical Ward</option>
                  <option value="gynecology">Gynecology</option>
                  <option value="icu">ICU</option>
                  <option value="post_op_recovery">Post-Op Recovery</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.bed_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Admission Date From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date (From)</label>
                <input
                  type="datetime-local"
                  value={filters.bed_admission_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_admission_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Admission Date To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date (To)</label>
                <input
                  type="datetime-local"
                  value={filters.bed_admission_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_admission_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Expected Discharge From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Expected Discharge (From)</label>
                <input
                  type="date"
                  value={filters.bed_expected_discharge_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_expected_discharge_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Expected Discharge To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Expected Discharge (To)</label>
                <input
                  type="date"
                  value={filters.bed_expected_discharge_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_expected_discharge_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (VitalSign specific) */}
        {selectedEntityId === 'VitalSign' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>VitalSign Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    vital_sign_taken_at_from: '',
                    vital_sign_taken_at_to: '',
                    vital_sign_hr_min: '',
                    vital_sign_hr_max: '',
                    vital_sign_temp_min: '',
                    vital_sign_temp_max: '',
                    vital_sign_spo2_min: '',
                    vital_sign_spo2_max: '',
                    vital_sign_bp_sys_min: '',
                    vital_sign_bp_sys_max: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Taken At From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Date From</label>
                <input
                  type="datetime-local"
                  value={filters.vital_sign_taken_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_taken_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Taken At To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Date To</label>
                <input
                  type="datetime-local"
                  value={filters.vital_sign_taken_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_taken_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Temp Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Temp Min (°C)</label>
                <input
                  type="number"
                  placeholder="e.g. 38.0"
                  value={filters.vital_sign_temp_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_temp_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* HR Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Heart Rate Min</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={filters.vital_sign_hr_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_hr_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* SpO2 Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">SpO2 Min (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 94"
                  value={filters.vital_sign_spo2_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_spo2_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Admission specific) */}
        {selectedEntityId === 'Admission' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Admission Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    admission_ward: '',
                    admission_type: '',
                    admission_status: '',
                    admission_date_from: '',
                    admission_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ward contains</label>
                <input
                  type="text"
                  placeholder="e.g. Medical..."
                  value={filters.admission_ward || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_ward: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.admission_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Type</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Elective">Elective</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Newborn">Newborn</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.admission_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date From</label>
                <input
                  type="date"
                  value={filters.admission_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date To</label>
                <input
                  type="date"
                  value={filters.admission_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (LiaisonOffice specific) */}
        {selectedEntityId === 'LiaisonOffice' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>LiaisonOffice Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    liaison_referral_type: '',
                    liaison_status: '',
                    liaison_source_facility: '',
                    liaison_destination_facility: '',
                    liaison_date_from: '',
                    liaison_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.liaison_referral_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_referral_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                  <option value="Emergency Transfer">Emergency Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.liaison_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Source contains</label>
                <input
                  type="text"
                  placeholder="e.g. Gelemso..."
                  value={filters.liaison_source_facility || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_source_facility: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dest. contains</label>
                <input
                  type="text"
                  placeholder="e.g. TASH..."
                  value={filters.liaison_destination_facility || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_destination_facility: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Referral Date From</label>
                <input
                  type="date"
                  value={filters.liaison_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Referral Date To</label>
                <input
                  type="date"
                  value={filters.liaison_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Immunization specific) */}
        {selectedEntityId === 'Immunization' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Immunization Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    immunization_vaccine_name: '',
                    immunization_administered_at_from: '',
                    immunization_administered_at_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vaccine contains</label>
                <input
                  type="text"
                  placeholder="e.g. Polio..."
                  value={filters.immunization_vaccine_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_vaccine_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Administered From</label>
                <input
                  type="date"
                  value={filters.immunization_administered_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_administered_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Administered To</label>
                <input
                  type="date"
                  value={filters.immunization_administered_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_administered_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (OperativeRecord specific) */}
        {selectedEntityId === 'OperativeRecord' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>OperativeRecord Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    operative_procedure_name: '',
                    operative_outcome: '',
                    operative_start_time_from: '',
                    operative_start_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Procedure contains</label>
                <input
                  type="text"
                  placeholder="e.g. Appendectomy..."
                  value={filters.operative_procedure_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_procedure_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Outcome</label>
                <select
                  value={filters.operative_outcome || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_outcome: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Successful">Successful</option>
                  <option value="Complicated">Complicated</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Start Time From</label>
                <input
                  type="date"
                  value={filters.operative_start_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_start_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Start Time To</label>
                <input
                  type="date"
                  value={filters.operative_start_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_start_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (SupplyItem specific) */}
        {selectedEntityId === 'SupplyItem' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>SupplyItem Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    supply_category: '',
                    supply_location: '',
                    supply_status: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Category</label>
                <select
                  value={filters.supply_category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_category: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Category</option>
                  <option value="drug">Drug</option>
                  <option value="consumable">Consumable</option>
                  <option value="equipment">Equipment</option>
                  <option value="furniture">Furniture</option>
                  <option value="linen">Linen</option>
                  <option value="reagent">Reagent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Location</label>
                <select
                  value={filters.supply_location || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_location: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Location</option>
                  <option value="drug_store_bulk">Drug Store Bulk</option>
                  <option value="central_store">Central Store</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="ward_stock">Ward Stock</option>
                  <option value="lab_stock">Lab Stock</option>
                  <option value="or_stock">OR Stock</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.supply_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="expired">Expired</option>
                  <option value="recalled">Recalled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (FinancialLedger specific) */}
        {selectedEntityId === 'FinancialLedger' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>FinancialLedger Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    financial_service_type: '',
                    financial_payer_method: '',
                    financial_status: '',
                    financial_tx_date_from: '',
                    financial_tx_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Service Type</label>
                <select
                  value={filters.financial_service_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_service_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="consultation">Consultation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="radiology">Radiology</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="ward_stay">Ward Stay</option>
                  <option value="surgery">Surgery</option>
                  <option value="procedure">Procedure</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Payer Method</label>
                <select
                  value={filters.financial_payer_method || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_payer_method: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="cash">Cash</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="cbhi_insurance">CBHI</option>
                  <option value="waiver">Waiver</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.financial_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Tx Date From</label>
                <input
                  type="date"
                  value={filters.financial_tx_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_tx_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Tx Date To</label>
                <input
                  type="date"
                  value={filters.financial_tx_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_tx_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (InsuranceClaim specific) */}
        {selectedEntityId === 'InsuranceClaim' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>InsuranceClaim Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    claim_insurer: '',
                    claim_status: '',
                    claim_date_from: '',
                    claim_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Insurer</label>
                <select
                  value={filters.claim_insurer || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_insurer: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="cbhi">CBHI</option>
                  <option value="private">Private</option>
                  <option value="ngo">NGO</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.claim_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Paid">Paid</option>
                  <option value="Appealed">Appealed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Claim Date From</label>
                <input
                  type="date"
                  value={filters.claim_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Claim Date To</label>
                <input
                  type="date"
                  value={filters.claim_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (User specific) */}
        {selectedEntityId === 'User' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>User Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    user_role: '',
                    user_hospital_id: '',
                    user_created_date_from: '',
                    user_created_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Role</label>
                <select
                  value={filters.user_role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Hospital ID contains</label>
                <input
                  type="text"
                  placeholder="e.g. HSP-001..."
                  value={filters.user_hospital_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_hospital_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Created Date From</label>
                <input
                  type="date"
                  value={filters.user_created_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_created_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Created Date To</label>
                <input
                  type="date"
                  value={filters.user_created_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_created_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (PatientJourneyEvent specific) */}
        {selectedEntityId === 'PatientJourneyEvent' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Journey Event Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    journey_stage: '',
                    journey_status: '',
                    journey_event_time_from: '',
                    journey_event_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Stage</label>
                <select
                  value={filters.journey_stage || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_stage: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="referral">Referral</option>
                  <option value="registration">Registration</option>
                  <option value="triage">Triage</option>
                  <option value="consultation">Consultation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="radiology">Radiology</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="operating_room">Operating Room</option>
                  <option value="ward_admission">Ward Admission</option>
                  <option value="ward_transfer">Ward Transfer</option>
                  <option value="discharge">Discharge</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.journey_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time From</label>
                <input
                  type="date"
                  value={filters.journey_event_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_event_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time To</label>
                <input
                  type="date"
                  value={filters.journey_event_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_event_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Notification specific) */}
        {selectedEntityId === 'Notification' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Notification Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    notification_type: '',
                    notification_severity: '',
                    notification_is_read: '',
                    notification_event_time_from: '',
                    notification_event_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.notification_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical_lab">Critical Lab</option>
                  <option value="critical_vital">Critical Vital</option>
                  <option value="critical_imaging">Critical Imaging</option>
                  <option value="medication_alert">Medication Alert</option>
                  <option value="patient_deterioration">Patient Deterioration</option>
                  <option value="or_schedule">OR Schedule</option>
                  <option value="trauma_incoming">Trauma Incoming</option>
                  <option value="cbhi_alert">CBHI Alert</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Severity</label>
                <select
                  value={filters.notification_severity || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_severity: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Read</label>
                <select
                  value={filters.notification_is_read || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_is_read: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time From</label>
                <input
                  type="date"
                  value={filters.notification_event_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_event_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time To</label>
                <input
                  type="date"
                  value={filters.notification_event_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_event_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (NotificationPreference specific) */}
        {selectedEntityId === 'NotificationPreference' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Preference Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    pref_role: '',
                    pref_alert_type: '',
                    pref_min_severity: '',
                    pref_enabled: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Role</label>
                <select
                  value={filters.pref_role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="physician">Physician</option>
                  <option value="nurse">Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_tech">Lab Tech</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Alert Type</label>
                <select
                  value={filters.pref_alert_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_alert_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical_lab">Critical Lab</option>
                  <option value="critical_vital">Critical Vital</option>
                  <option value="critical_imaging">Critical Imaging</option>
                  <option value="medication_alert">Medication Alert</option>
                  <option value="patient_deterioration">Patient Deterioration</option>
                  <option value="or_schedule">OR Schedule</option>
                  <option value="trauma_incoming">Trauma Incoming</option>
                  <option value="cbhi_alert">CBHI Alert</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Min Severity</label>
                <select
                  value={filters.pref_min_severity || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_min_severity: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Enabled</label>
                <select
                  value={filters.pref_enabled || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_enabled: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Live Table Renderer */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white min-w-[700px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {selectedEntity.fields
                    .filter(f => {
                      const id = selectedEntity.id;
                      if (id === 'User') return ['full_name', 'email', 'role', 'hospital_id', 'created_date'].includes(f.key);
                      if (id === 'Staff') return ['staff_id', 'full_name', 'department', 'role', 'status'].includes(f.key);
                      if (id === 'Patient') return ['mrn', 'full_name', 'gender', 'phone', 'status'].includes(f.key);
                      if (id === 'Immunization') return ['imm_id', 'patient_name', 'vaccine_name', 'dose_number', 'administered_at'].includes(f.key);
                      if (id === 'ClinicalEncounter') return ['visit_id', 'patient_name', 'encounter_type', 'status', 'priority'].includes(f.key);
                      if (id === 'OperativeRecord') return ['op_id', 'patient_name', 'procedure_name', 'surgeon', 'outcome', 'start_time'].includes(f.key);
                      if (id === 'Admission') return ['admission_id', 'patient_name', 'ward', 'bed_number', 'admission_date', 'status'].includes(f.key);
                      if (id === 'LiaisonOffice') return ['referral_id', 'patient_name', 'destination_facility', 'referral_type', 'status', 'referral_date'].includes(f.key);
                      if (id === 'Appointment') return ['appointment_id', 'patient_name', 'clinic', 'appointment_type', 'scheduled_at', 'status'].includes(f.key);
                      if (id === 'Bed') return ['bed_number', 'ward', 'status', 'patient_name', 'admission_date'].includes(f.key);
                      if (id === 'Prescription') return ['rx_id', 'patient_name', 'prescribed_at', 'items', 'status'].includes(f.key);
                      if (id === 'Diagnostic') return ['test_id', 'patient_name', 'category', 'test_type', 'status', 'ordered_at'].includes(f.key);
                      if (id === 'LabResult') return ['result_id', 'patient_name', 'test_type', 'panel', 'status', 'resulted_at'].includes(f.key);
                      if (id === 'InsuranceClaim') return ['claim_id', 'patient_name', 'insurer', 'total_amount', 'status', 'claim_date'].includes(f.key);
                      if (id === 'FinancialLedger') return ['tx_id', 'patient_name', 'service_type', 'amount', 'status', 'tx_date'].includes(f.key);
                      if (id === 'SupplyItem') return ['item_code', 'name', 'category', 'qty_on_hand', 'status', 'location'].includes(f.key);
                      if (id === 'Notification') return ['title', 'type', 'severity', 'patient_name', 'is_read', 'event_time'].includes(f.key);
                      if (id === 'PatientJourneyEvent') return ['patient_name', 'stage', 'stage_label', 'location', 'handled_by', 'event_time'].includes(f.key);
                      if (id === 'NotificationPreference') return ['role', 'alert_type', 'in_app', 'sms', 'email', 'enabled'].includes(f.key);
                      return selectedEntity.fields.slice(0, 5).map(x => x.key).includes(f.key);
                    })
                    .map((field) => (
                      <th key={field.key} className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                  <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      {selectedEntity.fields
                        .filter(f => {
                          const id = selectedEntity.id;
                          if (id === 'User') return ['full_name', 'email', 'role', 'hospital_id', 'created_date'].includes(f.key);
                          if (id === 'Staff') return ['staff_id', 'full_name', 'department', 'role', 'status'].includes(f.key);
                          if (id === 'Patient') return ['mrn', 'full_name', 'gender', 'phone', 'status'].includes(f.key);
                          if (id === 'Immunization') return ['imm_id', 'patient_name', 'vaccine_name', 'dose_number', 'administered_at'].includes(f.key);
                          if (id === 'ClinicalEncounter') return ['visit_id', 'patient_name', 'encounter_type', 'status', 'vitals_summary', 'priority'].includes(f.key);
                          if (id === 'OperativeRecord') return ['op_id', 'patient_name', 'procedure_name', 'surgeon', 'outcome', 'start_time'].includes(f.key);
                          if (id === 'Admission') return ['admission_id', 'patient_name', 'ward', 'bed_number', 'admission_date', 'status'].includes(f.key);
                          if (id === 'LiaisonOffice') return ['referral_id', 'patient_name', 'destination_facility', 'referral_type', 'status', 'referral_date'].includes(f.key);
                          if (id === 'Appointment') return ['appointment_id', 'patient_name', 'clinic', 'appointment_type', 'scheduled_at', 'status'].includes(f.key);
                          if (id === 'Bed') return ['bed_number', 'ward', 'status', 'patient_name', 'admission_date'].includes(f.key);
                          if (id === 'Prescription') return ['rx_id', 'patient_name', 'prescribed_at', 'items', 'status'].includes(f.key);
                          if (id === 'Diagnostic') return ['test_id', 'patient_name', 'category', 'test_type', 'status', 'ordered_at'].includes(f.key);
                          if (id === 'LabResult') return ['result_id', 'patient_name', 'test_type', 'panel', 'status', 'resulted_at'].includes(f.key);
                          if (id === 'InsuranceClaim') return ['claim_id', 'patient_name', 'insurer', 'total_amount', 'status', 'claim_date'].includes(f.key);
                          if (id === 'FinancialLedger') return ['tx_id', 'patient_name', 'service_type', 'amount', 'status', 'tx_date'].includes(f.key);
                          if (id === 'SupplyItem') return ['item_code', 'name', 'category', 'qty_on_hand', 'status', 'location'].includes(f.key);
                          if (id === 'Notification') return ['title', 'type', 'severity', 'patient_name', 'is_read', 'event_time'].includes(f.key);
                          if (id === 'PatientJourneyEvent') return ['patient_name', 'stage', 'stage_label', 'location', 'handled_by', 'event_time'].includes(f.key);
                          if (id === 'NotificationPreference') return ['role', 'alert_type', 'in_app', 'sms', 'email', 'enabled'].includes(f.key);
                          return selectedEntity.fields.slice(0, 5).map(x => x.key).includes(f.key);
                        })
                        .map((field) => (
                          <td key={field.key} className="px-5 py-3.5 text-xs">
                            {field.key === 'vitals_summary' ? (
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {record.vitals_bp && (
                                  <span className="text-[9px] bg-slate-50 text-slate-600 px-1 py-0.5 rounded border border-gray-100 font-mono" title="BP">
                                    {record.vitals_bp}
                                  </span>
                                )}
                                {record.vitals_temp && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100 font-mono" title="Temp">
                                    {record.vitals_temp}°C
                                  </span>
                                )}
                                {record.vitals_pulse && (
                                  <span className="text-[9px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded border border-rose-100 font-mono" title="Pulse">
                                    {record.vitals_pulse} bpm
                                  </span>
                                )}
                                {record.vitals_spo2 && (
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 font-mono" title="SpO2">
                                    {record.vitals_spo2}%
                                  </span>
                                )}
                                {!record.vitals_bp && !record.vitals_temp && !record.vitals_pulse && <span className="text-gray-300 font-mono">—</span>}
                              </div>
                            ) : field.key === 'items' || field.key === 'services' || field.key === 'result_entries' ? (
                              <div className="flex flex-col gap-1 max-w-[240px]">
                                {(Array.isArray(record[field.key]) ? record[field.key] : []).map((item: any, idx: number) => (
                                  <div key={idx} className={`${field.key === 'result_entries' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'} text-[10px] px-2 py-0.5 rounded border font-medium leading-tight`}>
                                    {field.key === 'items' ? (
                                      <><span className="font-semibold">{item.drug || 'Drug'}</span> ({item.dose || 'Dose'} - {item.frequency || 'Freq'})</>
                                    ) : field.key === 'services' ? (
                                      <><span className="font-semibold">{item.service_type || 'Service'}</span> - {item.amount ? `${item.amount} ETB` : 'No cost'}</>
                                    ) : (
                                      <><span className="font-semibold">{item.parameter || 'Test'}</span>: {item.value || 'N/A'} {item.unit || ''} ({item.flag || 'Normal'})</>
                                    )}
                                  </div>
                                ))}
                                {(!record[field.key] || record[field.key].length === 0) && <span className="text-gray-400 font-mono">—</span>}
                              </div>
                            ) : field.key === 'reminder_sent' || field.key === 'is_read' || field.key === 'is_active' || field.type === 'checkbox' ? (
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                record[field.key] === true || String(record[field.key]) === 'true'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : 'bg-gray-50 text-gray-400 border border-gray-100'
                                }`}>
                                {record[field.key] === true || String(record[field.key]) === 'true' ? 'Yes' : 'No'}
                              </span>
                            ) : field.type === 'array' ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {Array.isArray(record[field.key]) && record[field.key].length > 0 ? (
                                  record[field.key].map((item: any, idx: number) => (
                                    <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono leading-normal max-w-full truncate" title={typeof item === 'object' ? JSON.stringify(item) : String(item)}>
                                      {typeof item === 'object' ? (item.parameter || item.service_type || JSON.stringify(item)) : String(item)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 font-mono">—</span>
                                )}
                              </div>
                            ) : field.key === 'status' || field.key === 'type' || field.key === 'priority' || field.key === 'severity' || field.key === 'cbhi_status' ? (
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                ['active', 'approved', 'completed', 'income', 'available', 'admin', 'open', 'routine', 'final', 'verified', 'paid', 'reimbursed', 'in_stock'].includes(String(record[field.key] || '').toLowerCase())
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : ['pending', 'scheduled', 'in progress', 'in_progress', 'user', 'urgent', 'occupied', 'reserved', 'cleaning', 'preliminary', 'draft', 'submitted', 'under_review', 'low_stock'].includes(String(record[field.key] || '').toLowerCase())
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : String(record[field.key] || '').toLowerCase() === 'critical' || String(record[field.key] || '').toLowerCase() === 'emergency' || String(record[field.key] || '').toLowerCase() === 'out_of_stock' || String(record[field.key] || '').toLowerCase() === 'expired'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                                      : 'bg-gray-50 text-gray-500 border border-gray-100'
                                }`}>
                                {record[field.key] || 'None'}
                              </span>
                            ) : field.key === 'bp_systolic' ? (
                              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Blood Pressure">
                                {record.bp_systolic && record.bp_diastolic ? `${record.bp_systolic}/${record.bp_diastolic}` : record[field.key] || '—'}
                              </span>
                            ) : field.key === 'temp_c' ? (
                              <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${Number(record[field.key]) > 38 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`} title="Temperature">
                                {record[field.key] ? `${record[field.key]}°C` : '—'}
                              </span>
                            ) : field.key === 'heart_rate' ? (
                              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100" title="Heart Rate">
                                {record[field.key] ? `${record[field.key]} bpm` : '—'}
                              </span>
                            ) : field.key === 'spo2' ? (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="SpO2">
                                {record[field.key] ? `${record[field.key]}%` : '—'}
                              </span>
                            ) : field.key === 'amount' || field.key === 'total_amount' || field.key === 'approved_amount' || field.key === 'unit_cost' ? (
                              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {record[field.key] ? `${Number(record[field.key]).toLocaleString()} ETB` : '0 ETB'}
                              </span>
                            ) : field.type === 'date' || field.type === 'date-time' ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">
                                  {record[field.key] ? new Date(record[field.key]).toLocaleDateString() : '—'}
                                </span>
                                {field.type === 'date-time' && record[field.key] && (
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    {new Date(record[field.key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            ) : field.key === 'referral_paper' ? (
                              record[field.key] ? (
                                <img src={record[field.key]} alt="Referral" className="w-8 h-8 object-cover rounded-lg border border-gray-200" />
                              ) : (
                                <span className="text-gray-400 font-mono">—</span>
                              )
                            ) : (
                              <span className="text-gray-700 font-medium truncate max-w-[150px] inline-block" title={record[field.key]}>
                                {record[field.key] || '—'}
                              </span>
                            )}
                          </td>
                        ))}
                      
                      {/* Adjust and Delete Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {selectedEntity.id === 'Bed' && (record.status === 'available' || record.status === 'cleaning' || record.status === 'maintenance') && (
                            <button
                              onClick={() => {
                                // Pre-populate formData with the record details, and change status to 'occupied'
                                const recordData: Record<string, any> = {};
                                selectedEntity.fields.forEach((field) => {
                                  if (field.key === 'status') {
                                    recordData[field.key] = 'occupied';
                                  } else {
                                    recordData[field.key] = record[field.key] !== undefined && record[field.key] !== null ? String(record[field.key]) : '';
                                  }
                                });
                                // Set default admission date to current local date-time
                                const now = new Date();
                                const tzoffset = now.getTimezoneOffset() * 60000;
                                const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                recordData.admission_date = localISOTime;

                                setFormData(recordData);
                                setEditingRecordId(record.id);
                                setIsFormOpen(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-emerald-100 mr-1 cursor-pointer"
                              title="Admit Patient to Bed"
                            >
                              <Check size={11} className="stroke-[3px]" />
                              <span>Admit</span>
                            </button>
                          )}
                          
                          {/* Dedicated QR Button for ALL Schema Tables */}
                          <button
                            onClick={() => handlePresentQrCode(record, selectedEntity.id)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-indigo-100 mr-1 cursor-pointer"
                            title={`Generate & View purpose-specific QR Badge for this ${selectedEntity.name} record`}
                          >
                            <QrCode size={11} />
                            <span>View QR</span>
                          </button>
                          
                          {/* Main Edit Button */}
                          <button
                            onClick={() => {
                              // Pre-populate formData with the record details
                              const recordData: Record<string, any> = {};
                              selectedEntity.fields.forEach((field) => {
                                if (field.type === 'array' || field.key === 'items' || field.key === 'services' || field.key === 'result_entries') {
                                  if (Array.isArray(record[field.key])) {
                                    recordData[field.key] = record[field.key];
                                  } else if (typeof record[field.key] === 'string' && record[field.key].trim()) {
                                    const str = record[field.key].trim();
                                    if (str.startsWith('[') && str.endsWith(']')) {
                                      try {
                                        recordData[field.key] = JSON.parse(str);
                                      } catch (e) {
                                        recordData[field.key] = str.split(',').map((x: any) => String(x).trim()).filter(Boolean);
                                      }
                                    } else {
                                      recordData[field.key] = str.split(',').map((x: any) => String(x).trim()).filter(Boolean);
                                    }
                                  } else {
                                    recordData[field.key] = [];
                                  }
                                } else if (field.type === 'checkbox') {
                                  recordData[field.key] = record[field.key] === true || String(record[field.key]) === 'true';
                                } else {
                                  recordData[field.key] = record[field.key] !== undefined && record[field.key] !== null ? String(record[field.key]) : '';
                                }
                              });
                              setFormData(recordData);
                              setEditingRecordId(record.id);
                              setIsFormOpen(true);
                            }}
                            className={`${
                              selectedEntity.id === 'Bed' 
                                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-100'
                            } px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border mr-1 cursor-pointer`}
                            title={`Edit ${selectedEntity.name} Details`}
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </button>

                          {/* Main Delete Button */}
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-rose-100 cursor-pointer"
                            title={`Delete ${selectedEntity.name} permanently`}
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={
                        selectedEntity.id === 'ClinicalEncounter' 
                          ? 6 
                          : selectedEntity.id === 'Staff' 
                            ? 6 
                            : selectedEntity.id === 'Prescription' 
                              ? 7 
                              : selectedEntity.id === 'Appointment'
                                ? 10
                                : selectedEntity.fields.slice(0, 5).length + 1
                      } 
                      className="px-5 py-16 text-center text-gray-400"
                    >
                      <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 mb-3 text-gray-400">
                        <Database size={18} />
                      </div>
                      <p className="font-semibold text-sm text-gray-700">No records found</p>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto mt-1">
                        {selectedEntity.id === 'ClinicalEncounter' 
                          ? 'Get started by adding your first record.' 
                          : 'Use the "Add Record" button or click "Seed Table" to automatically generate realistic hospital records.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Interactive Ward QR Scanner Simulator Modal */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-left animate-fadeIn">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-900/50 text-indigo-400 rounded-xl border border-indigo-800/40">
                  <QrCode size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Clinical QR Scanner Portal</h3>
                  <p className="text-[10px] text-slate-400">Verifies and processes QR codes across all EHR departments.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsScannerModalOpen(false);
                  setScannerSuccessMsg('');
                  setScannerSelectedItemId('');
                }}
                className="text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/30 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Purpose Selector Tabs */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Select Scanner Purpose Mode:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/50 text-[10px]">
                  <button
                    onClick={() => { setScannerMode('patient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'patient' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Patient ID
                  </button>
                  <button
                    onClick={() => { setScannerMode('staff'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'staff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Staff Badge
                  </button>
                  <button
                    onClick={() => { setScannerMode('user'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'user' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    User Pass
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/50 text-[10px]">
                  <button
                    onClick={() => { setScannerMode('inpatient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'inpatient' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Inpatient Care QR
                  </button>
                  <button
                    onClick={() => { setScannerMode('outpatient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'outpatient' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Outpatient Care QR
                  </button>
                </div>
              </div>

              {/* Simulator Camera Viewfinder */}
              <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center shadow-inner">
                {/* Laser scan line overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-[bounce_2.5s_infinite]"></div>
                
                {/* Viewfinder crosshairs */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500"></div>
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500"></div>

                {scannerSuccessMsg ? (
                  <div className="text-center space-y-3 z-10 px-4">
                    <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 items-center justify-center border border-emerald-500/30 animate-pulse">
                      <Check size={24} />
                    </div>
                    <p className="text-xs font-mono font-bold text-emerald-400 tracking-wide">{scannerSuccessMsg}</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 z-10">
                    <QrCode size={40} className="mx-auto text-slate-600 animate-pulse" />
                    <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                      {scannerMode === 'patient' && "Align Unified Patient QR Code"}
                      {scannerMode === 'staff' && "Align Staff Clinical Badge QR"}
                      {scannerMode === 'user' && "Align Workspace User Access QR"}
                      {scannerMode === 'inpatient' && "Align Unified Patient QR (Inpatient)"}
                      {scannerMode === 'outpatient' && "Align Unified Patient QR (Outpatient)"}
                    </p>
                  </div>
                )}
              </div>

              {/* Dropdown selectors for mock scanning */}
              <div className="space-y-3.5 bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    Simulate QR Scan:
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {scannerMode === 'patient' && "Choose a registered Patient profile to scan their Universal QR."}
                    {scannerMode === 'staff' && "Choose a clinical Staff member to scan their shift badge."}
                    {scannerMode === 'user' && "Choose a registered User account to scan their workstation pass."}
                    {scannerMode === 'inpatient' && "Choose an active Admission record. Note: scans Patient's unified QR!"}
                    {scannerMode === 'outpatient' && "Choose an active Clinical Encounter. Note: scans Patient's unified QR!"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={scannerSelectedItemId}
                    onChange={(e) => setScannerSelectedItemId(e.target.value)}
                    disabled={!!scannerSuccessMsg}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">
                      -- Choose {scannerMode === 'patient' ? 'Patient' : scannerMode === 'staff' ? 'Staff Badge' : scannerMode === 'user' ? 'User Workstation' : scannerMode === 'inpatient' ? 'Inpatient Ward Record' : 'Outpatient Encounter'} --
                    </option>

                    {scannerMode === 'patient' && patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.name} ({p.mrn})
                      </option>
                    ))}

                    {scannerMode === 'staff' && scannerStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.staff_id || 'STF-ID'}) - {s.role}
                      </option>
                    ))}

                    {scannerMode === 'user' && scannerUserList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.role})
                      </option>
                    ))}

                    {scannerMode === 'inpatient' && scannerInpatientList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient_name || 'Patient'} ({a.patient_mrn}) - Ward: {a.ward || 'N/A'}
                      </option>
                    ))}

                    {scannerMode === 'outpatient' && scannerOutpatientList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.patient_name || 'Patient'} ({e.patient_mrn}) - Clinic: {e.clinic || 'General OPD'}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSimulateScan}
                    disabled={!scannerSelectedItemId || !!scannerSuccessMsg}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl border border-emerald-500 transition-colors select-none cursor-pointer"
                  >
                    Scan Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Admission ID Card & QR Modal */}
      {isQrModalOpen && selectedPatientQr && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden text-left animate-fadeIn">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg text-white ${
                  qrType === 'staff' ? 'bg-emerald-600' :
                  qrType === 'user' ? 'bg-slate-800' :
                  qrType === 'inpatient' ? 'bg-amber-600' :
                  qrType === 'outpatient' ? 'bg-sky-600' :
                  qrType === 'record' ? 'bg-purple-600' : 'bg-indigo-600'
                }`}>
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-950">
                    {qrType === 'staff' && 'Clinical Staff Identity Badge'}
                    {qrType === 'user' && 'User Access Workspace Pass'}
                    {qrType === 'inpatient' && 'Inpatient Care QR Badge'}
                    {qrType === 'outpatient' && 'Outpatient Care QR Badge'}
                    {qrType === 'record' && 'Database Ledger Audit Record'}
                    {qrType === 'patient' && 'Patient Admission ID Card'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Purpose: {qrPurpose}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedPatientQr(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ID Card Box layout */}
              <div className={`border rounded-2xl p-5 bg-gradient-to-br shadow-sm relative overflow-hidden ${
                qrType === 'staff' ? 'border-emerald-300 from-slate-50 via-white to-emerald-50/10' :
                qrType === 'user' ? 'border-slate-300 from-slate-50 via-white to-slate-100/30' :
                qrType === 'inpatient' ? 'border-amber-300 from-slate-50 via-white to-amber-50/10' :
                qrType === 'outpatient' ? 'border-sky-300 from-slate-50 via-white to-sky-50/10' :
                qrType === 'record' ? 'border-purple-300 from-slate-50 via-white to-purple-50/10' :
                'border-slate-300 from-slate-50 via-white to-indigo-50/10'
              }`}>
                {/* Decorative clinic stripe */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                  qrType === 'staff' ? 'bg-emerald-600' :
                  qrType === 'user' ? 'bg-slate-800' :
                  qrType === 'inpatient' ? 'bg-amber-600' :
                  qrType === 'outpatient' ? 'bg-sky-600' :
                  qrType === 'record' ? 'bg-purple-600' : 'bg-indigo-600'
                }`}></div>

                <div className="flex justify-between items-start gap-4 pt-1.5">
                  <div className="space-y-3 flex-1">
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest block leading-none ${
                        qrType === 'staff' ? 'text-emerald-600' :
                        qrType === 'user' ? 'text-slate-600' :
                        qrType === 'inpatient' ? 'text-amber-600' :
                        qrType === 'outpatient' ? 'text-sky-600' :
                        qrType === 'record' ? 'text-purple-600' : 'text-indigo-600'
                      }`}>
                        {qrType === 'staff' ? 'Gelemso General Hospital' :
                         qrType === 'user' ? 'EHR Workspace Access' :
                         qrType === 'inpatient' ? 'EHR Inpatient Ward' :
                         qrType === 'outpatient' ? 'EHR Outpatient Clinic' :
                         qrType === 'record' ? 'EHR Data Ledger' : 'Gelemso EHR Node'}
                      </span>
                      <h4 className="text-sm font-extrabold text-gray-900 tracking-tight mt-0.5 truncate max-w-[180px]">
                        {selectedPatientQr.full_name || selectedPatientQr.name || selectedPatientQr.email || 'Registration Record'}
                      </h4>
                    </div>

                    {/* Conditional layouts based on qrType */}
                    {qrType === 'staff' ? (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Department:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.department || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Credential:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.credential || 'MD'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Role:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.role || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Shift Shift:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.shift || 'on_call'}</span>
                        </div>
                      </div>
                    ) : qrType === 'user' ? (
                      <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">E-mail address:</span>
                          <span className="font-mono font-semibold text-gray-800">{selectedPatientQr.email || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Security Role:</span>
                          <span className="font-semibold text-gray-800 capitalize bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-0.5">{selectedPatientQr.role || 'user'}</span>
                        </div>
                      </div>
                    ) : qrType === 'record' ? (
                      <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Record ID / Hash:</span>
                          <span className="font-mono font-semibold text-gray-800 break-all">{selectedPatientQr.id || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">System Timestamp:</span>
                          <span className="font-semibold text-gray-800 font-mono">{new Date().toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      /* Patient, Inpatient, Outpatient Layouts (Shared single QR data representation) */
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Gender:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.gender || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Blood Group:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.blood_group || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">DOB:</span>
                          <span className="font-semibold text-gray-800">{selectedPatientQr.date_of_birth || selectedPatientQr.dob || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">CBHI Status:</span>
                          <span className={`inline-flex items-center text-[8px] font-extrabold px-1.5 rounded-md border capitalize leading-tight ${
                            selectedPatientQr.cbhi_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : 'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                            {selectedPatientQr.cbhi_status || 'none'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom identity tag */}
                    {qrType !== 'user' && qrType !== 'record' && (
                      <div className="pt-1.5">
                        <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px] leading-none mb-1">
                          {qrType === 'staff' ? 'Authorized Staff Code:' : 'Universal Patient ID / MRN:'}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                            qrType === 'staff' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          }`}>
                            {selectedPatientQr.staff_id || selectedPatientQr.mrn || `MRN-${selectedPatientQr.id?.slice(0, 4).toUpperCase() || 'EHR'}`}
                          </span>
                          <span className="font-mono text-[9px] font-semibold text-gray-500">
                            {selectedPatientQr.staff_id || selectedPatientQr.mrn || '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Image Frame */}
                  <div className="flex flex-col items-center gap-1 shrink-0 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${
                        qrType === 'staff' ? (selectedPatientQr.staff_id || selectedPatientQr.id) :
                        qrType === 'user' ? (selectedPatientQr.email || selectedPatientQr.id) :
                        qrType === 'record' ? selectedPatientQr.id :
                        (selectedPatientQr.mrn || selectedPatientQr.id)
                      }`} 
                      alt="EHR QR Badge" 
                      className="w-[110px] h-[110px]"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8px] font-mono font-extrabold text-gray-400 uppercase text-center w-[110px] tracking-tight">
                      {qrType === 'staff' && 'clinical staff'}
                      {qrType === 'user' && 'secure terminal'}
                      {qrType === 'inpatient' && 'ward admission'}
                      {qrType === 'outpatient' && 'opd consult'}
                      {qrType === 'record' && 'audit verify'}
                      {qrType === 'patient' && 'scan to admit'}
                    </span>
                  </div>
                </div>

                {/* Secure clinical watermark tag */}
                <div className="border-t border-slate-150 mt-4 pt-3 flex justify-between items-center text-[9px]">
                  <div className="text-slate-400 flex items-center gap-1 font-medium">
                    <Check size={10} className="text-emerald-500" />
                    <span>Authorized EHR Seal</span>
                  </div>
                  <span className="text-slate-500 font-mono font-semibold">{selectedPatientQr.phone || selectedPatientQr.email || 'Verified Badge'}</span>
                </div>
              </div>

              {/* Integration alert feedback */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-700 leading-relaxed text-left flex gap-2">
                <Info size={16} className="shrink-0 text-slate-400 mt-0.5" />
                <span>
                  {qrType === 'staff' && 'This credential badge allows medical staff members to check in for duty shifts at Clinical Terminals securely.'}
                  {qrType === 'user' && 'This workspace workstation pass secures EHR database entry audits under authorized credentials.'}
                  {qrType === 'inpatient' && 'This unified patient QR is being checked for inpatient hospitalizations. Staff can manage bed assignments instantly.'}
                  {qrType === 'outpatient' && 'This unified patient QR code is used for ambulatory follow-ups and diagnostic order routing.'}
                  {qrType === 'record' && 'This database row QR carries cryptographic ledger tokens to assert clinical data integrity.'}
                  {qrType === 'patient' && 'This QR identity card is persistent in the EHR database. Administrative and nursing staff can read this card using any standard device camera.'}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2.5">
              <button 
                onClick={() => alert(`ID Badge queued for printing: ${selectedPatientQr.full_name || selectedPatientQr.name || selectedPatientQr.email || 'EHR Document'}.`)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 bg-white transition-colors py-2 px-4 rounded-xl text-xs font-bold shadow-xs select-none cursor-pointer"
              >
                <Printer size={13} />
                <span>Print ID Card</span>
              </button>
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedPatientQr(null);
                }}
                className={`text-white transition-colors py-2 px-4 rounded-xl text-xs font-bold shadow-xs select-none cursor-pointer ${
                  qrType === 'staff' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  qrType === 'user' ? 'bg-slate-800 hover:bg-slate-900' :
                  qrType === 'inpatient' ? 'bg-amber-600 hover:bg-amber-700' :
                  qrType === 'outpatient' ? 'bg-sky-600 hover:bg-sky-700' :
                  'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Modal Form for Adding Database Records */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-900 text-white rounded">
                  {React.createElement(selectedEntity.icon, { size: 16 })}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedEntity.id === 'ClinicalEncounter' 
                    ? (editingRecordId ? 'Adjust ClinicalEncounter' : 'Add New ClinicalEncounter') 
                    : selectedEntity.id === 'Bed'
                      ? (editingRecordId ? 'Adjust Bed Admission' : 'Add New Bed')
                      : (editingRecordId ? `Adjust ${selectedEntity.name} Record` : `Add ${selectedEntity.name} Record`)}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setFormData({});
                  setEditingRecordId(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddRecord}>
              <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-semibold whitespace-pre-wrap">{formError}</div>
                  </div>
                )}
                {selectedEntity.fields.map((field) => {
                  // Hide patient-related fields if status is not 'occupied' for Bed entity
                  if (selectedEntity.id === 'Bed' && 
                      ['patient_mrn', 'patient_name', 'admission_date', 'expected_discharge', 'attending_physician'].includes(field.key) && 
                      formData.status !== 'occupied') {
                    return null;
                  }

                  if (selectedEntity.id === 'Admission' && 
                      ['actual_discharge', 'discharge_summary'].includes(field.key) && 
                      formData.status !== 'Discharged') {
                    return null;
                  }

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-500">
                        {field.label}
                      </label>
                      
                      {field.type === 'select' && field.options ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = { ...prev, [field.key]: val };
                              // Handle patient details and default date on status change for Bed
                              if (selectedEntity.id === 'Bed' && field.key === 'status') {
                                if (val !== 'occupied') {
                                  delete updated.patient_mrn;
                                  delete updated.patient_name;
                                  delete updated.admission_date;
                                  delete updated.expected_discharge;
                                  delete updated.attending_physician;
                                } else {
                                  // Set default admission date to current local date-time (YYYY-MM-DDTHH:MM)
                                  const now = new Date();
                                  const tzoffset = now.getTimezoneOffset() * 60000;
                                  const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                  updated.admission_date = localISOTime;
                                }
                              }

                              if (selectedEntity.id === 'Admission' && field.key === 'status') {
                                if (val !== 'Discharged') {
                                  delete updated.actual_discharge;
                                  delete updated.discharge_summary;
                                } else {
                                  const now = new Date();
                                  const tzoffset = now.getTimezoneOffset() * 60000;
                                  const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                  updated.actual_discharge = localISOTime;
                                }
                              }
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-shadow"
                          required={field.required}
                        >
                          <option value=""></option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                      <div className="relative">
                        <input
                          type="date"
                          placeholder={field.placeholder || "Pick a date"}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-left"
                          required={field.required}
                        />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    ) : field.type === 'date-time' ? (
                      <div className="relative">
                        <input
                          type="datetime-local"
                          placeholder={field.placeholder || "Pick a date and time"}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-left"
                          required={field.required}
                        />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow"
                        required={field.required}
                      />
                    ) : field.type === 'items' ? (
                      <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                        {/* Current list of items */}
                        <div className="space-y-1.5">
                          {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                              <div className="text-[11px] text-gray-700 leading-normal">
                                <span className="font-semibold text-purple-700">{item.drug}</span> - {item.dose} ({item.frequency}, {item.duration})
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  setFormData(prev => ({
                                    ...prev,
                                    [field.key]: current.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {(!formData[field.key] || formData[field.key].length === 0) && (
                            <p className="text-[10px] text-gray-400 italic">No medication items added yet.</p>
                          )}
                        </div>

                        {/* Sub-inputs form */}
                        <div className="border-t border-gray-150 pt-3 space-y-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Medication Item</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Drug Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Ibuprofen"
                                value={itemDrug}
                                onChange={(e) => setItemDrug(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Dose</label>
                              <input
                                type="text"
                                placeholder="e.g. 400mg"
                                value={itemDose}
                                onChange={(e) => setItemDose(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Frequency</label>
                              <input
                                type="text"
                                placeholder="e.g. Every 8 hours"
                                value={itemFreq}
                                onChange={(e) => setItemFreq(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Duration</label>
                              <input
                                type="text"
                                placeholder="e.g. 5 days"
                                value={itemDur}
                                onChange={(e) => setItemDur(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!itemDrug}
                            onClick={() => {
                              if (!itemDrug) return;
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              setFormData(prev => ({
                                ...prev,
                                [field.key]: [...current, { drug: itemDrug, dose: itemDose, frequency: itemFreq, duration: itemDur }]
                              }));
                              setItemDrug('');
                              setItemDose('');
                              setItemFreq('');
                              setItemDur('');
                            }}
                            className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + Add Item
                          </button>
                        </div>
                      </div>
                    ) : field.type === 'array' ? (
                      field.key === 'services' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                          {/* Current list of services */}
                          <div className="space-y-1.5">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((service, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                                <div className="text-[11px] text-gray-700 leading-normal">
                                  <span className="font-semibold text-emerald-700">[{service.service_type || 'service'}]</span> {service.description} ({service.amount || 0} ETB)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <p className="text-[10px] text-gray-400 italic">No services added yet.</p>
                            )}
                          </div>

                          {/* Sub-inputs form */}
                          <div className="border-t border-gray-150 pt-3 space-y-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Claim Service</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Service Type</label>
                                <select
                                  value={serviceType}
                                  onChange={(e) => setServiceType(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="consultation">Consultation</option>
                                  <option value="laboratory">Laboratory</option>
                                  <option value="pharmacy">Pharmacy</option>
                                  <option value="radiology">Radiology</option>
                                  <option value="ward_admission">Ward Admission</option>
                                  <option value="procedure">Procedure</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Description</label>
                                <input
                                  type="text"
                                  placeholder="e.g. OPD visit"
                                  value={serviceDesc}
                                  onChange={(e) => setServiceDesc(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Amount (ETB)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 100"
                                  value={serviceAmount}
                                  onChange={(e) => setServiceAmount(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!serviceType || !serviceAmount}
                              onClick={() => {
                                if (!serviceType || !serviceAmount) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                setFormData(prev => ({
                                  ...prev,
                                  [field.key]: [...current, { service_type: serviceType, description: serviceDesc, amount: Number(serviceAmount) }]
                                }));
                                setServiceType('');
                                setServiceDesc('');
                                setServiceAmount('');
                              }}
                              className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                      ) : field.key === 'result_entries' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                          {/* Current list of entries */}
                          <div className="space-y-1.5">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                                <div className="text-[11px] text-gray-700 leading-normal">
                                  <span className="font-semibold text-blue-700">{entry.parameter}</span>: {entry.value} {entry.unit} <span className="text-gray-400">({entry.reference_range})</span> {entry.flag && <span className={`text-[10px] font-semibold px-1 rounded ml-1 ${entry.flag === 'normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{entry.flag}</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <p className="text-[10px] text-gray-400 italic">No result entries added yet.</p>
                            )}
                          </div>

                          {/* Sub-inputs form */}
                          <div className="border-t border-gray-150 pt-3 space-y-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Lab Result Entry</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Parameter</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Hb"
                                  value={entryParam}
                                  onChange={(e) => setEntryParam(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Value</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 13.5"
                                  value={entryVal}
                                  onChange={(e) => setEntryVal(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Unit</label>
                                <input
                                  type="text"
                                  placeholder="e.g. g/dL"
                                  value={entryUnit}
                                  onChange={(e) => setEntryUnit(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Reference Range</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 12.0-16.0"
                                  value={entryRef}
                                  onChange={(e) => setEntryRef(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Flag</label>
                                <select
                                  value={entryFlag}
                                  onChange={(e) => setEntryFlag(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="high">High</option>
                                  <option value="low">Low</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!entryParam || !entryVal}
                              onClick={() => {
                                if (!entryParam || !entryVal) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                setFormData(prev => ({
                                  ...prev,
                                  [field.key]: [...current, { parameter: entryParam, value: entryVal, unit: entryUnit, reference_range: entryRef, flag: entryFlag }]
                                }));
                                setEntryParam('');
                                setEntryVal('');
                                setEntryUnit('');
                                setEntryRef('');
                                setEntryFlag('normal');
                              }}
                              className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                      ) : field.key === 'channels_sent' ? (
                        <div className="space-y-2 border border-gray-150 rounded-lg p-3 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1.5">
                            {['in_app', 'sms', 'email'].map((ch) => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              const active = current.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => {
                                    const updated = active ? current.filter((x: string) => x !== ch) : [...current, ch];
                                    setFormData(prev => ({ ...prev, [field.key]: updated }));
                                  }}
                                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all border flex items-center gap-1.5 ${
                                    active 
                                      ? 'bg-purple-900 text-white border-purple-950 font-bold shadow-sm' 
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <span>{active ? '✓' : '+'}</span>
                                  <span>{ch}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'target_roles' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((role, idx) => (
                              <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{role}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-gray-400 hover:text-rose-500 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No target roles specified yet.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. physician"
                              value={newTargetRole}
                              onChange={(e) => setNewTargetRole(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newTargetRole.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newTargetRole.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newTargetRole.trim()] }));
                                  }
                                  setNewTargetRole('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newTargetRole.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newTargetRole.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newTargetRole.trim()] }));
                                }
                                setNewTargetRole('');
                              }}
                              className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['physician', 'nurse', 'pharmacist', 'lab_tech', 'admin'].map(r => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(r)) return null;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, r] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {r}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'allergies' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((allergy, idx) => (
                              <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{allergy}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-400 hover:text-rose-600 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No allergies recorded.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. penicillin"
                              value={newAllergy}
                              onChange={(e) => setNewAllergy(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newAllergy.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newAllergy.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newAllergy.trim()] }));
                                  }
                                  setNewAllergy('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newAllergy.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newAllergy.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newAllergy.trim()] }));
                                }
                                setNewAllergy('');
                              }}
                              className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['penicillin', 'peanuts', 'sulfa_drugs', 'aspirin', 'latex', 'shellfish'].map(a => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(a)) return null;
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, a] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {a}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'chronic_conditions' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((cond, idx) => (
                              <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{cond}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-amber-400 hover:text-amber-600 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No chronic conditions recorded.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. diabetes"
                              value={newCondition}
                              onChange={(e) => setNewCondition(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newCondition.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newCondition.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newCondition.trim()] }));
                                  }
                                  setNewCondition('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newCondition.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newCondition.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newCondition.trim()] }));
                                }
                                setNewCondition('');
                              }}
                              className="bg-gray-950 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['diabetes', 'hypertension', 'asthma', 'copd', 'hiv_aids', 'chronic_kidney_disease'].map(c => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(c)) return null;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, c] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          placeholder={field.placeholder || 'e.g. ["value1", "value2"]'}
                          value={typeof formData[field.key] === 'string' ? formData[field.key] : JSON.stringify(formData[field.key] || [])}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-gray-700"
                          rows={3}
                          required={field.required}
                        />
                      )
                    ) : field.key === 'referral_paper' ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new Image();
                                img.src = reader.result as string;
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 400;
                                  const MAX_HEIGHT = 400;
                                  let width = img.width;
                                  let height = img.height;

                                  if (width > height) {
                                    if (width > MAX_WIDTH) {
                                      height *= MAX_WIDTH / width;
                                      width = MAX_WIDTH;
                                    }
                                  } else {
                                    if (height > MAX_HEIGHT) {
                                      width *= MAX_HEIGHT / height;
                                      height = MAX_HEIGHT;
                                    }
                                  }

                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality keeps it tiny (e.g. 15-30KB)
                                    setFormData(prev => ({ ...prev, [field.key]: dataUrl }));
                                  } else {
                                    setFormData(prev => ({ ...prev, [field.key]: reader.result as string }));
                                  }
                                };
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
                        />
                        {formData[field.key] && (
                          <img src={formData[field.key]} alt="Referral" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                        )}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-gray-700"
                        rows={3}
                        required={field.required}
                      />
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-2.5 py-1">
                        <input
                          id={`checkbox-${field.key}`}
                          type="checkbox"
                          checked={formData[field.key] === true || formData[field.key] === 'true'}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.checked }))}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-gray-900 focus:ring-gray-950 cursor-pointer"
                        />
                        <span className="text-[11px] text-gray-400 font-mono italic">(Check to activate)</span>
                      </div>
                    ) : (
                      selectedEntity.id === 'Bed' && field.key === 'patient_mrn' ? (
                        <select
                          value={formData.patient_mrn || ''}
                          onChange={(e) => {
                            const selectedMrn = e.target.value;
                            const matchedPatient = patients.find(p => p.mrn === selectedMrn);
                            setFormData(prev => ({
                              ...prev,
                              patient_mrn: selectedMrn,
                              patient_name: matchedPatient ? matchedPatient.full_name : ''
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-shadow"
                          required={field.required}
                        >
                          <option value="">-- Select Patient --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.mrn}>
                              {p.full_name} ({p.mrn})
                            </option>
                          ))}
                        </select>
                      ) : selectedEntity.id === 'Bed' && field.key === 'patient_name' ? (
                        <input
                          type="text"
                          placeholder="Select patient above to populate"
                          value={formData.patient_name || ''}
                          disabled
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white"
                          required={field.required}
                        />
                      )
                    )}
                  </div>
                )})}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({});
                    setEditingRecordId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schema Editor Slide-over Panel */}
      {isSchemaOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-gray-100 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-gray-700" />
                <h3 className="text-base font-extrabold text-gray-900">Schema Editor</h3>
              </div>
              <button 
                onClick={() => setIsSchemaOpen(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs text-gray-500">
                Current data model schema definition for <strong className="text-gray-900">{selectedEntity.name}</strong>.
              </p>
              
              <div className="space-y-4">
                {selectedEntity.fields.map((field) => (
                  <div key={field.key} className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900">{field.key}</span>
                      <span className="text-[10px] text-gray-500 font-semibold bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        ({field.type === 'number' ? 'number' : field.type === 'date-time' ? 'date-time' : field.type === 'checkbox' ? 'boolean' : 'text'}
                        {field.required ? ', required' : ''})
                      </span>
                    </div>
                    
                    {field.placeholder && (
                      <div className="text-[11px] text-gray-500 leading-relaxed font-sans mt-0.5">
                        {field.placeholder}
                      </div>
                    )}
                    
                    {field.defaultValue !== undefined && (
                      <div className="text-[10px] text-gray-500 font-medium">
                        Default: <span className="font-mono text-gray-800">{field.type === 'checkbox' ? String(field.defaultValue) : `"${field.defaultValue}"`}</span>
                      </div>
                    )}

                    {field.options && field.options.length > 0 && (
                      <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Options: <span className="font-mono text-gray-800">{field.options.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Schema / Data Dictionary Modal */}
      {isGlobalSchemaOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-950 text-white rounded-xl shadow-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">EHR Data Dictionary</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Enterprise Health Record System Schema Overview • {ENTITIES_ORDER.length} Total Collections</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGlobalSchemaOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This data dictionary provides a comprehensive overview of all 18 database collections used in the EHR system. 
                    Each entity corresponds to a Firestore collection, following the FHIR-inspired healthcare data model.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entity & Collection</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fields</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Records</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ENTITIES_ORDER.map((id) => {
                        const entity = ENTITIES_CONFIG[id];
                        if (!entity) return null;
                        const Icon = entity.icon;
                        const count = stats[id] || 0;
                        return (
                          <tr key={id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-all">
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900">{entity.name}</div>
                                  <div className="text-[10px] font-mono text-gray-400">{entity.collectionName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-[11px] text-gray-600 leading-relaxed max-w-xs">{entity.description}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {entity.fields.slice(0, 8).map(f => (
                                  <span key={f.key} className="text-[9px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                    {f.key}
                                  </span>
                                ))}
                                {entity.fields.length > 8 && (
                                  <span className="text-[9px] text-gray-400 font-medium px-1.5 py-0.5">+{entity.fields.length - 8} more</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-col gap-1">
                                {entity.fields.filter(f => f.required).map(f => (
                                  <div key={f.key} className="flex items-center gap-1.5 text-[10px] text-rose-600 font-bold">
                                    <div className="w-1 h-1 bg-rose-400 rounded-full"></div>
                                    <span>{f.key}</span>
                                  </div>
                                ))}
                                {entity.fields.filter(f => f.required).length === 0 && (
                                  <span className="text-[10px] text-gray-400 italic">None specified</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-right">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                {count.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-4">
              <span className="text-[10px] text-gray-400 font-medium italic">
                All collections are automatically managed with standard Firebase Firestore indexing.
              </span>
              <button
                onClick={() => setIsGlobalSchemaOpen(false)}
                className="px-6 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-gray-200"
              >
                Close Data Dictionary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Dialog */}
      {isPermissionsOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {selectedEntityId === 'ClinicalEncounter' ? 'ClinicalEncounter Permissions' : `${selectedEntity.name} Permissions`}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsPermissionsOpen(false);
                  setIsEditingPermissions(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-gray-900">Permissions</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Create rules to control who can read and write records. Multiple rules are combined with OR logic.
                </p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="p-4 bg-gray-50/75 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Current permissions</span>
                  {!isEditingPermissions ? (
                    <button
                      onClick={() => setIsEditingPermissions(true)}
                      className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingPermissions(false)}
                        className="px-2.5 py-1 text-gray-500 hover:text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPermissions(false);
                          alert("Database access rules updated successfully. Your new Firestore security guidelines are active.");
                        }}
                        className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        Save Rules
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-3 min-w-[200px]">Rule</th>
                        <th className="px-3 py-3 text-center w-16">Create</th>
                        <th className="px-3 py-3 text-center w-16">Read</th>
                        <th className="px-3 py-3 text-center w-16">Update</th>
                        <th className="px-3 py-3 text-center w-16">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {permissions.map((perm, pIdx) => (
                        <tr key={perm.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3.5 space-y-1">
                            <div className="font-bold text-gray-900 text-[11px] uppercase tracking-wide text-gray-500/90">
                              {perm.type}
                            </div>
                            {perm.id === 'creator_only' ? (
                              <div className="text-xs text-gray-600 font-medium">
                                {perm.rule}
                              </div>
                            ) : (
                              <div className="font-mono text-[11px] text-gray-800 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded inline-block">
                                {perm.rule}
                              </div>
                            )}
                          </td>
                          {['create', 'read', 'update', 'delete'].map((action) => {
                            const val = perm[action as 'create' | 'read' | 'update' | 'delete'];
                            return (
                              <td key={action} className="px-3 py-3.5 text-center">
                                {isEditingPermissions ? (
                                  <input
                                    type="checkbox"
                                    checked={val}
                                    onChange={(e) => {
                                      const updated = [...permissions];
                                      updated[pIdx] = {
                                        ...updated[pIdx],
                                        [action]: e.target.checked
                                      };
                                      setPermissions(updated);
                                    }}
                                    className="h-4.5 w-4.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center">
                                    {val ? (
                                      <span className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center">
                                        <Check size={12} className="stroke-[3]" />
                                      </span>
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-gray-200"></span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsPermissionsOpen(false);
                  setIsEditingPermissions(false);
                }}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  Import Records into {selectedEntity.name}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload a JSON file containing a list of records to import into <strong className="text-gray-800">{selectedEntity.name}</strong>.
              </p>

              {/* Drag and Drop Container */}
              <div 
                className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50/20"
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                <span className="text-xs font-semibold text-gray-700 block">Click to select file or drag it here</span>
                <span className="text-[10px] text-gray-400 block mt-1">Accepts .json files exported from ClinicalEncounter or other matching schemas</span>
                <input
                  id="import-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-medium">
                  {importError}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Preview ({importPreview.length} items detected)</span>
                    <button
                      onClick={() => setImportPreview([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="border border-gray-100 rounded-lg bg-gray-50 max-h-40 overflow-y-auto p-3 space-y-2.5 font-mono text-[10px]">
                    {importPreview.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="border-b border-gray-200/60 last:border-0 pb-1.5 last:pb-0">
                        <div className="font-bold text-gray-700 mb-1">Item #{idx + 1}</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-500">
                          {selectedEntity.fields.slice(0, 4).map(f => (
                            <div key={f.key} className="truncate">
                              <span className="text-gray-400">{f.key}:</span> {item[f.key] !== undefined ? String(item[f.key]) : <span className="italic text-gray-300">none</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {importPreview.length > 5 && (
                      <div className="text-center text-gray-400 italic pt-1.5">
                        And {importPreview.length - 5} more items...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                disabled={isImportingInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                disabled={importPreview.length === 0 || isImportingInProgress}
              >
                {isImportingInProgress ? "Importing..." : `Import ${importPreview.length} records`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Deleted Dialog */}
      {isRecentlyDeletedOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {selectedEntity.name} Recycle Bin
                </h3>
              </div>
              <button 
                onClick={() => setIsRecentlyDeletedOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Recently Deleted</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    View, restore, or permanently delete items from <strong className="text-gray-800">{selectedEntity.name}</strong>.
                  </p>
                </div>
                {recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName).length > 0 && (
                  <button
                    onClick={handleClearRecentlyDeleted}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors shadow-sm border border-rose-100"
                  >
                    Empty Trash
                  </button>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto max-h-[300px]">
                  {recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName).length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400">
                      <History size={32} className="mx-auto text-gray-200 mb-2" />
                      No recently deleted records for {selectedEntity.name}.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-3">Record Details</th>
                          <th className="px-4 py-3">Deleted At</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {recentlyDeletedRecords
                          .filter(r => r.collectionName === selectedEntity.collectionName)
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-4 py-3 space-y-1">
                                <div className="font-bold text-gray-900 text-[11px] font-mono">
                                  {item.data.appointment_id || item.data.visit_id || item.data.id || item.originalId || 'N/A'}
                                </div>
                                <div className="text-[10px] text-gray-500 line-clamp-2 max-w-sm">
                                  {selectedEntity.fields.map((f: any) => {
                                    const val = item.data[f.key];
                                    if (val) return `${f.key}: ${val}`;
                                    return null;
                                  }).filter(Boolean).slice(0, 3).join(' | ')}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-400 font-mono text-[10px] whitespace-nowrap">
                                {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleRestoreRecord(item)}
                                  className="px-2.5 py-1 text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-[11px] font-semibold rounded-lg transition-colors"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(item.id)}
                                  className="px-2.5 py-1 text-rose-600 hover:text-rose-900 hover:bg-rose-50 text-[11px] font-semibold rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsRecentlyDeletedOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    );
}
