import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Briefcase, Sliders, CheckCircle2, 
  AlertTriangle, XCircle, DollarSign, Calendar, RefreshCw, 
  Trash2, Edit, ChevronDown, Check, ShieldCheck, Award
} from 'lucide-react';

export interface HRStaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
  payGrade: string;
  salary: number;
  hireDate: string;
  trainingStatus: 'Compliant' | 'Pending Refresh' | 'Overdue';
  shiftStatus: 'Active Duty' | 'Off Duty' | 'On Call' | 'Leave';
}

const DEPARTMENTS = [
  'Emergency',
  'Intensive Care',
  'Pediatrics',
  'General Medicine',
  'Surgical Services',
  'Pharmacy & Dispensary',
  'Administration'
];

const ROLES = [
  'Attending Physician',
  'Resident Doctor',
  'Registered Nurse (RN)',
  'Clinical Nurse Specialist',
  'Chief Pharmacist',
  'Medical Lab Director',
  'Operations Coordinator'
];

const PAY_GRADES = [
  { grade: 'Grade E-7', label: 'Executive Clinical Director' },
  { grade: 'Grade S-4', label: 'Senior Attending Physician' },
  { grade: 'Grade P-3', label: 'Resident / Mid-level Practitioner' },
  { grade: 'Grade N-2', label: 'Senior Clinical Nursing' },
  { grade: 'Grade N-1', label: 'Registered Clinical Staff' },
  { grade: 'Grade A-3', label: 'Administrative Lead' },
];

const INITIAL_HR_STAFF: HRStaffMember[] = [
  { id: 'EMP-001', name: 'Dr. Sarah Jenkins', department: 'Emergency', role: 'Senior Attending Physician', payGrade: 'Grade S-4', salary: 14200, hireDate: '2021-04-12', trainingStatus: 'Compliant', shiftStatus: 'Active Duty' },
  { id: 'EMP-002', name: 'Dr. Marcus Vance', department: 'Intensive Care', role: 'Attending Physician', payGrade: 'Grade S-4', salary: 13800, hireDate: '2022-01-15', trainingStatus: 'Compliant', shiftStatus: 'On Call' },
  { id: 'EMP-003', name: 'Helen Cartwright, RN', department: 'General Medicine', role: 'Registered Nurse (RN)', payGrade: 'Grade N-1', salary: 6500, hireDate: '2023-05-20', trainingStatus: 'Pending Refresh', shiftStatus: 'Active Duty' },
  { id: 'EMP-004', name: 'John Doe', department: 'Administration', role: 'Operations Coordinator', payGrade: 'Grade A-3', salary: 5200, hireDate: '2024-09-01', trainingStatus: 'Compliant', shiftStatus: 'Off Duty' },
  { id: 'EMP-005', name: 'Dr. Evelyn Foster', department: 'Pediatrics', role: 'Resident Doctor', payGrade: 'Grade P-3', salary: 9100, hireDate: '2025-02-10', trainingStatus: 'Overdue', shiftStatus: 'Leave' },
  { id: 'EMP-006', name: 'Robert Sinclair', department: 'Pharmacy & Dispensary', role: 'Chief Pharmacist', payGrade: 'Grade P-3', salary: 8700, hireDate: '2022-07-18', trainingStatus: 'Compliant', shiftStatus: 'Active Duty' },
  { id: 'EMP-007', name: 'Clara Oswald, RN', department: 'Surgical Services', role: 'Clinical Nurse Specialist', payGrade: 'Grade N-2', salary: 7800, hireDate: '2023-11-04', trainingStatus: 'Compliant', shiftStatus: 'Off Duty' },
];

export default function HumanResources() {
  const [staff, setStaff] = useState<HRStaffMember[]>(() => {
    const saved = localStorage.getItem('hr_staff_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_HR_STAFF;
  });

  // State managers
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states for creating new employee
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState(DEPARTMENTS[0]);
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [newGrade, setNewGrade] = useState(PAY_GRADES[4].grade); // N-1
  const [newSalary, setNewSalary] = useState(6500);
  const [newHireDate, setNewHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTraining, setNewTraining] = useState<'Compliant' | 'Pending Refresh' | 'Overdue'>('Compliant');
  const [newShift, setNewShift] = useState<'Active Duty' | 'Off Duty' | 'On Call' | 'Leave'>('Active Duty');

  // Edit employee state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<number>(0);
  const [editGrade, setEditGrade] = useState('');
  const [editShift, setEditShift] = useState<'Active Duty' | 'Off Duty' | 'On Call' | 'Leave'>('Active Duty');
  const [editTraining, setEditTraining] = useState<'Compliant' | 'Pending Refresh' | 'Overdue'>('Compliant');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hr_staff_members', JSON.stringify(staff));
  }, [staff]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('error', 'Please enter a valid employee name.');
      return;
    }

    const nextIdNum = Math.max(...staff.map(s => parseInt(s.id.split('-')[1]) || 0)) + 1;
    const formattedId = `EMP-${String(nextIdNum).padStart(3, '0')}`;

    const newMember: HRStaffMember = {
      id: formattedId,
      name: newName.trim(),
      department: newDept,
      role: newRole,
      payGrade: newGrade,
      salary: Number(newSalary),
      hireDate: newHireDate,
      trainingStatus: newTraining,
      shiftStatus: newShift
    };

    setStaff([newMember, ...staff]);
    setNewName('');
    setNewSalary(6500);
    setShowAddForm(false);
    showToast('success', `✓ Successfully enrolled ${newMember.name} (${newMember.id}) into HR management roster.`);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to offboard and delete employee ${name} (${id})?`)) {
      setStaff(prev => prev.filter(s => s.id !== id));
      showToast('success', `Offboarded ${name} successfully.`);
    }
  };

  const handleStartEdit = (member: HRStaffMember) => {
    setEditingId(member.id);
    setEditSalary(member.salary);
    setEditGrade(member.payGrade);
    setEditShift(member.shiftStatus);
    setEditTraining(member.trainingStatus);
  };

  const handleSaveEdit = (id: string) => {
    setStaff(prev => prev.map(member => {
      if (member.id === id) {
        return {
          ...member,
          salary: Number(editSalary),
          payGrade: editGrade,
          shiftStatus: editShift,
          trainingStatus: editTraining
        };
      }
      return member;
    }));
    setEditingId(null);
    showToast('success', 'Employee compensation scheme & status updated successfully.');
  };

  const handleResetBaseline = () => {
    if (window.confirm('Reset all HR records back to default template? This overrides custom modifications.')) {
      setStaff(INITIAL_HR_STAFF);
      showToast('success', 'HR registry has been restored to factory baseline roster.');
    }
  };

  // Filter logic
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = deptFilter === 'All' || member.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || member.shiftStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // KPI aggregate calculations
  const totalFTE = staff.length;
  const compliantCount = staff.filter(s => s.trainingStatus === 'Compliant').length;
  const compliantPercentage = totalFTE > 0 ? Math.round((compliantCount / totalFTE) * 100) : 0;
  const totalMonthlyPayroll = staff.reduce((sum, s) => sum + s.salary, 0);
  const activeDutyCount = staff.filter(s => s.shiftStatus === 'Active Duty').length;

  return (
    <div className="space-y-6">
      
      {/* Top action cards & KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Headcount */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Staff Headcount</span>
            <span className="text-xl font-extrabold text-gray-950 font-mono">{totalFTE} FTE</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Enrolled clinical members</span>
          </div>
        </div>

        {/* Card 2: Active Duty */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Active Duty Today</span>
            <span className="text-xl font-extrabold text-gray-950 font-mono">{activeDutyCount} Active</span>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Staff on floor now</span>
          </div>
        </div>

        {/* Card 3: Compliance Rate */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Training Compliance</span>
            <span className="text-xl font-extrabold text-gray-950 font-mono">{compliantPercentage}%</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">{compliantCount} of {totalFTE} up-to-date</span>
          </div>
        </div>

        {/* Card 4: Monthly Payroll */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Est. Monthly Payroll</span>
            <span className="text-xl font-extrabold text-gray-950 font-mono">{totalMonthlyPayroll.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Clinical salary expenditure</span>
          </div>
        </div>

      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xs">
        
        {/* Header toolbar */}
        <div className="p-5 border-b border-gray-150 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" />
                Human Resources & Staffing Scheme Table
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Manage medical practitioner roles, payroll bands, training compliance status, and active shifts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <UserPlus size={14} />
                <span>Enrol Staff Member</span>
              </button>
              <button
                onClick={handleResetBaseline}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-250 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div className={`p-3 rounded-lg border text-xs font-bold animate-fadeIn ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                : 'bg-rose-50 border-rose-150 text-rose-800'
            }`}>
              {feedback.text}
            </div>
          )}

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6 relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, clinical ID, or practice role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-gray-400 font-semibold text-gray-800"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-gray-400 font-semibold text-gray-600"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-gray-400 font-semibold text-gray-600"
              >
                <option value="All">All Shifts</option>
                <option value="Active Duty">Active Duty</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Call">On Call</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Employee Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddStaff} className="p-5 bg-gray-50/50 border-b border-gray-150 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
            <div className="md:col-span-3 pb-2 border-b border-dashed border-gray-200">
              <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">Enrol Practitioner Details</h4>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Arthur Pendelton"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Clinical Department</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-700"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Practitioner Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-700"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Compensation Grade</label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-700"
              >
                {PAY_GRADES.map(pg => (
                  <option key={pg.grade} value={pg.grade}>{pg.grade} ({pg.label})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Monthly Salary (USD)</label>
              <input
                type="number"
                min="1000"
                max="50000"
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-mono font-medium text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Hire Date</label>
              <input
                type="date"
                value={newHireDate}
                onChange={(e) => setNewHireDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-mono text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Training Status</label>
              <select
                value={newTraining}
                onChange={(e) => setNewTraining(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-700"
              >
                <option value="Compliant">Compliant</option>
                <option value="Pending Refresh">Pending Refresh</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Shift Shift status</label>
              <select
                value={newShift}
                onChange={(e) => setNewShift(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium text-gray-700"
              >
                <option value="Active Duty">Active Duty</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Call">On Call</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>

            <div className="flex items-end gap-2 pt-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex-1"
              >
                Save Enrolment
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Main HR Scheme Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-150 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name & Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Grade Scheme</th>
                <th className="py-3 px-4">Compensation</th>
                <th className="py-3 px-4">Training Status</th>
                <th className="py-3 px-4">Shift Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-sm">No clinical employees found</p>
                    <p className="text-xs text-gray-400 mt-1">Try modifying your filter parameters or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const isEditing = editingId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                        {member.id}
                      </td>

                      {/* Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{member.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{member.role}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">
                          {member.department}
                        </span>
                      </td>

                      {/* Grade Scheme */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded font-medium bg-white text-xs text-gray-700"
                          >
                            {PAY_GRADES.map(pg => (
                              <option key={pg.grade} value={pg.grade}>{pg.grade}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-bold text-gray-700">
                            {member.payGrade}
                          </span>
                        )}
                      </td>

                      {/* Compensation */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editSalary}
                              onChange={(e) => setEditSalary(Number(e.target.value))}
                              className="w-20 px-1.5 py-1 text-xs font-mono border border-gray-200 rounded text-gray-800"
                            />
                            <span className="text-gray-400">USD</span>
                          </div>
                        ) : (
                          <span>{member.salary.toLocaleString()} / mo</span>
                        )}
                      </td>

                      {/* Training Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editTraining}
                            onChange={(e) => setEditTraining(e.target.value as any)}
                            className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-700"
                          >
                            <option value="Compliant">Compliant</option>
                            <option value="Pending Refresh">Pending Refresh</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        ) : (
                          member.trainingStatus === 'Compliant' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] font-extrabold rounded-md inline-flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Compliant</span>
                            </span>
                          ) : member.trainingStatus === 'Pending Refresh' ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-150 text-amber-700 text-[10px] font-extrabold rounded-md inline-flex items-center gap-1">
                              <AlertTriangle size={10} />
                              <span>Refresh Due</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-150 text-rose-700 text-[10px] font-extrabold rounded-md inline-flex items-center gap-1">
                              <XCircle size={10} />
                              <span>Overdue</span>
                            </span>
                          )
                        )}
                      </td>

                      {/* Shift Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editShift}
                            onChange={(e) => setEditShift(e.target.value as any)}
                            className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-700"
                          >
                            <option value="Active Duty">Active Duty</option>
                            <option value="Off Duty">Off Duty</option>
                            <option value="On Call">On Call</option>
                            <option value="Leave">On Leave</option>
                          </select>
                        ) : (
                          member.shiftStatus === 'Active Duty' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                              Active Duty
                            </span>
                          ) : member.shiftStatus === 'On Call' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                              On Call
                            </span>
                          ) : member.shiftStatus === 'Leave' ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md">
                              Leave
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-md">
                              Off Duty
                            </span>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(member.id)}
                              className="p-1 px-2.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold hover:bg-emerald-700 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 px-2.5 bg-gray-100 text-gray-600 rounded text-[10px] font-extrabold hover:bg-gray-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(member)}
                              className="p-1 px-2 text-indigo-700 hover:bg-indigo-50 border border-indigo-150 rounded text-[10px] font-extrabold inline-flex items-center gap-0.5 cursor-pointer"
                              title="Edit Employee Pay Scheme & Status"
                            >
                              <Edit size={10} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id, member.name)}
                              className="p-1 px-1.5 text-rose-700 hover:bg-rose-50 border border-rose-150 rounded text-[10px] font-extrabold inline-flex items-center cursor-pointer"
                              title="Offboard Staff"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-gray-50/75 border-t border-gray-150 text-[11px] text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Authorized HR Scheme: Pay scale grades mapped according to standard EMR operational bylaws.</span>
          </div>
          <span className="font-mono text-[10px]">Registry safe & active</span>
        </div>

      </div>

    </div>
  );
}
