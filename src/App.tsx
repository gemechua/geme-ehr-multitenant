import { useState, useEffect } from 'react';
import Home from './components/Home';
import Overview from './components/Overview';
import UserList from './components/UserList';
import HumanResources from './components/HumanResources';
import MonthlyReports from './components/MonthlyReports';
import ClinicalKPIs from './components/ClinicalKPIs';
import AdminDashboard from './components/AdminDashboard';
import Sidebar from './components/Sidebar';
import SettingsTab from './components/SettingsTab';
import DataExplorer from './components/DataExplorer';
import SeoGeo from './components/SeoGeo';
import SocialContent from './components/SocialContent';
import AnalyticsTab from './components/AnalyticsTab';
import DomainsTab from './components/DomainsTab';
import IntegrationsTab from './components/IntegrationsTab';
import SecurityTab from './components/SecurityTab';
import CodeTab from './components/CodeTab';
import AgentsTab from './components/AgentsTab';
import AutomationsTab from './components/AutomationsTab';
import LogsTab from './components/LogsTab';
import ApiTab from './components/ApiTab';
import PolicyTab from './components/PolicyTab';
import DataAccessTab from './components/DataAccessTab';
import PrivacyLock from './components/PrivacyLock';
import { ToastContainer, ToastItem } from './components/Toast';
import LicenseManager, { PRE_SEEDED_TENANTS } from './components/LicenseManager';
import HospitalPortalGateway from './components/HospitalPortalGateway';
import BackupsTab from './components/BackupsTab';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './lib/firebase';

import { 
  Database, BarChart3, Globe, Plug, Shield, Code, Bot, 
  Zap, FileText, Braces, Settings, CheckCircle2, Lock
} from 'lucide-react';

const PRIVACY_TABS = [
  'Settings',
  'Policy',
  'Data Access',
  'Backups',
  'Analytics',
  'SEO & GEO',
  'Social content',
  'Domains',
  'Integrations',
  'Security',
  'Code',
  'Agents',
  'Automations',
  'Logs',
  'API',
  'License Manager'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [activeHospital, setActiveHospital] = useState<{
    id: string;
    name: string;
    hospital_unique_number: string;
    license_key: string;
  } | null>(() => {
    const saved = localStorage.getItem('active_hospital_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  const [isBypassedToOwner, setIsBypassedToOwner] = useState(false);
  const [isPrivacyUnlocked, setIsPrivacyUnlocked] = useState(false);
  const [isUsersUnlocked, setIsUsersUnlocked] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const checkBypass = async () => {
      const params = new URLSearchParams(window.location.search);
      const bypassTenant = params.get('bypass_tenant');
      const bypassUser = params.get('bypass_user');
      
      if (bypassTenant && bypassUser) {
        try {
          addToast('info', 'Authenticating direct bypass access link...');
          
          // 1. Query users collection in Firestore to see if this user is registered for the organization
          const usersRef = collection(db, 'users');
          const qUser = query(
            usersRef,
            where('hospital_id', '==', bypassTenant),
            where('email', '==', bypassUser.trim())
          );
          const userSnap = await getDocs(qUser);
          
          if (userSnap.empty) {
            addToast('error', `Bypass Denied: User "${bypassUser}" is not registered under organization "${bypassTenant}".`);
            // Clean up query parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('bypass_tenant');
            url.searchParams.delete('bypass_user');
            window.history.replaceState({}, '', url.toString());
            return;
          }

          const userDoc = userSnap.docs[0].data();
          
          // 2. Query license details for this hospital_id
          const licensesRef = collection(db, 'licenses');
          const qLic = query(licensesRef, where('hospital_id', '==', bypassTenant));
          const licSnap = await getDocs(qLic);
          
          let validLicense: any = null;
          if (!licSnap.empty) {
            validLicense = { id: licSnap.docs[0].id, ...licSnap.docs[0].data() };
          } else {
            // Fallback to pre-seeded list
            const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === bypassTenant);
            if (localMatch) {
              validLicense = localMatch;
            }
          }

          if (!validLicense || validLicense.is_active === false) {
            addToast('error', 'Bypass Failed: The organization license is inactive or expired.');
            const url = new URL(window.location.href);
            url.searchParams.delete('bypass_tenant');
            url.searchParams.delete('bypass_user');
            window.history.replaceState({}, '', url.toString());
            return;
          }

          // 3. Resolve hospital name
          let hospitalName = `Hospital tenant ${bypassTenant}`;
          const hospitalsRef = collection(db, 'hospitals');
          const hospQ = query(hospitalsRef, where('hospital_unique_number', '==', bypassTenant));
          const hospSnapshot = await getDocs(hospQ);
          if (!hospSnapshot.empty) {
            hospitalName = hospSnapshot.docs[0].data().name;
          } else {
            const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === bypassTenant);
            if (localMatch) {
              hospitalName = localMatch.name;
            }
          }

          // Log in the user
          const sessionObj = {
            id: validLicense.id || bypassTenant,
            name: hospitalName,
            hospital_unique_number: bypassTenant,
            license_key: validLicense.license_key || ''
          };

          localStorage.setItem('active_hospital_tenant', JSON.stringify(sessionObj));
          setActiveHospital(sessionObj);
          setActiveTab('Home');
          
          // Unlock appropriate console access level if they are an admin or director
          if (userDoc.role === 'admin' || userDoc.role === 'director') {
            setIsPrivacyUnlocked(true);
          }
          if (userDoc.role === 'director') {
            setIsUsersUnlocked(true);
          }

          addToast('success', `✓ Access Authorized: Welcome back, ${userDoc.full_name || bypassUser}! Gateway bypassed successfully.`);

          // Clear query params so we don't pollute URL
          const url = new URL(window.location.href);
          url.searchParams.delete('bypass_tenant');
          url.searchParams.delete('bypass_user');
          window.history.replaceState({}, '', url.toString());

        } catch (err: any) {
          console.error("Bypass error:", err);
          addToast('error', `Bypass error: ${err.message}`);
        }
      }
    };

    checkBypass();
  }, []);

  const renderContent = () => {
    // Intercept with password lock screen if accessing a restricted privacy module
    if (PRIVACY_TABS.includes(activeTab) && !isPrivacyUnlocked) {
      const ownerPasscode = import.meta.env.VITE_OWNER_PASSCODE || 'fussilat9';
      return (
        <PrivacyLock 
          expectedPasscodes={[ownerPasscode]}
          title="Owner-Restricted Console"
          description="This configuration area containing settings, policies, and keys is restricted and controlled by the workspace owner only."
          ownerOnly={true}
          onUnlockSuccess={() => {
            setIsPrivacyUnlocked(true);
            addToast('success', 'Access granted! Privacy modules successfully unlocked.');
          }}
          onUnlockFailure={(enteredPass) => {
            addToast('error', `Access Denied: Incorrect passcode "${enteredPass}". Please try again.`);
          }}
        />
      );
    }

    // Intercept with passcode 'umer' if accessing the locked users division
    if (activeTab === 'Users' && !isUsersUnlocked) {
      const directorPasscode = import.meta.env.VITE_DIRECTOR_PASSCODE || 'umer';
      return (
        <PrivacyLock 
          expectedPasscodes={[directorPasscode]}
          title="Director of Hospital Console"
          description="The users list and authorization records are restricted and controlled by the Director of the Hospital only."
          badgeLabel="Director Only"
          onUnlockSuccess={() => {
            setIsUsersUnlocked(true);
            addToast('success', 'Access granted! Users division successfully unlocked.');
          }}
          onUnlockFailure={(enteredPass) => {
            addToast('error', `Access Denied: Incorrect passcode "${enteredPass}". Please try again.`);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'Home':
        return (
          <Home setActiveTab={setActiveTab} />
        );

      case 'Overview':
        return (
          <Overview />
        );
      
      case 'Users':
        return (
          <div className="space-y-8">
            <UserList />
          </div>
        );

      case 'Human Resources':
        return (
          <div className="space-y-8">
            <HumanResources />
          </div>
        );

      case 'Monthly Reports':
        return (
          <div className="space-y-8">
            <MonthlyReports />
          </div>
        );

      case 'Clinical & Service KPIs':
        return (
          <div className="space-y-8">
            <ClinicalKPIs />
          </div>
        );

      case 'Admin Dashboard':
        return (
          <div className="space-y-8">
            <AdminDashboard />
          </div>
        );

      case 'Data':
        return (
          <div className="space-y-8">
            <DataExplorer />
          </div>
        );

      case 'Settings':
        return (
          <SettingsTab />
        );

      case 'Analytics':
        return (
          <AnalyticsTab />
        );

      case 'SEO & GEO':
        return (
          <SeoGeo />
        );

      case 'Social content':
        return (
          <SocialContent />
        );

      case 'Domains':
        return (
          <DomainsTab />
        );

      case 'Integrations':
        return (
          <IntegrationsTab />
        );

      case 'Security':
        return (
          <SecurityTab />
        );

      case 'Code':
        return (
          <CodeTab />
        );

      case 'Agents':
        return (
          <AgentsTab />
        );

      case 'Automations':
        return (
          <AutomationsTab />
        );

      case 'Logs':
        return (
          <LogsTab />
        );

      case 'API':
        return (
          <ApiTab />
        );

      case 'Policy':
        return (
          <PolicyTab />
        );

      case 'Data Access':
        return (
          <DataAccessTab />
        );

      case 'Backups':
        return (
          <BackupsTab />
        );

      case 'License Manager':
        return (
          <LicenseManager />
        );

      default:
        return (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm max-w-4xl">
            <div className="mx-auto w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 text-gray-400 mb-4">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{activeTab} Section</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              The {activeTab} service is fully modeled in our schema blueprint. Live production integrations can be deployed on-demand.
            </p>
            <button 
              onClick={() => setActiveTab('Overview')} 
              className="px-4 py-2 bg-gray-950 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Overview
            </button>
          </div>
        );
    }
  };

  const handleLogoutHospital = () => {
    localStorage.removeItem('active_hospital_tenant');
    setActiveHospital(null);
    setIsBypassedToOwner(false);
    setActiveTab('Home');
    addToast('info', 'Institutional tenant session terminated securely.');
  };

  if (!activeHospital && !isBypassedToOwner) {
    return (
      <div className="min-h-screen bg-slate-950">
        <HospitalPortalGateway 
          onLoginSuccess={(hosp) => {
            setActiveHospital(hosp);
            setActiveTab('Home');
            addToast('success', `Welcome back to ${hosp.name}. Active licensed session initialized.`);
          }}
          onBypassToOwner={() => {
            setIsBypassedToOwner(true);
            setActiveTab('License Manager');
            addToast('info', 'Platform Owner console unlocked. Authenticating control authority.');
          }}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeHospital={activeHospital}
        onLogoutHospital={handleLogoutHospital}
        userRole={isBypassedToOwner ? 'owner' : 'user'}
      />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{activeTab}</h1>
            {activeHospital && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                  Tenant: {activeHospital.name} ({activeHospital.hospital_unique_number})
                </span>
              </div>
            )}
            {PRIVACY_TABS.includes(activeTab) && isPrivacyUnlocked && (
              <button
                onClick={() => {
                  setIsPrivacyUnlocked(false);
                  setActiveTab('Overview');
                  addToast('info', 'Secure privacy session cleared and locked.');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Lock size={12} />
                Lock Privacy Session
              </button>
            )}
            {activeTab === 'Users' && isUsersUnlocked && (
              <button
                onClick={() => {
                  setIsUsersUnlocked(false);
                  setActiveTab('Overview');
                  addToast('info', 'Secure users session cleared and locked.');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Lock size={12} />
                Lock Users Session
              </button>
            )}
          </header>

          {renderContent()}
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
