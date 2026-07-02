import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, UserCheck, TrendingUp, Sparkles, LayoutDashboard } from 'lucide-react';
import QualityImprovement from './QualityImprovement';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeStaff: 0,
    recentAdmissions: 12,
  });
  const [activeSubTab, setActiveSubTab] = useState<'operations' | 'quality'>('operations');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({ ...prev, activeStaff: users.filter(u => u.role !== 'user').length }));
    });

    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
        setStats(prev => ({ ...prev, totalPatients: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubPatients();
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Upper Title with Sub-tab selectors */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-150 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Clinical Administration Hub</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure, audit, and analyze hospital-wide operational metrics, staffing distributions, and clinical quality criteria.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveSubTab('operations')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'operations'
                ? 'bg-white text-gray-950 shadow-sm border border-gray-150'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Operations Center</span>
          </button>
          <button
            onClick={() => setActiveSubTab('quality')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'quality'
                ? 'bg-white text-gray-950 shadow-sm border border-gray-150'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Quality Improvement</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'operations' ? (
        <div className="space-y-6">
          {/* Key Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Institutional Patients</h3>
                <p className="text-3xl font-extrabold text-gray-950 font-mono mt-1">{stats.totalPatients}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 inline-block">Active MRN logs</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-indigo-600">
                <Users size={22} />
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Administrative Staff</h3>
                <p className="text-3xl font-extrabold text-gray-950 font-mono mt-1">{stats.activeStaff}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 inline-block">Authorized accounts</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-600">
                <UserCheck size={22} />
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent Inpatient Admissions</h3>
                <p className="text-3xl font-extrabold text-gray-950 font-mono mt-1">{stats.recentAdmissions}</p>
                <span className="text-[10px] text-amber-600 font-semibold mt-0.5 inline-block">Admitted past 24 hours</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-600">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          {/* Core operations info card */}
          <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Hospital Administrative Summary</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
              This system processes active data flows for all hospital departments. Clinicians can create and configure patient records, monitor medical logs, verify billing transactions, and perform extensive clinical quality audits. Use the top navigation bar to access specific modules or trigger the Quality Improvement panel for medical compliance checking.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 font-medium">To begin auditing clinical services, launch the Quality Improvement panel.</span>
              <button
                onClick={() => setActiveSubTab('quality')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-xs"
              >
                Launch QI Panel
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Quality Improvement component */
        <QualityImprovement />
      )}

    </div>
  );
}
