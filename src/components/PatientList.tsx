import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Patient))
        .filter(p => {
          if (!tenantId) return true;
          if (!p.hospital_id || p.hospital_id === 'demo-global') return true;
          return p.hospital_id === tenantId;
        });
      setPatients(patientList);
    }, (error) => {
      console.warn("Firestore subscription error for patients:", error);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Patients</h2>
      <div className="space-y-2">
        {patients.map(patient => (
          <div key={patient.id} className="p-4 border rounded shadow">
            <p className="font-bold">{patient.name}</p>
            <p>MRN: {patient.mrn} | DOB: {patient.dob} | Gender: {patient.gender}</p>
            <p>Age: {patient.age} | Phone: {patient.phone}</p>
            <p>Address: {patient.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
