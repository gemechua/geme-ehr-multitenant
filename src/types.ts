export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn: string;
  age: string;
  address: string;
  phone: string;
  referralPaperUrl?: string;
  hospital_id?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  hospital_id?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'director' | 'admin' | 'user';
  created_date: string;
  updated_date: string;
  created_by_id: string;
  hospital_id?: string;
  permissions?: string[];
}

