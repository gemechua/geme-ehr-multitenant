import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Database, BarChart3, Megaphone, 
  Globe, Plug, Shield, Code, Bot, Zap, FileText, Braces, Settings, ShieldCheck,
  Search, ChevronDown, ChevronRight, Lock, Home as HomeIcon,
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Building, Briefcase, FileSpreadsheet,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  activeHospital: any;
  onLogoutHospital: () => void;
  userRole?: 'owner' | 'user';
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed,
  activeHospital,
  onLogoutHospital,
  userRole = 'user'
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;
    const isFull = document.fullscreenElement || doc.webkitFullscreenElement;

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err: any) => {
          console.error(`Error attempting to enable fullscreen: ${err?.message}`);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else {
        console.warn('Fullscreen API is not supported in this browser or iframe.');
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err: any) => {
          console.error(`Error attempting to exit fullscreen: ${err?.message}`);
        });
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const handleSearchIconClick = () => {
    setIsSidebarCollapsed(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, show: true },
    { name: 'Overview', icon: LayoutDashboard, show: true },
    { name: 'Admin Dashboard', icon: ShieldCheck, show: true },
    { name: 'Users', icon: Users, show: true },
    { name: 'Human Resources', icon: Briefcase, show: true },
    { name: 'Monthly Reports', icon: FileSpreadsheet, show: true },
    { name: 'Clinical & Service KPIs', icon: Activity, show: true },
    { name: 'Data', icon: Database, show: true },
    { 
      name: 'Privacy', 
      icon: Lock, 
      hasSubmenu: true, 
      show: userRole === 'owner',
      submenu: [
        { name: 'Policy' },
        { name: 'Data Access' },
        { name: 'Backups' },
        { name: 'Analytics' },
        { name: 'SEO & GEO' },
        { name: 'Social content' },
        { name: 'Domains' },
        { name: 'Integrations' },
        { name: 'Security' },
        { name: 'Code' },
        { name: 'Agents' },
        { name: 'Automations' },
        { name: 'Logs' },
        { name: 'API' }
      ] 
    },
    { name: 'Settings', icon: Settings, show: userRole === 'owner' },
    { name: 'License Manager', icon: Shield, show: userRole === 'owner' },
  ];

  // Filter items based on sidebar search and userRole visibility rules
  const filteredItems = menuItems.filter(item => {
    // Only display links that are permitted for the current userRole
    if (!item.show) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (matchesSearch) return true;

    if (item.hasSubmenu && item.submenu) {
      return item.submenu.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return false;
  });

  const handleItemClick = (name: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      if (name === 'Privacy') {
        setIsPrivacyExpanded(true);
      } else {
        setActiveTab(name);
      }
      return;
    }

    if (name === 'Privacy') {
      setIsPrivacyExpanded(!isPrivacyExpanded);
    } else {
      setActiveTab(name);
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 overflow-y-auto shrink-0 transition-all duration-300 ${
      isSidebarCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-4'
    }`}>
      {/* Header controls for collapsing side nav & maximizing/minimizing screen layout */}
      <div className={`flex items-center justify-between mb-5 ${isSidebarCollapsed ? 'flex-col gap-3' : 'px-2'}`}>
        {!isSidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 tracking-tight transition-opacity duration-300">
            Dashboard
          </h1>
        )}
        <div className={`flex items-center gap-1 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
          {/* Screen Size Minimize / Maximize (Fullscreen Toggle) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Minimize Screen Size" : "Maximize Screen Size (Fullscreen)"}
            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-950 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            id="fullscreen-toggle"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          {/* Side Nav Minimize / Maximize (Collapse Toggle) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Maximize Side Navigation" : "Minimize Side Navigation"}
            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-950 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            id="sidebar-toggle"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Sidebar Search */}
      {isSidebarCollapsed ? (
        <button
          onClick={handleSearchIconClick}
          title="Search navigation items"
          className="mx-auto mb-5 p-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-500 hover:text-gray-950 rounded-xl transition-all flex items-center justify-center w-10 h-10 cursor-pointer shadow-sm"
        >
          <Search size={16} />
        </button>
      ) : (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-gray-200 focus:ring-1 focus:ring-gray-200 transition-colors"
          />
        </div>
      )}

      {/* Navigation list */}
      <div className="space-y-1 flex-1">
        {filteredItems.map((item) => {
          const isItemActive = activeTab === item.name || 
            (item.hasSubmenu && item.submenu?.some(sub => sub.name === activeTab));
          
          return (
            <div key={item.name} className="space-y-1">
              {/* Main Button */}
              <button
                onClick={() => handleItemClick(item.name)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center transition-all duration-200 ${
                  isSidebarCollapsed 
                    ? 'justify-center p-2.5 mx-auto w-11 h-11 rounded-xl' 
                    : 'justify-between w-full p-2.5 rounded-lg text-sm'
                } ${
                  isItemActive 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isItemActive ? 'text-gray-950' : 'text-gray-400'} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </div>

                {!isSidebarCollapsed && item.hasSubmenu && (
                  <div className="flex items-center gap-1.5">
                    {item.name === 'Privacy' 
                      ? (isPrivacyExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />)
                      : null
                    }
                  </div>
                )}
              </button>

              {/* Submenu */}
              {!isSidebarCollapsed && item.hasSubmenu && (
                <div className={`pl-9 space-y-1 ${
                  item.name === 'Privacy' && isPrivacyExpanded 
                    ? 'block' 
                    : 'hidden'
                }`}>
                  {item.submenu?.map(sub => {
                    const isSubActive = activeTab === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setActiveTab(sub.name)}
                        className={`block w-full text-left py-1.5 px-2 text-xs rounded transition-colors ${
                          isSubActive
                            ? 'text-gray-950 font-semibold bg-gray-50'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tenant Session Status Segment Footer */}
      <div className="border-t border-gray-100 pt-4 mt-auto space-y-2">
        {activeHospital ? (
          isSidebarCollapsed ? (
            <button 
              onClick={onLogoutHospital}
              title={`Active Tenant: ${activeHospital.name} (${activeHospital.hospital_unique_number}). Click to Exit Session.`}
              className="mx-auto w-10 h-10 bg-blue-50 hover:bg-rose-50 border border-blue-100 hover:border-rose-150 rounded-xl transition-all flex items-center justify-center text-blue-600 hover:text-rose-600 cursor-pointer shadow-3xs"
            >
              <Building size={16} />
            </button>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
              <div className="flex gap-2 items-start">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                  <Building size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                    {activeHospital.name}
                  </h4>
                  <p className="text-[9px] text-blue-600 font-mono font-extrabold tracking-wider uppercase mt-0.5">
                    {activeHospital.hospital_unique_number}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogoutHospital}
                className="w-full py-1 text-[10px] font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50/50 bg-white border border-gray-100 hover:border-rose-100 rounded-lg transition-all text-center cursor-pointer uppercase tracking-wider"
              >
                Switch Institution
              </button>
            </div>
          )
        ) : (
          isSidebarCollapsed ? (
            <div className="mx-auto w-10 h-10 bg-slate-100 border border-gray-200 rounded-xl flex items-center justify-center text-slate-500" title="Full Platform Access (Owner bypass mode)">
              <Shield size={16} />
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl space-y-1">
              <div className="flex gap-2 items-center">
                <Shield size={12} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">System Owner Bypass</span>
              </div>
              <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                Full database access. Showing all hospital records combined.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
