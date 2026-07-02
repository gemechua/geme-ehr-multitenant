import React, { useState } from 'react';
import { 
  Shield, Eye, Link, Send, ArrowRightLeft, EyeOff, Award, 
  ExternalLink, Share2, Calendar, Users, Info, HelpCircle, Check, Copy,
  Image as ImageIcon, Upload, Lock, Sliders, Trash2, ShieldAlert, Sparkles, AlertTriangle, LayoutTemplate
} from 'lucide-react';

export default function SettingsTab() {
  const [copied, setCopied] = useState(false);
  const [appName, setAppName] = useState('General Hospital EHR');
  const [appDescription, setAppDescription] = useState(
    'General Hospital EHR is a comprehensive, secure, and paperless digital health platform designed for end-to-end patient care, from admission to billing and supply chain management. It offers high-availability offline stability and a multi-lingual interface, ensuring efficient healthcare delivery for millions of residents. The application is fully responsive and optimized to work seamlessly across all devices (including smartphones and tablets). Especially in clinics facing shortages of desktop computers, this multi-device compatibility facilitates the administrative and clinical processes, enabling staff to access EHR services easily from any handheld device.'
  );
  
  const [visibility, setVisibility] = useState<'Public (login required)' | 'Private (internal)'>('Public (login required)');
  const [creatorVisibility, setCreatorVisibility] = useState<'Visible' | 'Hidden'>('Visible');
  const [appTemplate, setAppTemplate] = useState('Standard Clinical EHR');
  const [inviteEmail, setInviteEmail] = useState('');
  
  const shareUrl = "https://ais-pre-al2z7o2pm4qu5zdopssman-799671076665.europe-west2.run.app";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      alert(`An invitation has been successfully sent to ${inviteEmail}`);
      setInviteEmail('');
    }
  };

  const handleCloneApp = () => {
    alert("Creating a secure duplicate copy of this application...");
  };

  const handleCreateTemplate = () => {
    alert("Creating a new template based on current application configuration...");
  };

  const handleDeleteApp = () => {
    const confirmation = window.confirm("Are you absolutely sure you want to permanently delete this application and all associated data? This action is completely irreversible.");
    if (confirmation) {
      alert("Application deletion request received.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">App Settings</h1>
            <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} />
              Owner Only
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Configure your clinical environment, system compliance, and workspace options.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
            Active Workspace
          </span>
        </div>
      </div>

      {/* Owner Restriction Advisory Banner */}
      <div className="bg-red-50/40 rounded-2xl border border-red-100 p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">Owner Security Restriction</h4>
          <p className="text-xs text-red-800 leading-relaxed">
            All configuration parameters, policy rules, and access permissions in this tab are restricted. Modifications can only be successfully deployed and authorized by the workspace owner.
          </p>
        </div>
      </div>

      {/* Overview Block */}
      <div className="bg-white rounded-2xl border border-gray-200/95 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-950"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pl-2">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-950 text-white rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-xs border border-gray-800 shadow-sm" title="Hospital EHR logo">
                <span className="text-[10px] tracking-wider leading-none">EHR</span>
                <span className="text-[8px] text-gray-400 font-normal mt-0.5">LOGO</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">
                  General Hospital EHR (Copy) logo
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {appName}
                </h2>
                <span className="text-xs text-gray-500 font-medium block mt-1">
                  General Hospital EHR (Copy)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                Production Live
              </span>
              <span className="text-gray-400 text-xs flex items-center gap-1 font-mono">
                <Calendar size={12} />
                Created 3 days ago
              </span>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              {appDescription}
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto shrink-0 pt-1">
            <a 
              href={shareUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-950 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-850 transition-colors w-full md:w-40 shadow-sm"
            >
              <span>Open App</span>
              <ExternalLink size={14} />
            </a>
            
            <button 
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 bg-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full md:w-40 shadow-sm"
            >
              <Share2 size={14} />
              <span>{copied ? 'Copied Link' : 'Share App'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* win free credits! banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Award className="text-yellow-400 shrink-0" size={20} />
            <h3 className="font-bold text-lg">win free credits!</h3>
          </div>
          <p className="text-purple-100 text-xs max-w-xl leading-relaxed">
            Invite colleagues, complete system compliance tasks, and keep patient logs updated to earn continuous hosting and cloud-sync compute credits for the clinic.
          </p>
        </div>
        <button 
          onClick={() => alert("Task checklist loaded! Complete daily records to earn +15 credits.")}
          className="bg-white text-purple-950 hover:bg-purple-50 transition-colors px-5 py-2.5 rounded-lg text-xs font-bold shrink-0 shadow-sm"
        >
          App usage
        </button>
      </div>

      {/* APP INFO */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-gray-900">App Info</h3>
          <p className="text-xs text-gray-500 mt-0.5">Customize the branding metadata and description for the clinic interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">App Logo</label>
            <div className="flex items-center gap-3 p-3 border border-gray-150 rounded-xl bg-gray-50/50">
              <div className="w-14 h-14 bg-gray-950 text-white rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-[10px] border border-gray-800 shadow-sm">
                <span>Hospital</span>
                <span className="text-[7px] text-gray-400 font-normal">EHR logo</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700">Hospital EHR logo</p>
                <button 
                  onClick={() => {
                    const newName = prompt("Enter new App Name:", appName);
                    if (newName) setAppName(newName);
                  }}
                  className="text-[11px] text-gray-600 hover:text-gray-950 font-bold flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm"
                >
                  Edit Logo
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">App Description</label>
            <textarea
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 transition-shadow leading-relaxed"
              rows={4}
              placeholder="Provide a detailed overview of the Hospital EHR..."
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Social image</label>
                <p className="text-xs text-gray-500 mt-0.5">Image used when your app is shared on social platforms.</p>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Recommended size: 1200x630 pixels.</span>
            </div>

            <div className="border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors rounded-xl p-6 text-center cursor-pointer bg-gray-50/30 group">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-150 flex items-center justify-center text-gray-400 group-hover:text-gray-600 shadow-sm transition-colors">
                  <Upload size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-700">Click or drag an image to upload</p>
                <p className="text-[10px] text-gray-400">PNG, JPG, or GIF formats supported up to 5MB.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APP TEMPLATE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-gray-900">App Template</h3>
          <p className="text-xs text-gray-500 mt-0.5">Use templates to standardize clinical workflows and configurations across your organization.</p>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl border border-gray-150">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center border border-indigo-100">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Current Template</span>
              <p className="text-sm font-semibold text-gray-900">{appTemplate}</p>
            </div>
          </div>
          <button 
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* GENERAL SETTINGS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-gray-900">General Settings</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage routing, permissions, visibility, and app-cloning workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Page setting */}
          <div className="flex flex-col justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Main Page</span>
                <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Default</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-normal mb-3">This setting can now be accessed only via chat.</p>
              
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm font-semibold text-xs text-gray-800 flex items-center justify-between">
                <span>Dashboard</span>
                <span className="text-[10px] font-mono text-gray-400">active</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 italic">
              To change this write in chat: <span className="font-mono bg-gray-100 text-gray-600 px-1 rounded">Change the main page to {"{PageName}"}</span>
            </p>
          </div>

          {/* App Visibility */}
          <div className="flex flex-col justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">App Visibility</span>
              <p className="text-[11px] text-gray-400 leading-normal mb-3">Control who can access your application</p>
              
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 font-semibold"
              >
                <option value="Public (login required)">Public (login required)</option>
                <option value="Private (internal)">Private (internal)</option>
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 italic">Requires users to authenticate before viewing diagnostic data.</p>
          </div>

          {/* Entity Creator Visibility */}
          <div className="flex flex-col justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Entity Creator Visibility</span>
              <p className="text-[11px] text-gray-400 leading-normal mb-3">Show or hide who created each record in your app's data tables.</p>
              
              <select
                value={creatorVisibility}
                onChange={(e) => setCreatorVisibility(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 font-semibold"
              >
                <option value="Visible">Visible</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 italic">Clinical records display staff credits explicitly.</p>
          </div>
        </div>

        {/* Clone App */}
        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Clone App</h4>
            <p className="text-xs text-gray-500 mt-0.5">Create a duplicate of this app</p>
          </div>
          <button 
            onClick={handleCloneApp}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all"
          >
            Create Copy
          </button>
        </div>
      </div>

      {/* AUTHENTICATION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-gray-900">Authentication</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage authentication providers and security settings for your clinical workspace.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl border border-gray-150">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Google Authentication</span>
              <p className="text-[11px] text-gray-400 leading-normal">Enables users to sign in using their Google account credentials.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
              Enabled
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl border border-gray-150">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Email/Password Auth</span>
              <p className="text-[11px] text-gray-400 leading-normal">Standard email and password login for non-Google users.</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Configure
            </button>
          </div>
        </div>
      </div>


      {/* ADVANCED CAPABILITIES */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-gray-900">Advanced Capabilities</h3>
          <p className="text-xs text-gray-500 mt-0.5">Unlock powerful developer sandboxing, diagnostics, and workspace tools.</p>
        </div>

        <div className="space-y-4 divide-y divide-gray-100">
          {/* Test Data */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Test Data</h4>
                <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Sparkles size={8} /> Builder+
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                Use test data to safely test changes without affecting live data.
              </p>
            </div>
            <button 
              onClick={() => alert("Initiating system upgrade workflow to Builder+ plan...")}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Upgrade
            </button>
          </div>

          {/* Session recordings */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Session recordings</h4>
                <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded">Disabled</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                Replay sessions to review user activity. Make sure you're compliant with privacy laws before enabling. <span className="text-gray-950 underline font-semibold cursor-pointer">Learn more</span>
              </p>
              <p className="text-[11px] text-purple-700 font-medium mt-1">Available only for Builder plan and above</p>
            </div>
            <button 
              onClick={() => alert("Upgrade to Builder plan to enable detailed user session recordings.")}
              className="px-4 py-2 border border-purple-200 hover:bg-purple-50 text-purple-950 rounded-lg text-xs font-bold transition-colors"
            >
              Upgrade plan
            </button>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-6 shadow-sm space-y-6">
        <div className="border-b border-rose-100 pb-3 flex items-center gap-2">
          <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          <div>
            <h3 className="font-extrabold text-base text-rose-950">Danger Zone</h3>
            <p className="text-xs text-rose-700 mt-0.5">Irreversible actions that affect your app</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Delete App</h4>
            <p className="text-xs text-gray-500 mt-0.5">Permanently remove this app and all its data</p>
          </div>
          <button 
            onClick={handleDeleteApp}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Trash2 size={13} />
            <span>Delete App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
