import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KeyRound, ShieldCheck, Check, X, AlertCircle, Copy } from 'lucide-react';
import { userInviteSchema } from '../lib/schemas';

interface InviteUserFormProps {
  onSuccess?: () => void;
}

export default function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedBypassUrl, setGeneratedBypassUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Strength Check Logic
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

  const strength = getPasswordStrength(password);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Zod Front-end validation
      const validationResult = userInviteSchema.safeParse({
        fullName,
        email,
        role,
        password,
      });

      if (!validationResult.success) {
        const errorMsg = validationResult.error.issues.map(err => err.message).join(' ');
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const tenantId = activeHospital?.hospital_unique_number || 'demo-global';

      await addDoc(collection(db, 'users'), {
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        password: password || null, // save password if provided
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        hospital_id: tenantId
      });
      
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const bypassUrl = `${origin}${pathname}?bypass_tenant=${tenantId}&bypass_user=${encodeURIComponent(email.trim())}`;
      setGeneratedBypassUrl(bypassUrl);
      setCopiedLink(false);

      setEmail('');
      setFullName('');
      setPassword('');
      setSuccessMessage('Staff colleague successfully invited and registered!');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 5000); // give more time to see and copy the link
      }
    } catch (error: any) {
      console.error('Error adding user: ', error);
      setErrorMessage(error.message || 'Error saving user to database. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-semibold">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-bold">{successMessage}</div>
          </div>

          {generatedBypassUrl && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2 animate-fadeIn text-xs">
              <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px] block">Direct Access Bypass URL</span>
              <p className="text-[10px] text-gray-500 leading-snug">
                Send this link to the registered admin/user. Opening it allows them to bypass the application gateway page entirely and enter your organization home page instantly:
              </p>
              <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-gray-250 select-text">
                <span className="font-mono text-[9px] text-gray-600 truncate flex-1 select-all">{generatedBypassUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedBypassUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy size={10} />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. John Doe"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. john@example.com"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          App Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow cursor-pointer"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Set Security Password
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secure initial password (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow bg-white font-mono"
          />
        </div>

        {/* Real-time Password Strength Meter */}
        {password && (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 mt-2 animate-fade-in">
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
                {password.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>8+ characters</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>Upper & Lower</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[0-9]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>At least one number</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                {/[^A-Za-z0-9]/.test(password) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                <span>Special character</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-950 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-850 transition-colors disabled:opacity-50 mt-2 cursor-pointer"
      >
        {isSubmitting ? 'Sending Invite...' : 'Send Invite'}
      </button>
    </form>
  );
}
