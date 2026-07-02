import React from 'react';
import { 
  Activity, Users, Pill, Calendar, FileText, Settings2, CreditCard, 
  Bell, TrendingUp, DollarSign, Heart, Package, Home, Shield, 
  Search, Plus, Trash2, Database, DatabaseZap, Info, X, ChevronRight, Check,
  Edit, SlidersHorizontal, MoreHorizontal, Upload, Download,
  QrCode, Printer, Bed, AlertTriangle, LogIn, Link2,
  Syringe, Scissors, List
} from 'lucide-react';

export interface EntityConfig {
  id: string;
  name: string;
  collectionName: string;
  icon: React.ComponentType<any>;
  subtitle: string;
  description: string;
  searchPlaceholder?: string;
  fields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'select' | 'date' | 'date-time' | 'items' | 'textarea' | 'checkbox' | 'array';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    defaultValue?: string;
  }[];
  defaultSeed: Record<string, any>[];
}

// --- Package 1: ADT (10) ---
// --- Package 2: Providers (10) ---
// --- Package 3: EMR (9) ---
// --- Package 4: Orders (7) ---
// --- Package 5: Pharmacy (9) ---
// --- Package 6: Lab (9) ---
// --- Package 7: Imaging (9) ---
// --- Package 8: Nursing/Bed (10) ---
// --- Package 9: ED (6) ---
// --- Package 10: Surgery (9) ---
// --- Package 11: RCMR (12) ---
// --- Package 12: Inventory (9) ---
// --- Package 13: HR (10) ---
// --- Package 14: Quality/Safety (8) ---
// --- Package 15: Audit/Master (10) ---

export const ENTITIES_CONFIG: Record<string, EntityConfig> = {
  ClinicalEncounter: {
    id: 'ClinicalEncounter',
    name: 'ClinicalEncounter',
    collectionName: 'clinical_encounters',
    icon: FileText,
    subtitle: 'Clinical encounters and diagnostics',
    description: 'A record of a patient\'s clinical encounter with a healthcare provider, symptoms, and diagnoses.',
    searchPlaceholder: 'Search by visit_id, patient_mrn, patient_name, chief_complaint, soap_subjective, soap_objective, soap_assessment, soap_plan, vitals_bp, diagnosis_icd10, diagnosis_text, attending_clinician',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VIS-9923' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'encounter_type', label: 'encounter_type*', type: 'select', options: ['opd', 'ipd', 'emergency', 'referral', 'follow_up'], required: true },
      { 
        key: 'clinic', 
        label: 'clinic', 
        type: 'select', 
        options: [
          'general_opd', 'art_hiv', 'tb_clinic', 'diabetes_hypertension', 'family_planning', 
          'epi_immunization', 'dental', 'ophthalmology', 'psychiatric', 'antenatal', 
          'labor_delivery', 'neonatal_nicu', 'pediatric', 'medical_ward', 'surgical_ward', 
          'gynecology', 'icu', 'operating_room', 'referral_clinic', 'triage_emergency'
        ] 
      },
      { key: 'chief_complaint', label: 'chief_complaint', type: 'string', placeholder: 'e.g. Chronic back pain' },
      { key: 'soap_subjective', label: 'soap_subjective', type: 'string', placeholder: 'Subjective clinical description' },
      { key: 'soap_objective', label: 'soap_objective', type: 'string', placeholder: 'Objective observations & vitals' },
      { key: 'soap_assessment', label: 'soap_assessment', type: 'string', placeholder: 'Assessment & initial impressions' },
      { key: 'soap_plan', label: 'soap_plan', type: 'string', placeholder: 'Treatment plan details' },
      { key: 'vitals_bp', label: 'vitals_bp', type: 'string', placeholder: 'e.g. 120/80' },
      { key: 'vitals_pulse', label: 'vitals_pulse', type: 'number', placeholder: 'e.g. 72' },
      { key: 'vitals_temp', label: 'vitals_temp', type: 'number', placeholder: 'e.g. 36.8' },
      { key: 'vitals_spo2', label: 'vitals_spo2', type: 'number', placeholder: 'e.g. 98' },
      { key: 'vitals_respiratory_rate', label: 'vitals_respiratory_rate', type: 'number', placeholder: 'e.g. 16' },
      { key: 'vitals_weight', label: 'vitals_weight', type: 'number', placeholder: 'e.g. 68' },
      { key: 'diagnosis_icd10', label: 'diagnosis_icd10', type: 'string', placeholder: 'e.g. M54.5' },
      { key: 'diagnosis_text', label: 'diagnosis_text', type: 'string', placeholder: 'e.g. Low back pain, unspecified' },
      { key: 'attending_clinician', label: 'attending_clinician', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'encounter_date', label: 'encounter_date', type: 'date-time', placeholder: 'Pick a date' },
      { key: 'status', label: 'status', type: 'select', options: ['open', 'in_progress', 'awaiting_results', 'discharged', 'closed'], defaultValue: 'open', required: true },
      { key: 'priority', label: 'priority', type: 'select', options: ['routine', 'urgent', 'critical', 'trauma'], defaultValue: 'routine', required: true }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        visit_id: 'VIS-9912',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        encounter_type: 'opd',
        clinic: 'general_opd',
        chief_complaint: 'Severe migraine and fatigue',
        soap_subjective: 'Patient reports persistent headache for 3 days, accompanied by nausea.',
        soap_objective: 'BP: 120/80, HR: 72, Temp: 37C. Neuro exam intact.',
        soap_assessment: 'Migraine, Tension-Type',
        soap_plan: 'Prescribed hydration therapy, rest, and ibuprofen.',
        vitals_bp: '120/80',
        vitals_pulse: 72,
        vitals_temp: 37,
        vitals_spo2: 99,
        vitals_respiratory_rate: 16,
        vitals_weight: 75,
        diagnosis_icd10: 'G43.90',
        diagnosis_text: 'Migraine, unspecified, not intractable',
        attending_clinician: 'Dr. Solomon Bedaso',
        encounter_date: '2026-06-22T10:30',
        status: 'open',
        priority: 'routine'
      },
      {
        hospital_id: 'HSP-001',
        visit_id: 'VIS-9923',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        encounter_type: 'follow_up',
        clinic: 'antenatal',
        chief_complaint: 'Routine pregnancy checkup',
        soap_subjective: 'Feels well, active fetal movements felt.',
        soap_objective: 'BP: 110/70, Temp: 36.8C. Fundal height matches dates.',
        soap_assessment: 'Normal pregnancy at 24 weeks gestation',
        soap_plan: 'Continue prenatal vitamins, schedule ultrasound.',
        vitals_bp: '110/70',
        vitals_pulse: 78,
        vitals_temp: 36.8,
        vitals_spo2: 98,
        vitals_respiratory_rate: 18,
        vitals_weight: 68,
        diagnosis_icd10: 'Z34.90',
        diagnosis_text: 'Supervision of normal pregnancy, unspecified',
        attending_clinician: 'Dr. Solomon Bedaso',
        encounter_date: '2026-06-23T11:00',
        status: 'open',
        priority: 'routine'
      }
    ]
  },
  Staff: {
    id: 'Staff',
    name: 'Staff',
    collectionName: 'staff',
    icon: Shield,
    subtitle: 'Hospital team and consultants',
    description: 'Authorized medical personnel, specialist doctors, and nurses of Gelemso Hospital.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'staff_id', label: 'staff_id', type: 'string', placeholder: 'e.g. STF-002' },
      { key: 'full_name', label: 'full_name*', type: 'string', placeholder: 'e.g. Dr. Teshome Bekele', required: true },
      { key: 'department', label: 'department*', type: 'select', options: ['medical', 'nursing', 'pharmacy', 'laboratory', 'radiology', 'administration', 'logistics', 'maintenance', 'finance', 'him'], required: true },
      { key: 'role', label: 'role*', type: 'string', placeholder: 'e.g. Physician, Nurse, Pharmacist, Lab Tech, CEO', required: true },
      { key: 'credential', label: 'credential', type: 'string', placeholder: 'e.g. MD, BSN, PharmD' },
      { key: 'phone', label: 'phone', type: 'string', placeholder: 'e.g. +251-911-234567' },
      { key: 'email', label: 'email', type: 'string', placeholder: 'e.g. doctor@gelemso.org' },
      { key: 'shift', label: 'shift', type: 'select', options: ['morning', 'afternoon', 'night', 'on_call', 'off'] },
      { key: 'status', label: 'status', type: 'select', options: ['active', 'on_leave', 'terminated'], defaultValue: 'active' },
      { key: 'last_check_in', label: 'last_check_in', type: 'date-time', placeholder: 'Pick a date and time' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', staff_id: 'STF-002', full_name: 'Dr. Teshome Bekele', department: 'medical', role: 'Surgeon', credential: 'MD, FACS', phone: '+251-911-000102', email: 'teshome@gelemso.org', shift: 'morning', status: 'active', last_check_in: '2026-06-23T08:00' },
      { hospital_id: 'HSP-001', staff_id: 'STF-003', full_name: 'Ns. Hanna Girma', department: 'nursing', role: 'Head Nurse - ICU', credential: 'BSN', phone: '+251-911-000103', email: 'hanna@gelemso.org', shift: 'night', status: 'active', last_check_in: '2026-06-23T19:30' },
      { hospital_id: 'HSP-001', staff_id: 'STF-004', full_name: 'Ns. Yonas Fikru', department: 'nursing', role: 'Staff Nurse', credential: 'BSN', phone: '+251-911-000104', email: 'yonas@gelemso.org', shift: 'afternoon', status: 'active', last_check_in: '2026-06-22T14:00' },
      { hospital_id: 'HSP-001', staff_id: 'STF-005', full_name: 'Ph. Sara Wolde', department: 'pharmacy', role: 'Chief Pharmacist', credential: 'PharmD', phone: '+251-911-000105', email: 'sara@gelemso.org', shift: 'morning', status: 'active', last_check_in: '2026-06-23T08:15' },
      { hospital_id: 'HSP-001', staff_id: 'STF-006', full_name: 'Lab Tech. Dawit Tesfaye', department: 'laboratory', role: 'Hematology Technician', credential: 'BSc MLT', phone: '+251-911-000106', email: 'dawit@gelemso.org', shift: 'on_call', status: 'active', last_check_in: '2026-06-21T09:00' }
    ]
  },
  Prescription: {
    id: 'Prescription',
    name: 'Prescription',
    collectionName: 'prescriptions',
    icon: Pill,
    subtitle: 'Medication and pharmacy orders',
    description: 'Active prescriptions and pharmacological regimens issued to registered patients.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'rx_id', label: 'rx_id', type: 'string', placeholder: 'e.g. RX-2049' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VST-8812' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'prescribed_by', label: 'prescribed_by*', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso', required: true },
      { key: 'prescribed_at', label: 'prescribed_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'items', label: 'items', type: 'items', placeholder: 'List of medication line items (drug, dose, frequency, duration)' },
      { key: 'diagnosis_text', label: 'diagnosis_text', type: 'string', placeholder: 'e.g. Severe headache' },
      { key: 'notes', label: 'notes', type: 'textarea', placeholder: 'e.g. Take after meals, plenty of water.' },
      { key: 'status', label: 'status', type: 'select', options: ['pending', 'dispensed', 'partially_dispensed', 'cancelled'], defaultValue: 'pending' },
      { key: 'dispensed_by', label: 'dispensed_by', type: 'string', placeholder: 'e.g. Ph. Sara Wolde' },
      { key: 'dispensed_at', label: 'dispensed_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'payer_method', label: 'payer_method', type: 'select', options: ['cash', 'cbhi_insurance', 'waiver', 'telebirr', 'cbe_birr'], defaultValue: 'cash' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        rx_id: 'RX-001',
        visit_id: 'VST-101',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        prescribed_by: 'Dr. Solomon Bedaso',
        prescribed_at: '2026-06-22T10:30',
        items: [
          { drug: 'Ibuprofen', dose: '400mg', frequency: 'Every 8 hours', duration: '5 days' }
        ],
        diagnosis_text: 'Mild joint pain and inflammation',
        notes: 'Take after meals',
        status: 'pending',
        dispensed_by: '',
        dispensed_at: '',
        payer_method: 'cash'
      },
      {
        hospital_id: 'HSP-001',
        rx_id: 'RX-002',
        visit_id: 'VST-102',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        prescribed_by: 'Dr. Solomon Bedaso',
        prescribed_at: '2026-06-23T11:00',
        items: [
          { drug: 'Prenatal Vitamins', dose: '1 capsule', frequency: 'Once daily', duration: '90 days' }
        ],
        diagnosis_text: 'Routine pregnancy follow up',
        notes: 'Keep in dry cool place',
        status: 'dispensed',
        dispensed_by: 'Ph. Sara Wolde',
        dispensed_at: '2026-06-23T12:00',
        payer_method: 'cbhi_insurance'
      }
    ]
  },
  Appointment: {
    id: 'Appointment',
    name: 'Appointment',
    collectionName: 'appointments',
    icon: Calendar,
    subtitle: 'Consultation schedules',
    description: 'Scheduled visits and consultations across different outpatient departments.',
    searchPlaceholder: 'Search by appointment_id, patient_mrn, patient_name, visit_id, attending_clinician, reason, notes',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'appointment_id', label: 'appointment_id', type: 'string', placeholder: 'e.g. GGH-2026-047822' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. Mulu Bekele' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VST-2049' },
      { key: 'clinic', label: 'clinic*', type: 'select', options: ['general_opd', 'art_hiv', 'tb_clinic', 'diabetes_hypertension', 'family_planning', 'dental', 'ophthalmology', 'psychiatric', 'antenatal', 'pediatric', 'surgical_ward', 'radiology'], required: true },
      { key: 'appointment_type', label: 'appointment_type', type: 'select', options: ['new', 'follow_up', 'procedure', 'review', 'emergency'], defaultValue: 'new' },
      { key: 'scheduled_at', label: 'scheduled_at*', type: 'date-time', placeholder: 'Pick a date', required: true },
      { key: 'duration_minutes', label: 'duration_minutes', type: 'number', placeholder: '30', defaultValue: '30' },
      { key: 'attending_clinician', label: 'attending_clinician', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'reason', label: 'reason', type: 'string', placeholder: 'e.g. Routine checkup' },
      { key: 'notes', label: 'notes', type: 'textarea', placeholder: 'e.g. Patient requests morning slot.' },
      { key: 'status', label: 'status', type: 'select', options: ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'], defaultValue: 'scheduled' },
      { key: 'reminder_sent', label: 'reminder_sent', type: 'checkbox', defaultValue: 'false' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', appointment_id: 'GGH-2026-047822', patient_mrn: 'MRN-2026-9912', patient_name: 'Mulu Bekele', visit_id: 'VST-2049', clinic: 'antenatal', appointment_type: 'new', scheduled_at: '2026-06-25T09:00', duration_minutes: 30, attending_clinician: 'Dr. Solomon Bedaso', reason: 'Routine pregnancy follow up', notes: '', status: 'scheduled', reminder_sent: false },
      { hospital_id: 'HSP-001', appointment_id: 'GGH-2026-047823', patient_mrn: 'MRN-2026-8823', patient_name: 'Sara Hailu', visit_id: 'VST-2050', clinic: 'diabetes_hypertension', appointment_type: 'follow_up', scheduled_at: '2026-06-26T10:00', duration_minutes: 20, attending_clinician: 'Dr. Solomon Bedaso', reason: 'Blood pressure review', notes: '', status: 'scheduled', reminder_sent: false }
    ]
  },
  LabResult: {
    id: 'LabResult',
    name: 'LabResult',
    collectionName: 'lab_results',
    icon: FileText,
    subtitle: 'Laboratory reports and panels',
    description: 'Blood panels, pathology results, and diagnostic tests completed in the central lab.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'result_id', label: 'result_id', type: 'string', placeholder: 'e.g. LAB-0041' },
      { key: 'diagnostic_id', label: 'diagnostic_id', type: 'string', placeholder: 'e.g. TST-2026-0001' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VIS-9923' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'test_type', label: 'test_type*', type: 'string', placeholder: 'e.g. Complete Blood Count', required: true },
      { key: 'panel', label: 'panel*', type: 'select', options: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'urinalysis', 'cd4_vl', 'coagulation', 'hormones', 'radiology_report', 'other'], required: true },
      { key: 'result_entries', label: 'result_entries (array)', type: 'array', placeholder: 'Enter array of entries e.g. [{"parameter": "Hb", "value": "13.5", "unit": "g/dL", "reference_range": "12.0-16.0", "flag": "normal"}]' },
      { key: 'summary_text', label: 'summary_text', type: 'textarea', placeholder: 'Summary of the lab report' },
      { key: 'is_critical', label: 'is_critical', type: 'checkbox', defaultValue: 'false' },
      { key: 'critical_flag_reason', label: 'critical_flag_reason', type: 'string', placeholder: 'Why was this marked critical' },
      { key: 'resulted_by', label: 'resulted_by', type: 'string', placeholder: 'e.g. Lab Tech Kenenisa' },
      { key: 'resulted_at', label: 'resulted_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'verified_by', label: 'verified_by', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'verified_at', label: 'verified_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'status', label: 'status', type: 'select', options: ['preliminary', 'final', 'amended', 'cancelled'], defaultValue: 'preliminary' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        result_id: 'LAB-0041',
        diagnostic_id: 'TST-2026-0001',
        visit_id: 'VIS-9912',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        test_type: 'Complete Blood Count (CBC)',
        panel: 'hematology',
        result_entries: [
          { parameter: 'Hb', value: '14.2', unit: 'g/dL', reference_range: '13.5-17.5', flag: 'normal' },
          { parameter: 'WBC', value: '6.5', unit: '10^3/uL', reference_range: '4.5-11.0', flag: 'normal' }
        ],
        summary_text: 'Complete blood count is within normal references.',
        is_critical: false,
        critical_flag_reason: '',
        resulted_by: 'Lab Tech Kenenisa',
        resulted_at: '2026-06-22T14:30',
        verified_by: 'Dr. Solomon Bedaso',
        verified_at: '2026-06-22T15:00',
        status: 'final'
      },
      {
        hospital_id: 'HSP-001',
        result_id: 'LAB-0042',
        diagnostic_id: 'TST-2026-0002',
        visit_id: 'VIS-9923',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        test_type: 'Fasting Blood Glucose',
        panel: 'biochemistry',
        result_entries: [
          { parameter: 'Glucose', value: '92', unit: 'mg/dL', reference_range: '70-100', flag: 'normal' }
        ],
        summary_text: 'Fasting glucose levels are normal.',
        is_critical: false,
        critical_flag_reason: '',
        resulted_by: 'Lab Tech Kenenisa',
        resulted_at: '2026-06-23T11:00',
        verified_by: 'Dr. Solomon Bedaso',
        verified_at: '2026-06-23T12:00',
        status: 'final'
      }
    ]
  },
  NotificationPreference: {
    id: 'NotificationPreference',
    name: 'NotificationPreference',
    collectionName: 'notification_preferences',
    icon: Settings2,
    subtitle: 'User alert configurations',
    description: 'Communication methods and dispatch alerts selected by users or clinical patients.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'role', label: 'role*', type: 'select', options: ['physician', 'nurse', 'pharmacist', 'lab_tech', 'admin'], required: true },
      { key: 'alert_type', label: 'alert_type*', type: 'select', options: ['critical_lab', 'critical_vital', 'critical_imaging', 'medication_alert', 'patient_deterioration', 'or_schedule', 'trauma_incoming', 'cbhi_alert', 'system'], required: true },
      { key: 'in_app', label: 'in_app', type: 'checkbox', defaultValue: 'true' },
      { key: 'sms', label: 'sms', type: 'checkbox', defaultValue: 'false' },
      { key: 'email', label: 'email', type: 'checkbox', defaultValue: 'false' },
      { key: 'min_severity', label: 'min_severity', type: 'select', options: ['critical', 'warning', 'info'], defaultValue: 'critical' },
      { key: 'enabled', label: 'enabled', type: 'checkbox', defaultValue: 'true' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', role: 'physician', alert_type: 'critical_lab', in_app: true, sms: true, email: false, min_severity: 'critical', enabled: true },
      { hospital_id: 'HSP-001', role: 'nurse', alert_type: 'patient_deterioration', in_app: true, sms: true, email: false, min_severity: 'warning', enabled: true }
    ]
  },
  InsuranceClaim: {
    id: 'InsuranceClaim',
    name: 'InsuranceClaim',
    collectionName: 'insurance_claims',
    icon: CreditCard,
    subtitle: 'Insurance and health coverage bills',
    description: 'Reimbursement invoices and diagnostic claims dispatched to external schemes.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'claim_id', label: 'claim_id', type: 'string', placeholder: 'e.g. CLM-992384' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VIS-9912' },
      { key: 'cbhi_id', label: 'cbhi_id', type: 'string', placeholder: 'e.g. CBHI-004812' },
      { key: 'insurer', label: 'insurer*', type: 'select', options: ['cbhi', 'private', 'ngo', 'government'], defaultValue: 'cbhi', required: true },
      { key: 'claim_date', label: 'claim_date*', type: 'date', placeholder: 'Pick a date', required: true },
      { key: 'services', label: 'services (array)', type: 'array', placeholder: 'e.g. [{"service_type": "consultation", "description": "OPD visit", "amount": 100}]' },
      { key: 'total_amount', label: 'total_amount', type: 'number', placeholder: 'e.g. 150' },
      { key: 'approved_amount', label: 'approved_amount', type: 'number', placeholder: 'e.g. 150' },
      { key: 'rejection_reason', label: 'rejection_reason', type: 'string', placeholder: 'Reason for rejection' },
      { key: 'submitted_at', label: 'submitted_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'processed_at', label: 'processed_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'reimbursed_at', label: 'reimbursed_at', type: 'date', placeholder: 'Pick a date' },
      { key: 'submitted_by', label: 'submitted_by', type: 'string', placeholder: 'e.g. Accountant Abebe' },
      { key: 'status', label: 'status', type: 'select', options: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'reimbursed', 'appealed'], defaultValue: 'draft' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        claim_id: 'CLM-0012',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        visit_id: 'VIS-9912',
        cbhi_id: 'CBHI-004812',
        insurer: 'cbhi',
        claim_date: '2026-06-22',
        services: [
          { service_type: 'consultation', description: 'OPD consultation', amount: 120 }
        ],
        total_amount: 120,
        approved_amount: 120,
        rejection_reason: '',
        submitted_at: '2026-06-22T16:00',
        processed_at: '2026-06-23T10:00',
        reimbursed_at: '2026-06-24',
        submitted_by: 'Accountant Abebe',
        status: 'approved'
      },
      {
        hospital_id: 'HSP-001',
        claim_id: 'CLM-0013',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        visit_id: 'VIS-9923',
        cbhi_id: '',
        insurer: 'private',
        claim_date: '2026-06-23',
        services: [
          { service_type: 'consultation', description: 'OB/GYN visit', amount: 200 },
          { service_type: 'laboratory', description: 'Glucose test', amount: 50 }
        ],
        total_amount: 250,
        approved_amount: 0,
        rejection_reason: '',
        submitted_at: '2026-06-23T15:00',
        processed_at: '',
        reimbursed_at: '',
        submitted_by: 'Accountant Abebe',
        status: 'submitted'
      }
    ]
  },
  Notification: {
    id: 'Notification',
    name: 'Notification',
    collectionName: 'notifications',
    icon: Bell,
    subtitle: 'System alerts and patient SMS logs',
    description: 'Logs of notifications generated by clinical actions, reminders, and patient updates.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'type', label: 'type*', type: 'select', options: ['critical_lab', 'critical_vital', 'critical_imaging', 'medication_alert', 'patient_deterioration', 'or_schedule', 'trauma_incoming', 'cbhi_alert', 'system'], required: true },
      { key: 'severity', label: 'severity*', type: 'select', options: ['critical', 'warning', 'info'], defaultValue: 'info', required: true },
      { key: 'title', label: 'title*', type: 'string', placeholder: 'e.g. Critical Lab Alert', required: true },
      { key: 'message', label: 'message*', type: 'textarea', placeholder: 'Message body details', required: true },
      { key: 'patient_mrn', label: 'patient_mrn', type: 'string', placeholder: 'e.g. MRN-2026-9912' },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VIS-9912' },
      { key: 'journey_stage', label: 'journey_stage', type: 'select', options: ['referral', 'triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'operating_room', 'ward_admission', 'ward_transfer', 'discharge', 'none'], defaultValue: 'none' },
      { key: 'ward', label: 'ward', type: 'string', placeholder: 'e.g. Emergency Ward' },
      { key: 'triggered_by', label: 'triggered_by', type: 'string', placeholder: 'e.g. System' },
      { key: 'channels_sent', label: 'channels_sent (array)', type: 'array', placeholder: 'e.g. ["sms", "in_app"]' },
      { key: 'target_roles', label: 'target_roles (array)', type: 'array', placeholder: 'e.g. ["physician", "nurse"]' },
      { key: 'is_read', label: 'is_read', type: 'checkbox', defaultValue: 'false' },
      { key: 'is_acknowledged', label: 'is_acknowledged', type: 'checkbox', defaultValue: 'false' },
      { key: 'acknowledged_by', label: 'acknowledged_by', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'acknowledged_at', label: 'acknowledged_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'event_time', label: 'event_time', type: 'date-time', placeholder: 'Pick a date and time' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        type: 'critical_lab',
        severity: 'critical',
        title: 'Critical Haemoglobin Alert',
        message: 'Patient GEMECHU AHMED Hb is 6.8 g/dL (Critical Low). immediate action recommended.',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        visit_id: 'VIS-9912',
        journey_stage: 'laboratory',
        ward: 'Emergency Ward',
        triggered_by: 'System',
        channels_sent: ['sms', 'in_app'],
        target_roles: ['physician', 'nurse'],
        is_read: false,
        is_acknowledged: false,
        acknowledged_by: '',
        acknowledged_at: '',
        event_time: '2026-06-22T14:45'
      },
      {
        hospital_id: 'HSP-001',
        type: 'system',
        severity: 'info',
        title: 'New Patient Registered',
        message: 'Patient monetumar22 has been successfully registered.',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        visit_id: 'VIS-9923',
        journey_stage: 'none',
        ward: '',
        triggered_by: 'Registration Desk',
        channels_sent: ['in_app'],
        target_roles: ['admin'],
        is_read: true,
        is_acknowledged: false,
        acknowledged_by: '',
        acknowledged_at: '',
        event_time: '2026-06-23T10:00'
      }
    ]
  },
  PatientJourneyEvent: {
    id: 'PatientJourneyEvent',
    name: 'PatientJourneyEvent',
    collectionName: 'patient_journey_events',
    icon: TrendingUp,
    subtitle: 'EHR journey timeline tracking',
    description: 'Clinical timeline events recording transfers, triage updates, admissions, and discharges.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VIS-9912' },
      { key: 'stage', label: 'stage*', type: 'select', options: ['referral', 'registration', 'triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'operating_room', 'ward_admission', 'ward_transfer', 'discharge'], required: true },
      { key: 'stage_label', label: 'stage_label', type: 'string', placeholder: 'e.g. Registration Complete' },
      { key: 'location', label: 'location', type: 'string', placeholder: 'e.g. Triage Station A' },
      { key: 'handled_by', label: 'handled_by', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'notes', label: 'notes', type: 'textarea', placeholder: 'Event notes' },
      { key: 'event_time', label: 'event_time', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'duration_minutes', label: 'duration_minutes', type: 'number', placeholder: 'e.g. 15' },
      { key: 'status', label: 'status', type: 'select', options: ['completed', 'in_progress', 'pending'], defaultValue: 'completed' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', patient_mrn: 'MRN-2026-9912', patient_name: 'GEMECHU AHMED', visit_id: 'VIS-9912', stage: 'triage', stage_label: 'Emergency Triage', location: 'Triage Room 1', handled_by: 'Nurse Hanna Girma', notes: 'Assigned triage level 3 (Yellow). Directed to consulting physician.', event_time: '2026-06-22T08:15', duration_minutes: 15, status: 'completed' },
      { hospital_id: 'HSP-001', patient_mrn: 'MRN-2026-8823', patient_name: 'monetumar22', visit_id: 'VIS-9923', stage: 'registration', stage_label: 'New Patient Registration', location: 'Front Desk', handled_by: 'Admin Staff', notes: 'New chart created, insurance confirmed.', event_time: '2026-06-23T10:00', duration_minutes: 10, status: 'completed' }
    ]
  },
  FinancialLedger: {
    id: 'FinancialLedger',
    name: 'FinancialLedger',
    collectionName: 'financial_ledger',
    icon: DollarSign,
    subtitle: 'Hospital budget ledger',
    description: 'Transaction logs tracking operational cashflows, supplies procurements, and consultations revenue.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'tx_id', label: 'tx_id', type: 'string', placeholder: 'e.g. TX-992384' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'service_type', label: 'service_type*', type: 'select', options: ['consultation', 'laboratory', 'radiology', 'pharmacy', 'ward_stay', 'surgery', 'procedure', 'other'], required: true },
      { key: 'description', label: 'description', type: 'string', placeholder: 'OPD Consultation fee' },
      { key: 'amount', label: 'amount*', type: 'number', placeholder: 'e.g. 120', required: true },
      { key: 'payer_method', label: 'payer_method', type: 'select', options: ['cash', 'telebirr', 'cbe_birr', 'cbhi_insurance', 'waiver', 'pending'] },
      { key: 'cbhi_claim_status', label: 'cbhi_claim_status', type: 'select', options: ['not_applicable', 'pending', 'submitted', 'approved', 'rejected', 'reimbursed'], defaultValue: 'not_applicable' },
      { key: 'tx_date', label: 'tx_date', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'cashier', label: 'cashier', type: 'string', placeholder: 'e.g. Cashier Aster' },
      { key: 'status', label: 'status', type: 'select', options: ['paid', 'pending', 'refunded', 'cancelled'], defaultValue: 'pending' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', tx_id: 'TX-0012', patient_mrn: 'MRN-2026-9912', patient_name: 'GEMECHU AHMED', service_type: 'consultation', description: 'OPD consultation fee', amount: 120, payer_method: 'cbhi_insurance', cbhi_claim_status: 'approved', tx_date: '2026-06-22T10:00', cashier: 'Aster', status: 'paid' },
      { hospital_id: 'HSP-001', tx_id: 'TX-0013', patient_mrn: 'MRN-2026-8823', patient_name: 'monetumar22', service_type: 'consultation', description: 'Antenatal clinic fee', amount: 200, payer_method: 'cash', cbhi_claim_status: 'not_applicable', tx_date: '2026-06-23T11:00', cashier: 'Aster', status: 'paid' }
    ]
  },
  Patient: {
    id: 'Patient',
    name: 'Patient',
    collectionName: 'patients',
    icon: Heart,
    subtitle: 'Patient demography and contacts',
    description: 'Secure, medical registration charts containing contact numbers and MRN tags.',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'mrn', label: 'MRN*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'full_name', label: 'Full Name*', type: 'string', placeholder: 'e.g. GEMECHU AHMED', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', placeholder: 'Pick a date' },
      { key: 'phone', label: 'Phone', type: 'string', placeholder: 'e.g. +251-912-345678' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', mrn: 'MRN-2026-9912', full_name: 'GEMECHU AHMED', dob: '1995-08-12', phone: '+251-912-345678' }
    ]
  },
  SupplyItem: {
    id: 'SupplyItem',
    name: 'SupplyItem',
    collectionName: 'supply_items',
    icon: Package,
    subtitle: 'Clinical inventory and PPE',
    description: 'Clinic supplies stock tracking, including syringes, medications, surgical masks, and gloves.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'item_code', label: 'item_code', type: 'string', placeholder: 'e.g. SYR-0021' },
      { key: 'name', label: 'name*', type: 'string', placeholder: 'e.g. Disposable Syringes 5ml', required: true },
      { key: 'category', label: 'category*', type: 'select', options: ['drug', 'consumable', 'equipment', 'furniture', 'linen', 'reagent'], required: true },
      { key: 'location', label: 'location*', type: 'select', options: ['drug_store_bulk', 'central_store', 'pharmacy', 'ward_stock', 'lab_stock', 'or_stock'], required: true },
      { key: 'batch_no', label: 'batch_no', type: 'string', placeholder: 'e.g. BAT-2026-X' },
      { key: 'expiry_date', label: 'expiry_date', type: 'date', placeholder: 'Pick a date' },
      { key: 'qty_on_hand', label: 'qty_on_hand', type: 'number', placeholder: 'e.g. 4500', defaultValue: '0' },
      { key: 'unit', label: 'unit', type: 'string', placeholder: 'e.g. tablet, vial, box, piece' },
      { key: 'reorder_level', label: 'reorder_level', type: 'number', placeholder: 'e.g. 1000', defaultValue: '0' },
      { key: 'unit_cost', label: 'unit_cost', type: 'number', placeholder: 'e.g. 0.15' },
      { key: 'supplier', label: 'supplier', type: 'string', placeholder: 'e.g. EPSA' },
      { key: 'last_consumption_7d', label: 'last_consumption_7d', type: 'number', placeholder: 'e.g. 150', defaultValue: '0' },
      { key: 'ward_consumption_daily', label: 'ward_consumption_daily', type: 'number', placeholder: 'e.g. 20', defaultValue: '0' },
      { key: 'status', label: 'status', type: 'select', options: ['in_stock', 'low_stock', 'out_of_stock', 'expired', 'recalled'], defaultValue: 'in_stock' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', item_code: 'SYR-0021', name: 'Disposable Syringes 5ml', category: 'consumable', location: 'central_store', batch_no: 'BAT-9912', expiry_date: '2028-12-31', qty_on_hand: 4500, unit: 'piece', reorder_level: 1000, unit_cost: 0.15, supplier: 'EPSA', last_consumption_7d: 120, ward_consumption_daily: 18, status: 'in_stock' },
      { hospital_id: 'HSP-001', item_code: 'AMX-500', name: 'Amoxicillin 500mg capsules', category: 'drug', location: 'pharmacy', batch_no: 'BAT-8831', expiry_date: '2027-06-30', qty_on_hand: 2400, unit: 'box', reorder_level: 500, unit_cost: 0.22, supplier: 'Apex Pharma', last_consumption_7d: 300, ward_consumption_daily: 45, status: 'in_stock' }
    ]
  },
  Diagnostic: {
    id: 'Diagnostic',
    name: 'Diagnostic',
    collectionName: 'diagnostics',
    icon: Activity,
    subtitle: 'Imaging and advanced laboratory tests',
    description: 'Diagnostic results, laboratory reports, radiology scans, and pathology tests.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'test_id', label: 'test_id', type: 'string', placeholder: 'e.g. TST-5091' },
      { key: 'visit_id', label: 'visit_id', type: 'string', placeholder: 'e.g. VST-2049' },
      { key: 'patient_mrn', label: 'patient_mrn*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. Mulu Bekele' },
      { key: 'category', label: 'category*', type: 'select', options: ['laboratory', 'radiology'], required: true },
      { key: 'test_type', label: 'test_type*', type: 'string', placeholder: 'e.g. Hematology, CD4, Chemistry, GeneXpert, X-Ray, Ultrasound, CT', required: true },
      { key: 'ordered_by', label: 'ordered_by', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'ordered_at', label: 'ordered_at', type: 'date-time', placeholder: 'Pick a date and time' },
      { key: 'result', label: 'result', type: 'string', placeholder: 'e.g. Normal' },
      { key: 'result_value', label: 'result_value', type: 'string', placeholder: 'e.g. 14.2 g/dL' },
      { key: 'reference_range', label: 'reference_range', type: 'string', placeholder: 'e.g. 12.0 - 16.0 g/dL' },
      { key: 'is_critical', label: 'is_critical', type: 'checkbox', defaultValue: 'false' },
      { key: 'image_link', label: 'image_link', type: 'string', placeholder: 'e.g. https://storage.googleapis.com/...' },
      { key: 'status', label: 'status', type: 'select', options: ['ordered', 'sample_collected', 'in_progress', 'resulted', 'verified', 'cancelled'], defaultValue: 'ordered' },
      { key: 'turnaround_minutes', label: 'turnaround_minutes', type: 'number', placeholder: 'e.g. 45' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        test_id: 'TST-2026-0001',
        visit_id: 'VST-2049',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'Mulu Bekele',
        category: 'laboratory',
        test_type: 'Hematology (CBC)',
        ordered_by: 'Dr. Solomon Bedaso',
        ordered_at: '2026-06-23T08:30',
        result: 'Mild Anemia',
        result_value: '10.5 g/dL',
        reference_range: '12.0 - 16.0 g/dL',
        is_critical: false,
        image_link: '',
        status: 'resulted',
        turnaround_minutes: 45
      },
      {
        hospital_id: 'HSP-001',
        test_id: 'TST-2026-0002',
        visit_id: 'VST-2050',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'Sara Hailu',
        category: 'radiology',
        test_type: 'Chest X-Ray PA',
        ordered_by: 'Dr. Solomon Bedaso',
        ordered_at: '2026-06-24T09:15',
        result: 'Normal lung fields, no consolidation',
        result_value: 'Negative',
        reference_range: 'Normal',
        is_critical: false,
        image_link: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500',
        status: 'verified',
        turnaround_minutes: 60
      }
    ]
  },
  User: {
    id: 'User',
    name: 'User',
    collectionName: 'users',
    icon: Users,
    subtitle: 'App users and access levels',
    description: 'System user records, registered emails, and permissions assigned within the General Hospital app.',
    fields: [
      { key: 'full_name', label: 'full_name*', type: 'string', placeholder: 'e.g. GEMECHU AHMED', required: true },
      { key: 'email', label: 'email*', type: 'string', placeholder: 'e.g. gemechuahmed0@gmail.com', required: true },
      { key: 'role', label: 'role*', type: 'select', options: ['director', 'admin', 'user'], required: true },
      { key: 'created_date', label: 'created_date', type: 'string', placeholder: 'YYYY-MM-DDTHH:MM:SSZ' },
      { key: 'updated_date', label: 'updated_date', type: 'string', placeholder: 'YYYY-MM-DDTHH:MM:SSZ' },
      { key: 'created_by_id', label: 'created_by_id', type: 'string', placeholder: 'System' },
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'department_id', label: 'department_id', type: 'string', placeholder: 'e.g. DEP-001' }
    ],
    defaultSeed: [
      { email: 'gemechuahmed0@gmail.com', full_name: 'GEMECHU AHMED', role: 'admin', created_date: '2026-04-20T10:00:00Z', updated_date: '2026-06-23T12:00:00Z', created_by_id: 'System', hospital_id: 'HSP-001' },
      { email: 'monetumar22@gmail.com', full_name: 'monetumar22', role: 'user', created_date: '2026-05-01T09:30:00Z', updated_date: '2026-06-23T11:00:00Z', created_by_id: 'US-401', hospital_id: 'HSP-001' }
    ]
  },
  Bed: {
    id: 'Bed',
    name: 'Bed',
    collectionName: 'beds',
    icon: Bed,
    subtitle: 'Ward beds and occupancy management',
    description: 'Real-time telemetry and admission records of clinical ward beds and patient assignments.',
    searchPlaceholder: 'Search by bed_number, patient_mrn, patient_name, attending_physician, notes',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'bed_number', label: 'bed_number*', type: 'string', placeholder: 'e.g. BED-101', required: true },
      { 
        key: 'ward', 
        label: 'ward*', 
        type: 'select', 
        options: ['labor', 'neonatal_nicu', 'pediatric', 'medical', 'surgical', 'gynecology', 'icu', 'post_op_recovery'], 
        required: true 
      },
      { 
        key: 'status', 
        label: 'status', 
        type: 'select', 
        options: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'], 
        defaultValue: 'available', 
        required: true 
      },
      { key: 'patient_mrn', label: 'patient_mrn', type: 'string', placeholder: 'e.g. MRN-2026-9912' },
      { key: 'patient_name', label: 'patient_name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'admission_date', label: 'admission_date', type: 'date-time', placeholder: 'Pick a date' },
      { key: 'expected_discharge', label: 'expected_discharge', type: 'date', placeholder: 'Pick a date' },
      { key: 'attending_physician', label: 'attending_physician', type: 'string', placeholder: 'e.g. Dr. Solomon Bedaso' },
      { key: 'notes', label: 'notes', type: 'textarea', placeholder: 'Clinical occupancy notes...' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        bed_number: 'BED-101',
        ward: 'icu',
        status: 'occupied',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        admission_date: '2026-06-25T10:00',
        expected_discharge: '2026-07-02',
        attending_physician: 'gemechuahmed0@gmail.com',
        notes: 'Patient requires active mechanical ventilation support.'
      },
      {
        hospital_id: 'HSP-001',
        bed_number: 'BED-102',
        ward: 'icu',
        status: 'available',
        patient_mrn: '',
        patient_name: '',
        admission_date: '',
        expected_discharge: '',
        attending_physician: '',
        notes: 'Ready for admission. Cleaning verified.'
      },
      {
        hospital_id: 'HSP-001',
        bed_number: 'BED-201',
        ward: 'medical',
        status: 'occupied',
        patient_mrn: 'MRN-2026-8823',
        patient_name: 'monetumar22',
        admission_date: '2026-06-24T14:30',
        expected_discharge: '2026-06-28',
        attending_physician: 'solomon@gelemso.org',
        notes: 'Post-op observation. Stable vitals.'
      }
    ]
  },
  Admission: {
    id: 'Admission',
    name: 'Admission',
    collectionName: 'admissions',
    icon: LogIn,
    subtitle: 'Inpatient admission records',
    description: 'Patient hospitalization records, including ward assignment, admission type, and discharge planning.',
    searchPlaceholder: 'Search by admission_id, patient_mrn, patient_name, ward, bed_number, attending_physician, status, discharge_summary',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'admission_id', label: 'Admission ID*', type: 'string', placeholder: 'e.g. ADM-101', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'ward', label: 'Ward/Unit*', type: 'string', placeholder: 'e.g. Medical Ward A', required: true },
      { key: 'bed_number', label: 'Bed Number', type: 'string', placeholder: 'e.g. B-12' },
      { key: 'admission_date', label: 'Admission Date*', type: 'date-time', required: true },
      { key: 'admission_type', label: 'Type', type: 'select', options: ['Emergency', 'Elective', 'Transfer', 'Newborn'], defaultValue: 'Emergency' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Discharged'], defaultValue: 'Active' },
      { key: 'attending_physician', label: 'Attending Physician', type: 'string', placeholder: 'e.g. Dr. Abebe B.' },
      { key: 'expected_discharge', label: 'Expected Discharge', type: 'date' },
      { key: 'actual_discharge', label: 'Actual Discharge', type: 'date-time' },
      { key: 'discharge_summary', label: 'Discharge Summary', type: 'textarea', placeholder: 'Clinical summary, follow-up instructions, and medications on discharge...' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', 
        admission_id: 'ADM-101', 
        patient_mrn: 'MRN-2026-9912', 
        patient_name: 'GEMECHU AHMED', 
        ward: 'Medical Ward A', 
        bed_number: 'B-12', 
        admission_date: '2026-06-20T14:30:00Z', 
        admission_type: 'Emergency', 
        status: 'Active',
        attending_physician: 'Dr. Abebe B.'
      }
    ]
  },
  LiaisonOffice: {
    id: 'LiaisonOffice',
    name: 'LiaisonOffice',
    collectionName: 'liaison_offices',
    icon: Link2,
    subtitle: 'Inter-facility coordination',
    description: 'Management of patient referrals, transfers between hospitals, and external facility communications.',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'referral_id', label: 'Referral ID*', type: 'string', placeholder: 'e.g. REF-101', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'source_facility', label: 'Source Facility*', type: 'string', placeholder: 'e.g. Gelemso General Hospital', required: true },
      { key: 'destination_facility', label: 'Destination Facility*', type: 'string', placeholder: 'e.g. TASH Referral Hospital', required: true },
      { key: 'referral_type', label: 'Type', type: 'select', options: ['Inbound', 'Outbound', 'Emergency Transfer'], defaultValue: 'Outbound' },
      { key: 'reason', label: 'Reason for Referral', type: 'textarea', placeholder: 'e.g. Specialized neurosurgery' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled'], defaultValue: 'Pending' },
      { key: 'coordinator', label: 'Liaison Coordinator', type: 'string', placeholder: 'e.g. Ahmed M.' },
      { key: 'referral_date', label: 'Date', type: 'date-time' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001', 
        referral_id: 'REF-101', 
        patient_mrn: 'MRN-2026-9912', 
        patient_name: 'GEMECHU AHMED', 
        source_facility: 'Gelemso General Hospital', 
        destination_facility: 'TASH Referral Hospital', 
        referral_type: 'Outbound', 
        reason: 'Specialized cardiac evaluation', 
        status: 'Approved',
        coordinator: 'Ahmed M.',
        referral_date: '2026-06-25T09:00:00Z'
      }
    ]
  },
  Immunization: {
    id: 'Immunization',
    name: 'Immunization',
    collectionName: 'immunizations',
    icon: Syringe,
    subtitle: 'Vaccination and immunization tracking',
    description: 'A record of vaccines administered to patients, including dose schedules and next due dates.',
    searchPlaceholder: 'Search by imm_id, patient_mrn, patient_name, vaccine_name, administered_by',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'imm_id', label: 'Imm ID*', type: 'string', placeholder: 'e.g. IMM-001', required: true },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'vaccine_name', label: 'Vaccine*', type: 'string', placeholder: 'e.g. BCG, Polio, COVID-19', required: true },
      { key: 'dose_number', label: 'Dose #', type: 'string', placeholder: 'e.g. 1st, 2nd, Booster' },
      { key: 'administered_at', label: 'Administered At*', type: 'date-time', required: true },
      { key: 'administered_by', label: 'Administered By', type: 'string', placeholder: 'e.g. Ns. Hanna Girma' },
      { key: 'next_due_date', label: 'Next Due Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        imm_id: 'IMM-001',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        vaccine_name: 'COVID-19 (Pfizer)',
        dose_number: '1st Dose',
        administered_at: '2026-06-20T09:00',
        administered_by: 'Ns. Hanna Girma',
        next_due_date: '2026-07-11',
        notes: 'Patient tolerated well.'
      }
    ]
  },
  OperativeRecord: {
    id: 'OperativeRecord',
    name: 'OperativeRecord',
    collectionName: 'operative_records',
    icon: Scissors,
    subtitle: 'Surgical procedure reports',
    description: 'Detailed surgical operative records, findings, outcomes, and surgical team details.',
    searchPlaceholder: 'Search by op_id, patient_mrn, patient_name, procedure_name, surgeon',
    fields: [
      { key: 'hospital_id', label: 'hospital_id', type: 'string', placeholder: 'e.g. HSP-001' },
      { key: 'op_id', label: 'Op ID*', type: 'string', placeholder: 'e.g. SURG-101', required: true },
      { key: 'visit_id', label: 'Visit ID', type: 'string', placeholder: 'e.g. VIS-001' },
      { key: 'patient_mrn', label: 'Patient MRN*', type: 'string', placeholder: 'e.g. MRN-2026-9912', required: true },
      { key: 'patient_name', label: 'Patient Name', type: 'string', placeholder: 'e.g. GEMECHU AHMED' },
      { key: 'procedure_name', label: 'Procedure*', type: 'string', placeholder: 'e.g. Appendectomy', required: true },
      { key: 'surgeon', label: 'Lead Surgeon*', type: 'string', placeholder: 'e.g. Dr. Solomon B.', required: true },
      { key: 'anesthesiologist', label: 'Anesthesiologist', type: 'string', placeholder: 'e.g. Dr. Hanna G.' },
      { key: 'created_by_id', label: 'created_by_id', type: 'string', placeholder: 'e.g. gemechuahmed0@gmail.com' },
      { key: 'department_id', label: 'department_id', type: 'string', placeholder: 'e.g. DEP-001' },
      { key: 'start_time', label: 'Start Time', type: 'date-time' },
      { key: 'end_time', label: 'End Time', type: 'date-time' },
      { key: 'outcome', label: 'Outcome', type: 'select', options: ['Successful', 'Complicated', 'Failed'], defaultValue: 'Successful' },
      { key: 'findings', label: 'Surgical Findings', type: 'textarea' },
      { key: 'notes', label: 'Post-op Notes', type: 'textarea' }
    ],
    defaultSeed: [
      { hospital_id: 'HSP-001',
        op_id: 'SURG-101',
        visit_id: 'VIS-001',
        patient_mrn: 'MRN-2026-9912',
        patient_name: 'GEMECHU AHMED',
        procedure_name: 'Appendectomy',
        surgeon: 'Dr. Solomon Bedaso',
        created_by_id: 'gemechuahmed0@gmail.com',
        department_id: 'DEP-001'
      }
    ]
  },
  PatientAlias: {
    id: 'PatientAlias',
    name: 'Patient Alias',
    collectionName: 'patient_aliases',
    icon: Users,
    subtitle: 'Patient name aliases',
    description: 'Alternative names for patients.',
    fields: [
      { key: 'patient_id', label: 'Patient ID*', type: 'string', required: true },
      { key: 'alias_first_name', label: 'Alias First Name', type: 'string' },
      { key: 'alias_last_name', label: 'Alias Last Name', type: 'string' },
      { key: 'alias_type', label: 'Alias Type', type: 'select', options: ['Maiden', 'Previous', 'Preferred', 'Legal'] }
    ],
    defaultSeed: []
  },
  PatientIdentifier: {
    id: 'PatientIdentifier',
    name: 'Patient Identifier',
    collectionName: 'patient_identifiers',
    icon: FileText,
    subtitle: 'Patient identification documents',
    description: 'IDs like SSN, Drivers License, etc.',
    fields: [
      { key: 'patient_id', label: 'Patient ID*', type: 'string', required: true },
      { key: 'identifier_type', label: 'Identifier Type*', type: 'select', options: ['SSN', 'DriversLicense', 'Passport', 'StateID', 'TribalID'], required: true },
      { key: 'identifier_value', label: 'Identifier Value*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Gender: {
    id: 'Gender',
    name: 'Gender',
    collectionName: 'genders',
    icon: Users,
    subtitle: 'Gender lookup',
    description: 'Standard gender lookups.',
    fields: [
      { key: 'gender_code', label: 'Gender Code*', type: 'string', required: true },
      { key: 'gender_name', label: 'Gender Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ gender_code: 'M', gender_name: 'Male' }, { gender_code: 'F', gender_name: 'Female' }]
  },
  MaritalStatus: {
    id: 'MaritalStatus',
    name: 'Marital Status',
    collectionName: 'marital_statuses',
    icon: Users,
    subtitle: 'Marital status lookup',
    description: 'Standard marital status lookups.',
    fields: [
      { key: 'marital_status_code', label: 'Status Code*', type: 'string', required: true },
      { key: 'status_name', label: 'Status Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ marital_status_code: 'S', status_name: 'Single' }, { marital_status_code: 'M', status_name: 'Married' }]
  },
  VisitType: {
    id: 'VisitType',
    name: 'Visit Type',
    collectionName: 'visit_types',
    icon: Calendar,
    subtitle: 'Visit type lookup',
    description: 'Standard visit type lookups.',
    fields: [
      { key: 'visit_type_code', label: 'Type Code*', type: 'string', required: true },
      { key: 'type_name', label: 'Type Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ visit_type_code: 'IP', type_name: 'Inpatient' }, { visit_type_code: 'OP', type_name: 'Outpatient' }]
  },
  VisitStatus: {
    id: 'VisitStatus',
    name: 'Visit Status',
    collectionName: 'visit_statuses',
    icon: Activity,
    subtitle: 'Visit status lookup',
    description: 'Standard visit status lookups.',
    fields: [
      { key: 'status_code', label: 'Status Code*', type: 'string', required: true },
      { key: 'status_name', label: 'Status Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ status_code: 'SCH', status_name: 'Scheduled' }, { status_code: 'INP', status_name: 'In Progress' }]
  },
  Department: {
    id: 'Department',
    name: 'Department',
    collectionName: 'departments',
    icon: Home,
    subtitle: 'Hospital departments',
    description: 'Organizational departments.',
    fields: [
      { key: 'hospital_id', label: 'Hospital ID*', type: 'string', required: true },
      { key: 'dept_id', label: 'Dept ID*', type: 'string', required: true },
      { key: 'dept_name', label: 'Dept Name*', type: 'string', required: true },
      { key: 'dept_abbrev', label: 'Dept Abbrev', type: 'string' }
    ],
    defaultSeed: [{ hospital_id: 'HSP-001', dept_id: 'DEP-001', dept_name: 'General OPD', dept_abbrev: 'OPD' }]
  },
  Hospital: {
    id: 'Hospital',
    name: 'Hospital',
    collectionName: 'hospitals',
    icon: Home,
    subtitle: 'Hospital facilities',
    description: 'Registered hospital facilities.',
    fields: [
      { key: 'name', label: 'Name*', type: 'string', required: true },
      { key: 'address', label: 'Address', type: 'string' }
    ],
    defaultSeed: [{ name: 'Gelemso General Hospital', address: 'Gelemso' }]
  },
  Facility: {
    id: 'Facility',
    name: 'Facility',
    collectionName: 'facilities',
    icon: Home,
    subtitle: 'Hospital facilities',
    description: 'Physical hospital facilities.',
    fields: [
      { key: 'facility_name', label: 'Facility Name*', type: 'string', required: true },
      { key: 'facility_code', label: 'Facility Code*', type: 'string', required: true }
    ],
    defaultSeed: [{ facility_name: 'Gelemso General Hospital', facility_code: 'GGH' }]
  },
  Visit: {
    id: 'Visit',
    name: 'Visit',
    collectionName: 'visits',
    icon: Calendar,
    subtitle: 'Patient visits',
    description: 'Records of patient visits to the hospital.',
    fields: [
      { key: 'patient_id', label: 'Patient ID*', type: 'string', required: true },
      { key: 'doctor_id', label: 'Doctor ID', type: 'string' },
      { key: 'visit_date', label: 'Visit Date*', type: 'date-time', required: true },
      { key: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { key: 'diagnosis', label: 'Diagnosis', type: 'textarea' }
    ],
    defaultSeed: [{ patient_id: 'PAT-001', doctor_id: 'STF-002', visit_date: '2026-06-28T01:20:00Z', symptoms: 'Severe migraine', diagnosis: 'Migraine' }]
  },
  Physician: {
    id: 'Physician',
    name: 'Physician',
    collectionName: 'physicians',
    icon: Users,
    subtitle: 'Physician profiles',
    description: 'Medical practitioners and consultants.',
    fields: [
      { key: 'first_name', label: 'First Name*', type: 'string', required: true },
      { key: 'last_name', label: 'Last Name*', type: 'string', required: true },
      { key: 'specialty', label: 'Specialty', type: 'string' }
    ],
    defaultSeed: [{ first_name: 'Dr.', last_name: 'Solomon', specialty: 'General Medicine' }]
  },
  PhysicianPrivilege: {
    id: 'PhysicianPrivilege',
    name: 'Physician Privilege',
    collectionName: 'physician_privileges',
    icon: Shield,
    subtitle: 'Physician privileges',
    description: 'Clinical privileges for physicians.',
    fields: [
      { key: 'physician_id', label: 'Physician ID*', type: 'string', required: true },
      { key: 'privilege_code', label: 'Privilege Code', type: 'string' }
    ],
    defaultSeed: [{ physician_id: 'PHY-001', privilege_code: 'MED_SURG' }]
  },
  ClinicalNote: {
    id: 'ClinicalNote',
    name: 'Clinical Note',
    collectionName: 'clinical_notes',
    icon: FileText,
    subtitle: 'Clinical documentation',
    description: 'EMR clinical notes.',
    fields: [
      { key: 'visit_id', label: 'Visit ID*', type: 'string', required: true },
      { key: 'note_type', label: 'Note Type', type: 'select', options: ['H&P', 'Progress', 'Consult', 'Discharge'] },
      { key: 'note_text', label: 'Note Text', type: 'string' }
    ],
    defaultSeed: []
  },
  ProblemList: {
    id: 'ProblemList',
    name: 'Problem List',
    collectionName: 'problem_list',
    icon: List,
    subtitle: 'Patient problem list',
    description: 'Patient medical problems.',
    fields: [
      { key: 'patient_id', label: 'Patient ID*', type: 'string', required: true },
      { key: 'diagnosis_code', label: 'Diagnosis Code*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Allergy: {
    id: 'Allergy',
    name: 'Allergy',
    collectionName: 'allergies',
    icon: AlertTriangle,
    subtitle: 'Patient allergies',
    description: 'Patient allergy information.',
    fields: [
      { key: 'patient_id', label: 'Patient ID*', type: 'string', required: true },
      { key: 'allergen', label: 'Allergen*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  OrderableItem: {
    id: 'OrderableItem',
    name: 'OrderableItem',
    collectionName: 'orderable_items',
    icon: Package,
    subtitle: 'Orderable items',
    description: 'Items that can be ordered (medication, lab, etc).',
    fields: [
      { key: 'item_code', label: 'Item Code*', type: 'string', required: true },
      { key: 'item_name', label: 'Item Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ item_code: 'MED001', item_name: 'Ibuprofen' }]
  },
  OrderSet: {
    id: 'OrderSet',
    name: 'OrderSet',
    collectionName: 'order_sets',
    icon: Package,
    subtitle: 'Order sets',
    description: 'Sets of orderable items.',
    fields: [
      { key: 'set_name', label: 'Set Name*', type: 'string', required: true }
    ],
    defaultSeed: [{ set_name: 'Standard Adult Admission' }]
  },
  OrderSetItem: {
    id: 'OrderSetItem',
    name: 'OrderSetItem',
    collectionName: 'order_set_items',
    icon: Package,
    subtitle: 'Order set items',
    description: 'Items in an order set.',
    fields: [
      { key: 'set_id', label: 'Set ID*', type: 'string', required: true },
      { key: 'item_id', label: 'Item ID*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  Order: {
    id: 'Order',
    name: 'Order',
    collectionName: 'orders',
    icon: FileText,
    subtitle: 'Orders',
    description: 'Orders for patients.',
    fields: [
      { key: 'order_number', label: 'Order Number*', type: 'string', required: true },
      { key: 'visit_id', label: 'Visit ID*', type: 'string', required: true },
      { key: 'order_status', label: 'Order Status', type: 'select', options: ['Draft', 'Ordered', 'InProgress', 'Completed', 'Cancelled'] }
    ],
    defaultSeed: [{ order_number: 'ORD001', visit_id: 'VIS-9912', order_status: 'Ordered' }]
  },
  OrderStatusHistory: {
    id: 'OrderStatusHistory',
    name: 'OrderStatusHistory',
    collectionName: 'order_status_history',
    icon: Activity,
    subtitle: 'Order status history',
    description: 'History of order statuses.',
    fields: [
      { key: 'order_id', label: 'Order ID*', type: 'string', required: true },
      { key: 'order_status', label: 'Status*', type: 'string', required: true }
    ],
    defaultSeed: []
  },
  OrderResult: {
    id: 'OrderResult',
    name: 'OrderResult',
    collectionName: 'order_results',
    icon: Activity,
    subtitle: 'Order results',
    description: 'Results for orders.',
    fields: [
      { key: 'order_id', label: 'Order ID*', type: 'string', required: true },
      { key: 'result_type', label: 'Result Type', type: 'select', options: ['Numeric', 'Text', 'Coded', 'Image', 'Document'] }
    ],
    defaultSeed: []
  }
};

export const ENTITIES_ORDER = [
  'User',
  'Staff',
  'Patient',
  'Immunization',
  'ClinicalEncounter',
  'OperativeRecord',
  'Admission',
  'LiaisonOffice',
  'Appointment',
  'Bed',
  'PatientAlias',
  'PatientIdentifier',
  'Gender',
  'MaritalStatus',
  'VisitType',
  'VisitStatus',
  'Department',
  'Facility',
  'Visit',
  'Physician',
  'PhysicianPrivilege',
  'ClinicalNote',
  'ProblemList',
  'Allergy',
  'OrderableItem',
  'OrderSet',
  'OrderSetItem',
  'Order',
  'OrderStatusHistory',
  'OrderResult',
  'Prescription',
  'Diagnostic',
  'LabResult',
  'InsuranceClaim',
  'FinancialLedger',
  'SupplyItem',
  'Notification',
  'NotificationPreference',
  'PatientJourneyEvent'
];
