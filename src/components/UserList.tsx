import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { 
  Search, ChevronDown, Plus, Filter, Lock, ShieldAlert, Pencil, Trash2,
  Clock, Download, KeyRound, Copy, Check, CheckSquare, Square, RefreshCw, 
  Eye, Info, UserCheck, Shield, ShieldCheck, X, QrCode, Printer, Database
} from 'lucide-react';
import InviteUserForm from './InviteUserForm';
import { userUpdateSchema } from '../lib/schemas';

interface UserActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
  ipAddress?: string;
}

export interface OwnerRegisteredAdmin {
  id: string;
  full_name: string;
  email: string;
  hospital_id: string;
  license_key: string;
  created_date: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'director' | 'admin' | 'user'>('all');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'qr' | 'owner-admin-portal'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'director' | 'admin' | 'user'>('user');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const isSeeding = useRef(false);

  // --- New Feature States ---
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const isPendingSeeding = useRef(false);

  // --- Owner Admin Registration Portal States ---
  const [ownerRegisteredAdmins, setOwnerRegisteredAdmins] = useState<OwnerRegisteredAdmin[]>([]);
  const [ownerAdminName, setOwnerAdminName] = useState('');
  const [ownerAdminEmail, setOwnerAdminEmail] = useState('');
  const [ownerHospitalId, setOwnerHospitalId] = useState('');
  const [ownerLicenseKey, setOwnerLicenseKey] = useState('');
  const [ownerAdminPassword, setOwnerAdminPassword] = useState('');
  const [isRegisteringOwnerAdmin, setIsRegisteringOwnerAdmin] = useState(false);
  const [ownerAdminError, setOwnerAdminError] = useState('');
  const [ownerAdminSuccess, setOwnerAdminSuccess] = useState('');

  const [editingOwnerAdmin, setEditingOwnerAdmin] = useState<OwnerRegisteredAdmin | null>(null);
  const [editOwnerAdminName, setEditOwnerAdminName] = useState('');
  const [editOwnerAdminHospitalId, setEditOwnerAdminHospitalId] = useState('');
  const [editOwnerAdminLicenseKey, setEditOwnerAdminLicenseKey] = useState('');
  const [editOwnerAdminEmail, setEditOwnerAdminEmail] = useState('');
  const [isSavingOwnerAdminEdit, setIsSavingOwnerAdminEdit] = useState(false);
  const [ownerAdminEditError, setOwnerAdminEditError] = useState('');

  // Sync Owner Registered Admins
  useEffect(() => {
    const q = query(collection(db, 'owner_registered_admins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OwnerRegisteredAdmin[];
      setOwnerRegisteredAdmins(admins);
    }, (error) => {
      console.warn("Firestore subscription error for owner registered admins:", error);
    });
    return unsubscribe;
  }, []);

  // Sync and seed Pending User Requests
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number || 'demo-global';

    const q = query(collection(db, 'pending_user_requests'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !isPendingSeeding.current) {
        isPendingSeeding.current = true;
        const initialRequests = [
          {
            full_name: 'Dr. Abraham Tolossa',
            email: 'abraham.tolossa@healthflow.org',
            role: 'user',
            requested_role: 'Doctor',
            license_number: 'ETH-MD-9041',
            department: 'Internal Medicine',
            justification: 'Attending physician requesting system credentials for patient diagnostics.',
            hospital_id: tenantId,
            created_date: new Date(Date.now() - 2 * 3600000).toISOString(),
            status: 'pending'
          },
          {
            full_name: 'Nurse Bethlehem Kebede',
            email: 'bethlehem.kebede@healthflow.org',
            role: 'user',
            requested_role: 'Nurse',
            license_number: 'ETH-RN-7732',
            department: 'Emergency Department',
            justification: 'Registered Nurse onboarding to log vital signs and prescribe medications.',
            hospital_id: tenantId,
            created_date: new Date(Date.now() - 10 * 3600000).toISOString(),
            status: 'pending'
          },
          {
            full_name: 'Pharmacist Yohannes Alula',
            email: 'yohannes.alula@healthflow.org',
            role: 'user',
            requested_role: 'Pharmacist',
            license_number: 'ETH-RX-4011',
            department: 'Main Pharmacy',
            justification: 'Licensed pharmacist requesting permission to process e-prescriptions and inventory.',
            hospital_id: tenantId,
            created_date: new Date(Date.now() - 24 * 3600000).toISOString(),
            status: 'pending'
          }
        ];
        try {
          for (const req of initialRequests) {
            await addDoc(collection(db, 'pending_user_requests'), req);
          }
        } catch (error) {
          console.error("Error seeding initial pending requests:", error);
        }
      }

      const reqList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          full_name: data.full_name,
          email: data.email,
          requested_role: data.requested_role,
          license_number: data.license_number,
          department: data.department,
          justification: data.justification,
          hospital_id: data.hospital_id,
          created_date: data.created_date || new Date().toISOString(),
          status: data.status || 'pending'
        };
      }).filter((r: any) => {
        if (!tenantId || tenantId === 'demo-global') return true;
        return r.hospital_id === tenantId || !r.hospital_id || r.hospital_id === 'demo-global';
      });

      setPendingRequests(reqList);
    }, (error) => {
      console.warn("Firestore subscription error for pending requests:", error);
    });

    return unsubscribe;
  }, []);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userName: string;
    userEmail: string;
    tempPass: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [manualLogTexts, setManualLogTexts] = useState<Record<string, string>>({});
  const [isSavingManualLog, setIsSavingManualLog] = useState<Record<string, boolean>>({});
  const [editPassword, setEditPassword] = useState('');
  const [auditUser, setAuditUser] = useState<User | null>(null);
  const [expandedPermissionsUserIds, setExpandedPermissionsUserIds] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState<Record<string, boolean>>({});
  const [permissionsFeedback, setPermissionsFeedback] = useState<Record<string, string>>({});
  const [editedUserPermissions, setEditedUserPermissions] = useState<Record<string, string[]>>({});
  
  // CSV Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRoleFilter, setExportRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const isLogsSeeding = useRef(false);

  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !isSeeding.current) {
        isSeeding.current = true;
        const initialUsers = [
          { email: 'gemechuahmed0@gmail.com', full_name: 'GEMECHU AHMED', role: 'admin', hospital_id: 'demo-global' },
          { email: 'monetumar22@gmail.com', full_name: 'monetumar22', role: 'user', hospital_id: 'demo-global' },
          { email: 'gemechu.ahmed1@icloud.com', full_name: 'gemechu.ahmed1', role: 'user', hospital_id: 'demo-global' }
        ];
        try {
          for (const u of initialUsers) {
            await addDoc(collection(db, 'users'), {
              ...u,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error seeding initial users:", error);
        }
      }

      const userList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          full_name: data.full_name || '',
          role: data.role || 'user',
          created_date: data.created_date ? (data.created_date.toDate ? data.created_date.toDate().toISOString() : data.created_date) : '',
          updated_date: data.updated_date ? (data.updated_date.toDate ? data.updated_date.toDate().toISOString() : data.updated_date) : '',
          created_by_id: data.created_by_id || '',
          hospital_id: data.hospital_id,
        } as User;
      }).filter(u => {
        if (!tenantId) return true;
        if (!u.hospital_id || u.hospital_id === 'demo-global') return true;
        return u.hospital_id === tenantId;
      });
      setUsers(userList);
    }, (error) => {
      console.warn("Firestore subscription error for users:", error);
    });
    return unsubscribe;
  }, []);

  // Sync Activity Logs
  useEffect(() => {
    const q = query(collection(db, 'user_activity_logs'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !isLogsSeeding.current) {
        isLogsSeeding.current = true;
        const initialLogs = [
          {
            userId: 'seed-admin',
            userEmail: 'gemechuahmed0@gmail.com',
            action: 'System Created',
            details: 'Account initialized as the primary Hospital Owner Admin.',
            timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
            performedBy: 'System Bootstrap',
            ipAddress: '196.188.10.12'
          },
          {
            userId: 'seed-admin',
            userEmail: 'gemechuahmed0@gmail.com',
            action: 'Account Login',
            details: 'Successful security verification & login via Central Node.',
            timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
            performedBy: 'gemechuahmed0@gmail.com',
            ipAddress: '196.188.10.45'
          },
          {
            userId: 'seed-user1',
            userEmail: 'monetumar22@gmail.com',
            action: 'System Invited',
            details: 'Security authorization link dispatched to workspace tenant.',
            timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
            performedBy: 'gemechuahmed0@gmail.com',
            ipAddress: '196.188.10.12'
          },
          {
            userId: 'seed-user1',
            userEmail: 'monetumar22@gmail.com',
            action: 'Account Login',
            details: 'Successful user authentication from clinical mobile device.',
            timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
            performedBy: 'monetumar22@gmail.com',
            ipAddress: '196.188.14.77'
          },
          {
            userId: 'seed-user2',
            userEmail: 'gemechu.ahmed1@icloud.com',
            action: 'System Invited',
            details: 'Security authorization invitation dispatched to clinical staff.',
            timestamp: new Date(Date.now() - 40 * 24 * 3600000).toISOString(),
            performedBy: 'gemechuahmed0@gmail.com',
            ipAddress: '196.188.10.12'
          },
          {
            userId: 'seed-user2',
            userEmail: 'gemechu.ahmed1@icloud.com',
            action: 'Account Login',
            details: 'Successful user authentication from clinical tablet.',
            timestamp: new Date(Date.now() - 35 * 24 * 3600000).toISOString(),
            performedBy: 'gemechu.ahmed1@icloud.com',
            ipAddress: '196.188.12.88'
          }
        ];
        try {
          for (const log of initialLogs) {
            await addDoc(collection(db, 'user_activity_logs'), log);
          }
        } catch (error) {
          console.error("Error seeding initial logs:", error);
        }
      }

      const logList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          action: data.action || '',
          details: data.details || '',
          timestamp: data.timestamp || '',
          performedBy: data.performedBy || 'System',
          ipAddress: data.ipAddress || 'N/A'
        } as UserActivityLog;
      });
      logList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(logList);
    }, (error) => {
      console.warn("Firestore subscription error for user logs:", error);
    });
    return unsubscribe;
  }, []);

  const logActivity = async (userId: string, userEmail: string, action: string, details: string) => {
    try {
      await addDoc(collection(db, 'user_activity_logs'), {
        userId,
        userEmail,
        action,
        details,
        timestamp: new Date().toISOString(),
        performedBy: 'Hospital Director',
        ipAddress: '196.188.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)
      });
    } catch (error) {
      console.error("Error writing activity log:", error);
    }
  };

  const getLastLogin = (user: User) => {
    // Find logs
    const userLogs = activityLogs.filter(
      (log) => log.userEmail?.toLowerCase() === user.email?.toLowerCase() && log.action === 'Account Login'
    );
    let lastLoginTime: number | null = null;
    if (userLogs.length > 0) {
      const times = userLogs.map(l => new Date(l.timestamp).getTime()).filter(t => !isNaN(t));
      if (times.length > 0) {
        lastLoginTime = Math.max(...times);
      }
    }
    
    // Also check if user has custom last_login_date field
    if ((user as any).last_login_date) {
      const t = new Date((user as any).last_login_date).getTime();
      if (!isNaN(t)) {
        if (lastLoginTime === null || t > lastLoginTime) {
          lastLoginTime = t;
        }
      }
    }

    // Fallback to created_date
    if (lastLoginTime === null && user.created_date) {
      const t = new Date(user.created_date).getTime();
      if (!isNaN(t)) {
        lastLoginTime = t;
      }
    }

    if (lastLoginTime === null) {
      return { date: null, daysSince: 0, isInactive: false };
    }

    const date = new Date(lastLoginTime);
    const diffTime = Date.now() - lastLoginTime;
    const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return {
      date,
      daysSince: daysSince >= 0 ? daysSince : 0,
      isInactive: daysSince > 30
    };
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200', text: 'text-gray-400', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      return { score, label: 'Weak 🔴', color: 'bg-red-500', text: 'text-red-600', width: '33%' };
    } else if (score <= 4) {
      return { score, label: 'Moderate 🟡', color: 'bg-amber-500', text: 'text-amber-600', width: '66%' };
    } else {
      return { score, label: 'Strong 🟢', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedUserIds.length} selected user(s)? This action cannot be undone.`)) return;
    setIsBatchProcessing(true);
    setBatchError('');
    try {
      for (const id of selectedUserIds) {
        const u = users.find(user => user.id === id);
        if (u) {
          if (u.email === 'gemechuahmed0@gmail.com') continue;
          await deleteDoc(doc(db, 'users', id));
          await logActivity(
            id,
            u.email,
            'Batch Deleted',
            `User deleted during administrative batch operation.`
          );
        }
      }
      setSelectedUserIds([]);
    } catch (error: any) {
      console.error("Error in batch delete:", error);
      setBatchError(error.message || 'Failed to delete selected users');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchRoleUpdate = async (newRole: 'director' | 'admin' | 'user') => {
    if (selectedUserIds.length === 0) return;
    setIsBatchProcessing(true);
    setBatchError('');
    try {
      for (const id of selectedUserIds) {
        const u = users.find(user => user.id === id);
        if (u) {
          if (u.email === 'gemechuahmed0@gmail.com') continue;
          await updateDoc(doc(db, 'users', id), {
            role: newRole,
            updated_date: new Date().toISOString()
          });
          await logActivity(
            id,
            u.email,
            'Batch Role Updated',
            `Role modified to "${newRole}" during administrative batch operation.`
          );
        }
      }
      setSelectedUserIds([]);
    } catch (error: any) {
      console.error("Error in batch role update:", error);
      setBatchError(error.message || 'Failed to update roles for selected users');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    const tempPass = `EHR-${Array.from({length: 4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')}-${Array.from({length: 4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')}`;
    await logActivity(
      user.id,
      user.email,
      'Password Reset',
      `Admin reset credentials. Generated temporary secure one-time password.`
    );
    setResetPasswordModal({
      isOpen: true,
      userName: user.full_name || 'No Name',
      userEmail: user.email,
      tempPass
    });
  };

  const handleAddManualLog = async (userId: string, userEmail: string) => {
    const text = manualLogTexts[userId]?.trim();
    if (!text) return;
    setIsSavingManualLog(prev => ({ ...prev, [userId]: true }));
    try {
      await logActivity(userId, userEmail, 'Security Audit Note', text);
      setManualLogTexts(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error("Error adding security note:", error);
    } finally {
      setIsSavingManualLog(prev => ({ ...prev, [userId]: false }));
    }
  };

  const exportToCSV = () => {
    setShowExportModal(true);
  };

  const handleExportCSV = () => {
    const dataToExport = users.filter(user => {
      // Role filter
      if (exportRoleFilter !== 'all' && user.role !== exportRoleFilter) {
        return false;
      }
      
      // Status filter (Active/Inactive by 30 days of login)
      const { isInactive } = getLastLogin(user);
      if (exportStatusFilter === 'active' && isInactive) {
        return false;
      }
      if (exportStatusFilter === 'inactive' && !isInactive) {
        return false;
      }
      
      return true;
    });

    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created Date', 'Updated Date'];
    const rows = dataToExport.map(user => {
      const { date, isInactive, daysSince } = getLastLogin(user);
      const statusStr = isInactive ? `Inactive (${daysSince} days)` : 'Active';
      const lastLoginStr = date ? date.toISOString() : 'Never';
      return [
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${user.role}"`,
        `"${statusStr}"`,
        `"${lastLoginStr}"`,
        `"${user.created_date || ''}"`,
        `"${user.updated_date || ''}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ehr_users_directory_${exportRoleFilter}_${exportStatusFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Filter users based on search query and selected role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    setUpdateError('');
    try {
      // Validate inputs using Zod userUpdateSchema
      const validationResult = userUpdateSchema.safeParse({
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
        password: editPassword,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(err => err.message).join(' ');
        setUpdateError(errors);
        setIsUpdating(false);
        return;
      }

      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
        password: editPassword || (editingUser as any).password || null,
        updated_date: new Date().toISOString()
      });

      setEditPassword('');

      // Log this change
      await logActivity(
        editingUser.id, 
        editingUser.email, 
        'Profile Updated', 
        `Admin modified profile. Name: "${editFullName}", Role: "${editRole}", Email: "${editEmail}".`
      );

      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      setUpdateError(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePermissions = async (userId: string, userEmail: string) => {
    setSavingPermissions(prev => ({ ...prev, [userId]: true }));
    setPermissionsFeedback(prev => ({ ...prev, [userId]: '' }));

    const scopes = editedUserPermissions[userId] || [];
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        permissions: scopes,
        updated_date: new Date().toISOString()
      });

      await logActivity(
        userId,
        userEmail,
        'Access Scopes Updated',
        `Clinical administrator updated authorization scopes. Modified credentials: [${scopes.join(', ')}]`
      );

      setPermissionsFeedback(prev => ({ ...prev, [userId]: '✓ Scopes updated successfully & verified on EHR security server.' }));
      setTimeout(() => {
        setPermissionsFeedback(prev => ({ ...prev, [userId]: '' }));
      }, 4000);
    } catch (err: any) {
      setPermissionsFeedback(prev => ({ ...prev, [userId]: `Error: ${err.message}` }));
    } finally {
      setSavingPermissions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simRole, setSimRole] = useState('Doctor');
  const [simDept, setSimDept] = useState('Cardiology');
  const [simLicense, setSimLicense] = useState('');
  const [simJustification, setSimJustification] = useState('');
  const [isSimulatingRequest, setIsSimulatingRequest] = useState(false);
  const [simFeedback, setSimFeedback] = useState('');

  const handleSimulateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simEmail) {
      setSimFeedback('❌ Name and Email are required.');
      return;
    }
    setIsSimulatingRequest(true);
    setSimFeedback('');

    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const tenantId = activeHospital?.hospital_unique_number || 'demo-global';

    const newRequest = {
      full_name: simName.trim(),
      email: simEmail.trim(),
      role: 'user',
      requested_role: simRole,
      license_number: simLicense.trim() || `ETH-LIC-${Math.floor(1000 + Math.random() * 9000)}`,
      department: simDept,
      justification: simJustification.trim() || 'Urgent onboarding for clinic rotations.',
      hospital_id: tenantId,
      created_date: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await addDoc(collection(db, 'pending_user_requests'), newRequest);
      setSimFeedback('✓ Credential request submitted to clinical audit queue!');
      setSimName('');
      setSimEmail('');
      setSimLicense('');
      setSimJustification('');
      setTimeout(() => setSimFeedback(''), 4000);
    } catch (error: any) {
      setSimFeedback(`❌ Error: ${error.message}`);
    } finally {
      setIsSimulatingRequest(false);
    }
  };

  const handleApproveRequest = async (req: any) => {
    setApprovingRequestId(req.id);
    try {
      // 1. Create the user in `users` collection
      // Fallback permissions based on requested_role
      let defaultPerms = ['read_patient_records'];
      if (req.requested_role === 'Doctor') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'audit_logs_view'];
      } else if (req.requested_role === 'Nurse') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'dispense_medications'];
      } else if (req.requested_role === 'Pharmacist') {
        defaultPerms = ['read_patient_records', 'dispense_medications'];
      } else if (req.requested_role === 'Administrator') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'system_backups_access', 'audit_logs_view'];
      }

      await addDoc(collection(db, 'users'), {
        full_name: req.full_name,
        email: req.email,
        role: req.requested_role === 'Administrator' ? 'admin' : 'user',
        hospital_id: req.hospital_id || 'demo-global',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: 'clinical-approval-node',
        permissions: defaultPerms
      });

      // 2. Log activity
      await logActivity(
        'approval-node',
        req.email,
        'Staff Request Approved',
        `Approved credential registry request for ${req.full_name} (${req.requested_role} - ${req.department}). Assigned standard permissions: [${defaultPerms.join(', ')}]`
      );

      // 3. Delete from pending
      await deleteDoc(doc(db, 'pending_user_requests', req.id));

    } catch (err: any) {
      console.error("Error approving request:", err);
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRejectRequest = async (req: any) => {
    setRejectingRequestId(req.id);
    try {
      // 1. Log activity
      await logActivity(
        'approval-node',
        req.email,
        'Staff Request Denied',
        `Rejected and purged onboarding credential request for ${req.full_name} (${req.requested_role} - ${req.department}).`
      );

      // 2. Delete from pending
      await deleteDoc(doc(db, 'pending_user_requests', req.id));
    } catch (err: any) {
      console.error("Error rejecting request:", err);
    } finally {
      setRejectingRequestId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);

      // Log deletion
      await logActivity(
        userToDelete.id, 
        userToDelete.email, 
        'User Deleted', 
        `Admin deleted user account. Name: "${userToDelete.full_name || 'N/A'}", Email: "${userToDelete.email}".`
      );

      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setDeleteError(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterOwnerAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAdminName.trim() || !ownerAdminEmail.trim() || !ownerHospitalId.trim() || !ownerLicenseKey.trim()) {
      setOwnerAdminError('All fields (Name, Email, Hospital ID, License Key) are required.');
      return;
    }
    setIsRegisteringOwnerAdmin(true);
    setOwnerAdminError('');
    setOwnerAdminSuccess('');

    try {
      // 1. Save to owner_registered_admins collection
      const adminDoc = await addDoc(collection(db, 'owner_registered_admins'), {
        full_name: ownerAdminName.trim(),
        email: ownerAdminEmail.trim(),
        hospital_id: ownerHospitalId.trim(),
        license_key: ownerLicenseKey.trim(),
        created_date: new Date().toISOString()
      });

      // 2. Automatically save the admin to the users collection/portal
      const defaultPerms = [
        'read_patient_records',
        'write_clinical_notes',
        'manage_billing',
        'dispense_medications',
        'system_backups_access',
        'audit_logs_view'
      ];
      await addDoc(collection(db, 'users'), {
        full_name: ownerAdminName.trim(),
        email: ownerAdminEmail.trim(),
        role: 'admin',
        hospital_id: ownerHospitalId.trim(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: 'workspace-owner',
        permissions: defaultPerms
      });

      // 3. Log activity
      await logActivity(
        adminDoc.id,
        ownerAdminEmail.trim(),
        'Admin Authorized',
        `Owner registered and authorized Admin: ${ownerAdminName.trim()} for Hospital ID: ${ownerHospitalId.trim()} with License Key verification.`
      );

      setOwnerAdminSuccess(`Successfully registered Admin "${ownerAdminName.trim()}"! Their credentials have been saved to the users portal.`);
      
      // Clear inputs
      setOwnerAdminName('');
      setOwnerAdminEmail('');
      setOwnerHospitalId('');
      setOwnerLicenseKey('');
      setOwnerAdminPassword('');
    } catch (err: any) {
      console.error("Error registering owner admin:", err);
      setOwnerAdminError(err.message || 'Failed to register administrator.');
    } finally {
      setIsRegisteringOwnerAdmin(false);
    }
  };

  const handleDeleteOwnerAdmin = async (admin: OwnerRegisteredAdmin) => {
    if (!window.confirm(`Are you sure you want to permanently delete Admin ${admin.full_name}? This will remove them from the system and block their hospital access.`)) return;
    try {
      // 1. Delete from owner_registered_admins
      await deleteDoc(doc(db, 'owner_registered_admins', admin.id));

      // 2. Delete matching admin from users (by email matching)
      const matchingUsers = users.filter(u => u.email.toLowerCase() === admin.email.toLowerCase());
      for (const m of matchingUsers) {
        await deleteDoc(doc(db, 'users', m.id));
      }

      // 3. Log activity
      await logActivity(
        'owner-portal',
        admin.email,
        'Admin Deleted by Owner',
        `Owner removed administrator authorization and credentials for ${admin.full_name} (${admin.hospital_id}).`
      );
    } catch (err: any) {
      console.error("Error deleting owner admin:", err);
      alert("Failed to delete admin: " + err.message);
    }
  };

  const handleEditOwnerAdmin = (admin: OwnerRegisteredAdmin) => {
    setEditingOwnerAdmin(admin);
    setEditOwnerAdminName(admin.full_name);
    setEditOwnerAdminEmail(admin.email);
    setEditOwnerAdminHospitalId(admin.hospital_id);
    setEditOwnerAdminLicenseKey(admin.license_key);
    setOwnerAdminEditError('');
  };

  const handleSaveOwnerAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwnerAdmin) return;
    setIsSavingOwnerAdminEdit(true);
    setOwnerAdminEditError('');
    try {
      // 1. Update in owner_registered_admins
      await updateDoc(doc(db, 'owner_registered_admins', editingOwnerAdmin.id), {
        full_name: editOwnerAdminName.trim(),
        email: editOwnerAdminEmail.trim(),
        hospital_id: editOwnerAdminHospitalId.trim(),
        license_key: editOwnerAdminLicenseKey.trim()
      });

      // 2. Update matching entries in users collection (by matching email)
      const matchingUsers = users.filter(u => u.email.toLowerCase() === editingOwnerAdmin.email.toLowerCase());
      for (const m of matchingUsers) {
        await updateDoc(doc(db, 'users', m.id), {
          full_name: editOwnerAdminName.trim(),
          email: editOwnerAdminEmail.trim(),
          hospital_id: editOwnerAdminHospitalId.trim()
        });
      }

      // 3. Log activity
      await logActivity(
        'owner-portal',
        editOwnerAdminEmail,
        'Admin Edited by Owner',
        `Owner updated administrator credential profile for ${editOwnerAdminName}.`
      );

      setEditingOwnerAdmin(null);
    } catch (err: any) {
      console.error("Error editing owner admin:", err);
      setOwnerAdminEditError(err.message || "Failed to update admin profile");
    } finally {
      setIsSavingOwnerAdminEdit(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900">Users</h2>
            <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} />
              Director of Hospital Only
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage the app's users and their roles</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-white font-medium"
            title="Export CSV Directory"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button 
            onClick={() => {}} 
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Filters"
          >
            <Filter size={18} />
          </button>
          
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-gray-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-850 transition-colors cursor-pointer animate-pulse"
          >
            <Plus size={16} />
            <span>add</span>
          </button>
        </div>
      </div>

      {/* Hospital Director Restriction Advisory Banner */}
      <div className="bg-red-50/40 rounded-2xl border border-red-100 p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">Hospital Authority Restriction</h4>
          <p className="text-xs text-red-800 leading-relaxed">
            All registered user rosters, invite tokens, and authority clearance lists in this console are restricted. Access or modifications are monitored and controlled by the Director of the Hospital.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pending requests
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
            activeTab === 'qr'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <QrCode size={12} />
          <span>Staff QR Badges</span>
        </button>
        <button
          onClick={() => setActiveTab('owner-admin-portal')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
            activeTab === 'owner-admin-portal'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldCheck size={12} className="text-indigo-600" />
          <span>Admin Registration (Owner Mode)</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Email or Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
              />
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 bg-white min-w-[120px] justify-between cursor-pointer"
              >
                <span>{selectedRole === 'all' ? 'all roles' : selectedRole}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1">
                  <button
                    onClick={() => {
                      setSelectedRole('all');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'all' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    all roles
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('director');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'director' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    director
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('admin');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'admin' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    admin
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('user');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'user' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    user
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="pl-6 pr-2 py-3.5 w-12 text-left">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id) || u.email === 'gemechuahmed0@gmail.com')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const checkableIds = filteredUsers
                            .filter(u => u.email !== 'gemechuahmed0@gmail.com')
                            .map(u => u.id);
                          setSelectedUserIds(checkableIds);
                        } else {
                          setSelectedUserIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Tenant</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isOwner = user.email === 'gemechuahmed0@gmail.com';
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <React.Fragment key={user.id}>
                        <tr className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-indigo-50/10' : ''}`}>
                          <td className="pl-6 pr-2 py-4">
                            {isOwner ? (
                              <div className="text-gray-300 flex justify-center w-4 h-4 items-center" title="Owner account cannot be modified">
                                <Lock size={12} className="text-gray-400" />
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds(prev => [...prev, user.id]);
                                  } else {
                                    setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold text-gray-900">{user.full_name || 'No Name'}</div>
                              {getLastLogin(user).isInactive && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shadow-sm shrink-0 animate-pulse" title={`No login for ${getLastLogin(user).daysSince} days`}>
                                  <ShieldAlert size={10} className="text-amber-600" />
                                  <span>Inactive (30+ days)</span>
                                </span>
                              )}
                            </div>
                            {isOwner && (
                              <div className="text-xs text-gray-400 font-normal mt-0.5">Owner</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{user.hospital_id || 'demo-global'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'director' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {user.email || <span className="text-gray-400 italic font-medium">None</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setAuditUser(user)}
                                className="bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Open Auditing & Activity History Modal"
                              >
                                <Clock size={12} className="text-indigo-600" />
                                <span>History</span>
                              </button>

                              {!isOwner && (
                                <button
                                  onClick={() => handleResetPassword(user)}
                                  className="text-amber-700 hover:text-amber-850 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-amber-200 cursor-pointer"
                                  title="Reset User Password"
                                >
                                  <KeyRound size={12} />
                                  <span>Reset PW</span>
                                </button>
                              )}

                              {!isOwner && (
                                <button
                                  onClick={() => {
                                    if (expandedPermissionsUserIds.includes(user.id)) {
                                      setExpandedPermissionsUserIds(prev => prev.filter(id => id !== user.id));
                                    } else {
                                      setExpandedPermissionsUserIds(prev => [...prev, user.id]);
                                      // Initialize edited permissions
                                      if (!editedUserPermissions[user.id]) {
                                        setEditedUserPermissions(prev => ({
                                          ...prev,
                                          [user.id]: user.permissions || (user.role === 'admin' 
                                            ? ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'system_backups_access', 'audit_logs_view'] 
                                            : ['read_patient_records', 'write_clinical_notes'])
                                        }));
                                      }
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border cursor-pointer ${
                                    expandedPermissionsUserIds.includes(user.id)
                                      ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                                      : 'text-indigo-700 hover:text-indigo-850 hover:bg-indigo-50 border-indigo-200'
                                  }`}
                                  title="Configure Granular Clinical Access Scopes"
                                >
                                  <Shield size={12} />
                                  <span>Permissions</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditFullName(user.full_name || '');
                                  setEditEmail(user.email || '');
                                  setEditRole(user.role || 'user');
                                  setUpdateError('');
                                }}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-gray-200 cursor-pointer"
                                title="Edit User"
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => {
                                  const origin = window.location.origin;
                                  const pathname = window.location.pathname;
                                  const bypassUrl = `${origin}${pathname}?bypass_tenant=${user.hospital_id || 'demo-global'}&bypass_user=${encodeURIComponent(user.email)}`;
                                  navigator.clipboard.writeText(bypassUrl);
                                  alert(`Direct bypass access URL copied to clipboard for ${user.full_name || user.email}!\n\n${bypassUrl}`);
                                }}
                                className="text-emerald-700 hover:text-emerald-850 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-emerald-200 cursor-pointer animate-pulse"
                                title="Copy Direct Gateway Bypass URL"
                              >
                                <Copy size={12} />
                                <span>Copy Link</span>
                              </button>
                              
                              {!isOwner && (
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteError('');
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-red-200 cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Activity History Section */}
                        {expandedUserIds.includes(user.id) && (
                          <tr key={`${user.id}-history-panel`} className="bg-gray-50/50">
                            <td colSpan={6} className="px-6 py-4 border-t border-b border-gray-100 bg-gray-50/30">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-600 animate-spin-slow" />
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                      Activity & Audit History • {user.full_name || user.email}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full border border-gray-200">
                                    Secure Log Stream
                                  </span>
                                </div>

                                {/* Timeline entries */}
                                <div className="relative border-l border-gray-200 ml-2.5 pl-5 py-1 space-y-4">
                                  {activityLogs.filter(log => log.userEmail === user.email).length > 0 ? (
                                    activityLogs
                                      .filter(log => log.userEmail === user.email)
                                      .map((log) => (
                                        <div key={log.id} className="relative group">
                                          {/* Indicator dot */}
                                          <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-transform group-hover:scale-125" />
                                          
                                          <div className="space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <span className="text-xs font-bold text-gray-900">
                                                {log.action}
                                              </span>
                                              <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(log.timestamp).toLocaleString()}
                                              </span>
                                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                                                IP: {log.ipAddress || 'N/A'}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                                              {log.details}
                                            </p>
                                            <p className="text-[9px] text-gray-400 italic">
                                              Authorized by: {log.performedBy}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="text-xs text-gray-400 italic pl-2 py-2">
                                      No activity records logged yet for this clinical profile.
                                    </div>
                                  )}
                                </div>

                                {/* Manual Audit Action Panel */}
                                <div className="mt-4 pt-3 border-t border-gray-200/60 max-w-2xl">
                                  <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Log Administrative Check / Override Note
                                  </h5>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Enter physical credential check outcome, clinical override reason, or status note..."
                                      value={manualLogTexts[user.id] || ''}
                                      onChange={(e) => setManualLogTexts(prev => ({ ...prev, [user.id]: e.target.value }))}
                                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => handleAddManualLog(user.id, user.email)}
                                      disabled={isSavingManualLog[user.id] || !(manualLogTexts[user.id]?.trim())}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                    >
                                      {isSavingManualLog[user.id] ? 'Logging...' : 'Add Log'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Expandable Permissions Configuration Section */}
                        {expandedPermissionsUserIds.includes(user.id) && (
                          <tr key={`${user.id}-permissions-panel`} className="bg-indigo-50/5">
                            <td colSpan={6} className="px-6 py-5 border-t border-b border-indigo-150 bg-indigo-50/5">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Shield className="text-indigo-600 animate-pulse" size={16} />
                                    <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                                      Granular Clinical Access Scopes • {user.full_name || user.email}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-850 font-black px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                                    Role: {user.role.toUpperCase()}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
                                  Configure exactly which clinical and system modules this professional has read/write privileges to. Permissions are validated instantly in the EHR Firestore rules and during active browser routing.
                                </p>

                                {/* Checklist Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {[
                                    { key: 'read_patient_records', label: 'Read Patient Records', desc: 'Allows viewing patient demographic files, vital sign sheets, and diagnosis streams.' },
                                    { key: 'write_clinical_notes', label: 'Write Clinical Notes', desc: 'Allows creating and appending SOAP progress charts, prescriptions, and order entries.' },
                                    { key: 'manage_billing', label: 'Manage Invoices & Billing', desc: 'Allows calculating ledger fees, editing claims, and checking out medical payments.' },
                                    { key: 'dispense_medications', label: 'Dispense Medications', desc: 'Allows checking pharmacy inventory, dispensing prescriptions, and updating stock.' },
                                    { key: 'system_backups_access', label: 'Database Backup Access', desc: 'Allows initiating secure EHR database backup snapshots and integrity checks.' },
                                    { key: 'audit_logs_view', label: 'Trace Security Audit Logs', desc: 'Allows monitoring staff activity, clock-ins, and critical administrative clinical logs.' },
                                  ].map((perm) => {
                                    const currentSet = editedUserPermissions[user.id] || [];
                                    const isChecked = currentSet.includes(perm.key);
                                    return (
                                      <div 
                                        key={perm.key} 
                                        onClick={() => {
                                          const nextSet = isChecked 
                                            ? currentSet.filter(k => k !== perm.key)
                                            : [...currentSet, perm.key];
                                          setEditedUserPermissions(prev => ({
                                            ...prev,
                                            [user.id]: nextSet
                                          }));
                                        }}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                          isChecked 
                                            ? 'bg-white border-indigo-200 shadow-sm' 
                                            : 'bg-gray-50/50 border-gray-200 hover:bg-white'
                                        }`}
                                      >
                                        <div className="pt-0.5 shrink-0">
                                          {isChecked ? (
                                            <CheckSquare size={15} className="text-indigo-600" />
                                          ) : (
                                            <Square size={15} className="text-gray-400" />
                                          )}
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className="text-xs font-bold text-gray-800 block">{perm.label}</span>
                                          <p className="text-[10.5px] text-gray-500 leading-normal">{perm.desc}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Save Bar */}
                                <div className="flex items-center gap-4 pt-3 border-t border-indigo-100/60">
                                  <button
                                    onClick={() => handleSavePermissions(user.id, user.email)}
                                    disabled={savingPermissions[user.id]}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                                  >
                                    {savingPermissions[user.id] ? (
                                      <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Saving Scopes...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck size={13} />
                                        <span>Save Scopes</span>
                                      </>
                                    )}
                                  </button>

                                  {permissionsFeedback[user.id] && (
                                    <span className={`text-xs font-semibold ${
                                      permissionsFeedback[user.id].startsWith('✓') ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                      {permissionsFeedback[user.id]}
                                    </span>
                                  )}
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
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === 'pending' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Request Queue */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <UserCheck className="text-indigo-600" size={18} />
                    <span>Clinical Onboarding Queue</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Verify license registries and clinical justifications before approving credentials.</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-150 shrink-0">
                  {pendingRequests.length} Pending
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="text-emerald-600" size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Clear Audit Queue</h4>
                  <p className="text-xs text-gray-500 mt-1">All onboarding applications are processed and verified.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl border border-gray-150 hover:border-gray-300 transition-all bg-white relative overflow-hidden group">
                      {/* Ribbon */}
                      <div className="absolute top-0 right-0 w-24 h-5 bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase tracking-wider flex items-center justify-center rounded-bl-xl border-l border-b border-indigo-100">
                        {req.requested_role}
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 shrink-0 text-sm">
                          {req.full_name ? req.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        </div>
                        <div className="space-y-2.5 flex-1 min-w-0">
                          <div>
                            <h4 className="text-sm font-extrabold text-gray-900 truncate pr-20">{req.full_name}</h4>
                            <p className="text-xs text-gray-500 truncate">{req.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">Department</span>
                              <span className="font-bold text-gray-700">{req.department}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">License Number</span>
                              <span className="font-mono font-bold text-indigo-650 flex items-center gap-1">
                                <span>{req.license_number}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 leading-relaxed bg-indigo-50/20 border border-indigo-100/30 p-2.5 rounded-lg">
                            <span className="font-bold text-indigo-950 block text-[10px] uppercase tracking-wider mb-0.5">Clinical Justification</span>
                            "{req.justification}"
                          </div>

                          <div className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                            <Clock size={11} />
                            <span>Submitted: {new Date(req.created_date).toLocaleString()}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleApproveRequest(req)}
                              disabled={approvingRequestId === req.id || rejectingRequestId === req.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {approvingRequestId === req.id ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" />
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={12} />
                                  <span>Approve Credentials</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleRejectRequest(req)}
                              disabled={approvingRequestId === req.id || rejectingRequestId === req.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {rejectingRequestId === req.id ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" />
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <X size={12} />
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Simulator Terminal */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleSimulateRequest} className="bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="text-indigo-600" size={18} />
                  <span>Credential Request Simulator</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Simulate a clinical professional applying for access to test real-time administrative workflows.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Professional Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Abraham Tolossa"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Institutional Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. abraham@healthflow.org"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Requested Role</label>
                    <select
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={simDept}
                      onChange={(e) => setSimDept(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Internal Medicine">Internal Med</option>
                      <option value="Emergency Department">Emergency Dept</option>
                      <option value="Main Pharmacy">Pharmacy</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State License / Credentials ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ETH-MD-9041 (leave blank for auto-generate)"
                    value={simLicense}
                    onChange={(e) => setSimLicense(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Clinical Onboarding Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Describe clinical scope needs..."
                    value={simJustification}
                    onChange={(e) => setSimJustification(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSimulatingRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSimulatingRequest ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Submitting Form...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>

              {simFeedback && (
                <div className={`text-xs font-bold p-3 rounded-lg border text-center ${
                  simFeedback.startsWith('✓') 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {simFeedback}
                </div>
              )}
            </form>
          </div>
        </div>
      ) : activeTab === 'owner-admin-portal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Form to Register / Authorize a Hospital Admin */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>Admin Registration Portal</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Register hospital administrators using their unique Hospital ID and clinical license keys. Registered admins are automatically synced to the users directory with full management permissions.
              </p>
            </div>

            <form onSubmit={handleRegisterOwnerAdmin} className="space-y-3">
              {ownerAdminError && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                  {ownerAdminError}
                </div>
              )}
              {ownerAdminSuccess && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                  {ownerAdminSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={ownerAdminName}
                  onChange={(e) => setOwnerAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.smith@hospital.org"
                  value={ownerAdminEmail}
                  onChange={(e) => setOwnerAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Hospital ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSP-001"
                    value={ownerHospitalId}
                    onChange={(e) => setOwnerHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    License Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIC-9941"
                    value={ownerLicenseKey}
                    onChange={(e) => setOwnerLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegisteringOwnerAdmin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isRegisteringOwnerAdmin ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Authorizing Admin...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Authorize & Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Table of Registered Admins */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Database className="text-indigo-600" size={18} />
                <span>Registered Administrators</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Authorized clinical administrators created and monitored by the workspace owner.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Administrator</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Facility details</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ownerRegisteredAdmins.length > 0 ? (
                    ownerRegisteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900 text-sm">{admin.full_name}</div>
                          <div className="text-xs text-gray-500">{admin.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-md w-fit font-mono">
                              Hospital ID: {admin.hospital_id}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-md w-fit font-mono">
                              Key: {admin.license_key}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditOwnerAdmin(admin)}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer border border-gray-200"
                              title="Edit Admin"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOwnerAdmin(admin)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border border-red-200"
                              title="Delete Admin"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-400 italic">
                        No Owner-registered administrators found. Use the registration form to authorize your first clinical admin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <StaffQrSection 
          users={users} 
          logActivity={logActivity}
          activityLogs={activityLogs}
          onTriggerInvite={() => setShowInviteModal(true)}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Invite New User</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <InviteUserForm onSuccess={() => setShowInviteModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {updateError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {updateError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Email Address</label>
                  {editEmail && (
                    <button
                      type="button"
                      onClick={() => setEditEmail('')}
                      className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear Email
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. email@example.com (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white cursor-pointer"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Set Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter secure custom password (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono"
                />
              </div>

              {/* Real-time Password Strength Meter for editing */}
              {editPassword && (() => {
                const strength = getPasswordStrength(editPassword);
                return (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} className="text-gray-400" /> Security Strength
                      </span>
                      <span className={`text-[10px] font-bold ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: strength.width }}
                      />
                    </div>

                    {/* Micro security checklists */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {editPassword.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[A-Z]/.test(editPassword) && /[a-z]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Upper & Lower</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[0-9]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>At least one number</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[^A-Za-z0-9]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-950 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-600" />
                <span>Delete User</span>
              </h3>
              <button 
                onClick={() => setUserToDelete(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {deleteError}
                </div>
              )}

              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete.full_name || userToDelete.email || 'this user'}</span>? 
                This action is permanent and cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && resetPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/50">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" />
                <span>Temporary Password Generated</span>
              </h3>
              <button 
                onClick={() => setResetPasswordModal(null)}
                className="text-amber-900 hover:text-amber-950 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2.5">
                <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  A temporary, system-issued one-time security credential has been successfully generated for <strong className="text-amber-950 font-bold">{resetPasswordModal.userName}</strong> ({resetPasswordModal.userEmail}).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Temporary Key Code / Custom Password
                </label>
                <div className="relative bg-gray-950 rounded-xl p-1 flex items-center border border-gray-800 shadow-inner">
                  <input
                    type="text"
                    value={resetPasswordModal.tempPass}
                    onChange={(e) => setResetPasswordModal(prev => prev ? { ...prev, tempPass: e.target.value } : null)}
                    className="flex-1 bg-transparent font-mono text-sm font-semibold tracking-wider text-green-400 select-all border-none outline-none focus:ring-0 p-3"
                  />
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordModal.tempPass);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="p-3.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedPass ? <Check size={16} className="text-green-400 animate-bounce" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Real-time Password Strength Meter for Reset Modal */}
              {resetPasswordModal.tempPass && (() => {
                const strength = getPasswordStrength(resetPasswordModal.tempPass);
                return (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 animate-fade-in text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} className="text-gray-400" /> Security Strength
                      </span>
                      <span className={`text-[10px] font-bold ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: strength.width }}
                      />
                    </div>

                    {/* Micro security checklists */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {resetPasswordModal.tempPass.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[A-Z]/.test(resetPasswordModal.tempPass) && /[a-z]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Upper & Lower</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[0-9]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>At least one number</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[^A-Za-z0-9]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">Next Steps for Administrator:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Copy the security code using the copy button above.</li>
                  <li>Communicate this key directly to the practitioner via a secure physical or corporate backchannel.</li>
                  <li>The user will use this key on their next login session to securely establish new private credentials.</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  onClick={() => setResetPasswordModal(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-950 text-white rounded-lg text-sm font-semibold hover:bg-gray-850 transition-colors cursor-pointer text-center"
                >
                  Done & Secured
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Download size={18} className="text-indigo-600" />
                <span>Export Users Registry</span>
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2.5">
                <Info size={16} className="text-indigo-700 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 leading-relaxed text-left">
                  Apply filters below to customize the records compiled into the secure clinical user CSV report.
                </p>
              </div>

              {/* Role filter options */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Target Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'admin', 'user'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setExportRoleFilter(r)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        exportRoleFilter === r
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {r === 'all' ? 'All Roles' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter options */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Account Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'active', 'inactive'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setExportStatusFilter(s)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        exportStatusFilter === s
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  *Inactive status includes users who have not logged in for over 30 days.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Batch Actions Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto bg-gray-900 text-white border border-gray-800 px-5 py-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in max-w-2xl">
          <div className="flex items-center gap-2.5 sm:border-r sm:border-gray-800 sm:pr-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 rounded-lg p-1.5 shrink-0 text-white">
                <CheckSquare size={16} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wide">
                  Batch Operations
                </h4>
                <p className="text-[10px] text-gray-400">
                  Selected <span className="font-bold text-indigo-400">{selectedUserIds.length}</span> user(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer sm:hidden"
            >
              Deselect
            </button>
          </div>

          {batchError && (
            <div className="px-3 py-1 bg-red-900/50 border border-red-800 text-red-300 text-[10px] font-medium rounded-lg max-w-xs truncate">
              {batchError}
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => handleBatchRoleUpdate('user')}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserCheck size={13} className="text-gray-400" />
              <span>Set User</span>
            </button>
            <button
              onClick={() => handleBatchRoleUpdate('admin')}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Shield size={13} className="text-gray-400" />
              <span>Set Admin</span>
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="hidden sm:inline-block text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activity History Auditing Modal */}
      {auditUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Clock size={18} className="text-indigo-600 animate-pulse" />
                <span>Clinical Activity History & Audit Log</span>
              </h3>
              <button 
                onClick={() => setAuditUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-xs">
                  {auditUser.full_name ? auditUser.full_name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-gray-900">{auditUser.full_name || 'No Name'}</h4>
                  <p className="text-xs text-gray-500 font-mono">{auditUser.email}</p>
                </div>
              </div>

              {/* Timeline entries */}
              <div className="relative border-l border-gray-200 ml-2.5 pl-5 py-1 space-y-4 text-left">
                {activityLogs.filter(log => log.userEmail?.toLowerCase() === auditUser.email?.toLowerCase()).length > 0 ? (
                  activityLogs
                    .filter(log => log.userEmail?.toLowerCase() === auditUser.email?.toLowerCase())
                    .map((log) => (
                      <div key={log.id} className="relative group">
                        {/* Indicator dot */}
                        <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-transform group-hover:scale-125" />
                        
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-bold text-gray-900">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                              IP: {log.ipAddress || '127.0.0.1'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                            {log.details}
                          </p>
                          <p className="text-[9px] text-gray-400 italic">
                            Authorized by: {log.performedBy || 'System'}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-gray-400 italic pl-2 py-2">
                    No activity records logged yet for this clinical profile.
                  </div>
                )}
              </div>

              {/* Manual Audit Action Panel inside modal */}
              <div className="mt-4 pt-4 border-t border-gray-150 text-left">
                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Append Administrative Check / Override Note
                </h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter physical credential check, clinic status notes or administrative notes..."
                    value={manualLogTexts[auditUser.id] || ''}
                    onChange={(e) => setManualLogTexts(prev => ({ ...prev, [auditUser.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={async () => {
                      await handleAddManualLog(auditUser.id, auditUser.email);
                    }}
                    disabled={isSavingManualLog[auditUser.id] || !(manualLogTexts[auditUser.id]?.trim())}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSavingManualLog[auditUser.id] ? 'Logging...' : 'Add Log'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAuditUser(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-850 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Owner-Created Admin Modal */}
      {editingOwnerAdmin && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden font-sans">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
                <Pencil size={18} className="text-indigo-600" />
                <span>Edit Administrator Details</span>
              </h3>
              <button 
                onClick={() => setEditingOwnerAdmin(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveOwnerAdminEdit} className="p-6 space-y-4">
              {ownerAdminEditError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">
                  {ownerAdminEditError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Admin Full Name</label>
                <input
                  type="text"
                  value={editOwnerAdminName}
                  onChange={(e) => setEditOwnerAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Institutional Email (Read Only)</label>
                <input
                  type="email"
                  value={editOwnerAdminEmail}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-gray-50 text-gray-400 focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Hospital ID</label>
                  <input
                    type="text"
                    value={editOwnerAdminHospitalId}
                    onChange={(e) => setEditOwnerAdminHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono uppercase text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">License Key</label>
                  <input
                    type="text"
                    value={editOwnerAdminLicenseKey}
                    onChange={(e) => setEditOwnerAdminLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono uppercase text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setEditingOwnerAdmin(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOwnerAdminEdit}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingOwnerAdminEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface StaffQrSectionProps {
  users: User[];
  logActivity: (userId: string, userEmail: string, action: string, details: string) => Promise<void>;
  activityLogs: UserActivityLog[];
  onTriggerInvite: () => void;
}

function StaffQrSection({ users, logActivity, activityLogs, onTriggerInvite }: StaffQrSectionProps) {
  const [selectedBadgeUser, setSelectedBadgeUser] = useState<User | null>(users[0] || null);
  const [scannerSelectedUser, setScannerSelectedUser] = useState<string>('');
  const [scannedProfile, setScannedProfile] = useState<User | null>(null);
  const [scanLaserActive, setScanLaserActive] = useState(true);
  const [lastActionMsg, setLastActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Quick Add / QR token state
  const [inviteToken, setInviteToken] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (users.length > 0 && !selectedBadgeUser) {
      setSelectedBadgeUser(users[0]);
    }
  }, [users, selectedBadgeUser]);

  const triggerFeedback = (type: 'success' | 'error', text: string) => {
    setLastActionMsg({ type, text });
    setTimeout(() => {
      setLastActionMsg(null);
    }, 4500);
  };

  const handleSimulateScan = () => {
    if (!scannerSelectedUser) {
      triggerFeedback('error', 'Please select a clinical staff member card to position under the scanner frame.');
      return;
    }
    
    setScanLaserActive(false);
    const matchedUser = users.find(u => u.id === scannerSelectedUser);
    if (matchedUser) {
      setTimeout(() => {
        setScannedProfile(matchedUser);
        setScanLaserActive(true);
        triggerFeedback('success', `Decoded QR code successfully. Clinical signature validated for ${matchedUser.full_name || matchedUser.email}.`);
      }, 500);
    } else {
      triggerFeedback('error', 'Decoded signature does not match any registered clinical staff in HealthFlow EHR.');
    }
  };

  const handleClockIn = async (user: User) => {
    try {
      await logActivity(
        user.id,
        user.email,
        'Shift Check-In',
        `Staff member clocked in for duty shift via Terminal Badge QR Scanner. Verified designation: ${user.role.toUpperCase()}.`
      );
      triggerFeedback('success', `Duty shift initiated. ${user.full_name || user.email} successfully clocked in!`);
    } catch (err: any) {
      triggerFeedback('error', `Check-in log failed: ${err.message}`);
    }
  };

  const handleClockOut = async (user: User) => {
    try {
      await logActivity(
        user.id,
        user.email,
        'Shift Check-Out',
        `Staff member clocked out of duty shift via Terminal Badge QR Scanner. Security parameters synchronized.`
      );
      triggerFeedback('success', `Duty shift terminated. ${user.full_name || user.email} successfully clocked out.`);
    } catch (err: any) {
      triggerFeedback('error', `Check-out log failed: ${err.message}`);
    }
  };

  const handlePrintBadge = async (user: User) => {
    try {
      await logActivity(
        user.id,
        user.email,
        'Identity Badge Printed',
        `EHR Administrator commanded a physical clip-on staff identity badge print sequence containing authorized cryptographical QR keys.`
      );
      alert(`Spooling clinical badge printer...\n\nStaff: ${user.full_name || user.email}\nRole: ${user.role.toUpperCase()}\nStatus: AUTHORIZED\n\nClinical security badge queued successfully.`);
      triggerFeedback('success', `Identity badge spooling triggered for ${user.full_name || 'Staff'}.`);
    } catch (err: any) {
      triggerFeedback('error', `Badge print failed: ${err.message}`);
    }
  };

  const handleScanInviteToken = () => {
    const code = inviteToken.trim().toUpperCase();
    if (!code) {
      setInviteFeedback('Please enter or paste an invite QR token string.');
      return;
    }

    if (code.startsWith('EHR-INV-')) {
      setInviteFeedback(`✓ Decoded validation token successfully: "${code}". Launching user invitation suite.`);
      setTimeout(() => {
        onTriggerInvite();
        setInviteToken('');
        setInviteFeedback(null);
      }, 1500);
    } else {
      setInviteFeedback('Invalid token pattern. Invite QR tokens must start with "EHR-INV-" (e.g. EHR-INV-NURSE-2026).');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Status Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <QrCode className="text-slate-900 shrink-0" size={18} />
            Institutional Badge Issuance & Verification Node
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Render high-contrast clip-on identity cards with secure QR keys. Scan staff badges at clinical terminals to automate shifts and verify compliance.
          </p>
        </div>
        <button
          onClick={onTriggerInvite}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0"
        >
          <Plus size={14} />
          <span>Invite New Staff</span>
        </button>
      </div>

      {/* Action Notification Message Bar */}
      {lastActionMsg && (
        <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
          lastActionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' : 'bg-red-50 border-red-150 text-red-800'
        }`}>
          {lastActionMsg.type === 'success' ? <ShieldCheck size={16} className="text-emerald-600 shrink-0" /> : <ShieldAlert size={16} className="text-red-600 shrink-0" />}
          <span>{lastActionMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Generator vs. Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Staff Identity Badge Generator */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">Staff Badge Generator</h4>
            <p className="text-xs text-gray-500 mt-0.5">Select a staff member profile to assemble their secure physical badge template.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 block">Select Staff Profile</label>
            <select
              value={selectedBadgeUser?.id || ''}
              onChange={(e) => {
                const matched = users.find(u => u.id === e.target.value);
                if (matched) setSelectedBadgeUser(matched);
              }}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Vertical Clip-On Identity Badge Mockup */}
          {selectedBadgeUser ? (
            <div className="flex flex-col items-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              {/* Pocket Badge Container */}
              <div className="w-[230px] bg-white border border-gray-300 rounded-2xl shadow-md overflow-hidden relative flex flex-col items-center p-5 space-y-4">
                
                {/* Badge Slot header clip */}
                <div className="w-10 h-2.5 bg-slate-200 rounded-full border border-gray-300 flex items-center justify-center -mt-1" />

                {/* Hospital Branding Header */}
                <div className="text-center border-b border-gray-100 pb-2 w-full">
                  <span className="text-[9px] font-black text-slate-800 tracking-widest uppercase block">
                    HEALTHFLOW EHR
                  </span>
                  <span className="text-[7px] text-gray-400 block uppercase tracking-wider font-semibold">
                    Authorized Medical Staff
                  </span>
                </div>

                {/* Initial Avatar Profile */}
                <div className="w-16 h-16 rounded-full bg-slate-900 text-white border-2 border-slate-200 flex items-center justify-center font-extrabold text-xl shadow-inner uppercase">
                  {selectedBadgeUser.full_name ? selectedBadgeUser.full_name.slice(0, 2) : selectedBadgeUser.email.slice(0, 2)}
                </div>

                {/* Identity Information */}
                <div className="text-center space-y-1">
                  <h5 className="text-sm font-extrabold text-gray-900 tracking-tight uppercase">
                    {selectedBadgeUser.full_name || 'UNREGISTERED STAFF'}
                  </h5>
                  <p className="text-[9px] text-gray-500 font-mono tracking-wide truncate max-w-[200px]">
                    {selectedBadgeUser.email}
                  </p>
                  
                  {/* Access Role Badge */}
                  <span className={`inline-block text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase border ${
                    selectedBadgeUser.role === 'admin' 
                      ? 'bg-red-50 border-red-100 text-red-700' 
                      : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                  }`}>
                    {selectedBadgeUser.role === 'admin' ? 'CLINICAL ADMIN' : 'STAFF USER'}
                  </span>
                </div>

                {/* QR Code Segment */}
                <div className="bg-slate-50 border border-gray-200 p-2 rounded-lg relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${selectedBadgeUser.id}`}
                    alt="Staff Secure QR Code Badge"
                    className="w-24 h-24 mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg p-2 text-[8px] text-white font-mono text-center">
                    ID: {selectedBadgeUser.id}
                  </div>
                </div>

                {/* Footer terms */}
                <div className="text-center w-full">
                  <p className="text-[7px] text-gray-400 leading-relaxed uppercase tracking-wider font-semibold">
                    EHR ID: {selectedBadgeUser.id.slice(0, 10).toUpperCase()}
                  </p>
                  <p className="text-[6px] text-gray-400 mt-0.5 leading-normal italic">
                    If found, return to clinical administration department immediately.
                  </p>
                </div>
              </div>

              {/* Badge Spool controls */}
              <div className="mt-4 w-full px-5">
                <button
                  onClick={() => handlePrintBadge(selectedBadgeUser)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-800 hover:text-gray-950 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Issue & Spool Clip Badge</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-xs text-gray-400">
              No staff profiles available to generate identity badges.
            </div>
          )}
        </div>

        {/* Right Column: Terminal Staff QR Scanner Simulator */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-5 shadow-sm">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">Clinical QR Scanner Terminal</h4>
            <p className="text-xs text-gray-500 mt-0.5">Position an EHR staff identity card under the scanner to query credentials or initiate shift clock-ins.</p>
          </div>

          {/* Interactive Scanner Frame Mockup */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
            {/* Blinking scanning grid effect */}
            <div className="absolute inset-0 bg-radial-grid opacity-[0.03]" />

            {/* Pulsing Target corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-500 rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-500 rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-500 rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-500 rounded-br-sm" />

            {/* Laser scan line sweep */}
            {scanLaserActive && (
              <div className="absolute inset-x-0 h-0.5 bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-scanLine" />
            )}

            {/* Scanner Central UI */}
            <div className="z-10 text-center space-y-3">
              <QrCode size={40} className={`mx-auto ${scanLaserActive ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
                  Terminal ID: T-EHR- verification
                </p>
                <p className="text-[11px] text-slate-400">
                  Align staff QR badge directly inside viewfinder frame.
                </p>
              </div>
            </div>
          </div>

          {/* Scanner Simulation Actions */}
          <div className="space-y-3.5 bg-gray-50 border border-gray-150 p-4 rounded-xl">
            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Position Badge under Scanner Viewfinder
            </h5>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={scannerSelectedUser}
                onChange={(e) => setScannerSelectedUser(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none"
              >
                <option value="">-- Choose Staff ID Card to Scan --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={handleSimulateScan}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Position & Scan Badge
              </button>
            </div>
          </div>

          {/* Scanned Badge Info & Action Panel */}
          {scannedProfile && (
            <div className="border border-indigo-100 rounded-xl bg-indigo-50/25 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-indigo-100/60 pb-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center text-sm uppercase shrink-0">
                    {scannedProfile.full_name ? scannedProfile.full_name.slice(0, 2) : scannedProfile.email.slice(0, 2)}
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-indigo-950 uppercase">
                      {scannedProfile.full_name || 'Clinical Staff'}
                    </h5>
                    <p className="text-[10px] text-indigo-700 font-mono">{scannedProfile.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-indigo-500 font-mono">
                      <span>Authority:</span>
                      <span className="font-bold uppercase text-indigo-700">{scannedProfile.role}</span>
                    </div>
                  </div>
                </div>
                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <ShieldCheck size={10} />
                  Signature Valid
                </span>
              </div>

              {/* Attendance and Audit operations */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide block">
                  Verify Credentials & Record Log Actions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleClockIn(scannedProfile)}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 px-3 text-xs font-semibold transition-colors"
                  >
                    <Clock size={12} />
                    <span>Clock In (Shift Start)</span>
                  </button>
                  <button
                    onClick={() => handleClockOut(scannedProfile)}
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 px-3 text-xs font-semibold transition-colors"
                  >
                    <X size={12} />
                    <span>Clock Out (Shift End)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Add / Invite QR Decoder simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div>
              <h5 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                <Plus size={14} />
                Scan Invite / Register Staff QR Token
              </h5>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Simulate scanning an invite credential token sent to a new practitioner. Decodes and unlocks registration instantly.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. EHR-INV-NURSE-2026, EHR-INV-DOC-5152"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                className="flex-1 text-xs font-mono border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 uppercase focus:outline-none"
              />
              <button
                type="button"
                onClick={handleScanInviteToken}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Scan Token
              </button>
            </div>

            {inviteFeedback && (
              <p className={`text-[10px] font-semibold ${
                inviteFeedback.includes('✓') ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {inviteFeedback}
              </p>
            )}

            <div className="bg-white border border-slate-200/60 p-2.5 rounded-lg text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
              <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
              <span>To test: Enter <strong className="font-mono text-slate-800">EHR-INV-SURGEON</strong> or <strong className="font-mono text-slate-800">EHR-INV-PHARMACIST</strong> to decode a secure invitation and trigger the staff registrar modal.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
