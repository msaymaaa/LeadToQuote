import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wrench,
  Eye,
  EyeOff,
  KeyRound,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { UserRole } from '../types/database';

interface AuthViewProps {
  onNavigateToPublicLanding?: () => void;
  onAuthenticated?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onNavigateToPublicLanding,
  onAuthenticated,
}) => {
  const { signIn, signUp, resetPassword, loading, selectDemoPersona, isLiveSupabase, authError, clearAuthError } =
    useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'technician'>('customer');

  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const errorMsg = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    clearAuthError();

    if (mode === 'forgot') {
      if (!email.trim()) {
        setLocalError('Please enter your account email address.');
        return;
      }
      const res = await resetPassword(email.trim());
      if (res.error) {
        setLocalError(res.error);
      } else {
        setSuccessMsg(res.message || 'Password reset link sent! Please check your email inbox.');
      }
      return;
    }

    if (mode === 'signin') {
      if (!email.trim()) {
        setLocalError('Please enter your email address.');
        return;
      }
      if (!password) {
        setLocalError('Please enter your password.');
        return;
      }
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setLocalError(res.error);
      } else {
        setSuccessMsg('Signed in successfully!');
        if (onAuthenticated) onAuthenticated();
      }
      return;
    }

    // Sign up mode
    if (!fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Strictly enforce role cannot be owner or admin on registration
    const safeRole: UserRole = selectedRole === 'technician' ? 'technician' : 'customer';

    const res = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role: safeRole,
      phone: phone.trim() || undefined,
    });

    if (res.error) {
      setLocalError(res.error);
    } else {
      setSuccessMsg('Account registered successfully! Directing to your workspace...');
      if (onAuthenticated) {
        setTimeout(onAuthenticated, 700);
      }
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    selectDemoPersona(role);
    if (onAuthenticated) onAuthenticated();
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-bold text-[#0b0c10] text-lg shadow-xl border border-[#d4af37]/30">
            LQ
          </div>
        </div>
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-[#f4efe6]">
          LeadToQuote
        </h1>
        <p className="mt-1 text-center text-xs text-[#a8a296]">
          Field Service Operations, AI Lead Ingestion & Dispatch
        </p>

        {/* Protection Banner */}
        <div className="mt-4 mx-4 sm:mx-0 p-3 rounded-xl bg-[#141722] border border-[#272d3e] flex items-center justify-between text-xs text-[#cfc8bc]">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
            <span className="font-medium text-[#f4efe6]">Protected Workspace</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2434] text-[#d4af37] border border-[#d4af37]/20">
            {isLiveSupabase ? 'Supabase Auth' : 'Sandbox Auth'}
          </span>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#12141d] border border-[#262c3e] py-6 px-6 sm:px-8 shadow-2xl rounded-2xl">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#222738] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setLocalError(null);
                setSuccessMsg(null);
                clearAuthError();
              }}
              className={`flex-1 pb-3 text-xs font-semibold text-center transition ${
                mode === 'signin'
                  ? 'text-[#d4af37] border-b-2 border-[#d4af37]'
                  : 'text-[#8c867a] hover:text-[#cfc8bc]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setLocalError(null);
                setSuccessMsg(null);
                clearAuthError();
              }}
              className={`flex-1 pb-3 text-xs font-semibold text-center transition ${
                mode === 'signup'
                  ? 'text-[#d4af37] border-b-2 border-[#d4af37]'
                  : 'text-[#8c867a] hover:text-[#cfc8bc]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setLocalError(null);
                setSuccessMsg(null);
                clearAuthError();
              }}
              className={`flex-1 pb-3 text-xs font-semibold text-center transition ${
                mode === 'forgot'
                  ? 'text-[#d4af37] border-b-2 border-[#d4af37]'
                  : 'text-[#8c867a] hover:text-[#cfc8bc]'
              }`}
            >
              Reset
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Security notice */}
                <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#272d3e] text-[11px] text-[#a8a296] flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span>
                    New user accounts can register as a <strong>Customer</strong> or <strong>Field Technician</strong>. Owner and Administrator roles are assigned by organization owners.
                  </span>
                </div>

                {/* Role Picker (Strictly Customer or Technician) */}
                <div>
                  <label className="block text-xs text-[#a8a296] font-medium mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('customer')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedRole === 'customer'
                          ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#f3e5ab]'
                          : 'bg-[#0b0c10] border-[#222738] text-[#8c867a] hover:text-[#cfc8bc]'
                      }`}
                    >
                      <User className="w-4 h-4 mb-1 text-[#c084fc]" />
                      <span className="text-xs font-semibold">Client / Customer</span>
                      <span className="text-[10px] text-[#8c867a]">Request quotes & service</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('technician')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedRole === 'technician'
                          ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#f3e5ab]'
                          : 'bg-[#0b0c10] border-[#222738] text-[#8c867a] hover:text-[#cfc8bc]'
                      }`}
                    >
                      <Wrench className="w-4 h-4 mb-1 text-[#38bdf8]" />
                      <span className="text-xs font-semibold">Field Technician</span>
                      <span className="text-[10px] text-[#8c867a]">Execute work orders</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs text-[#a8a296] font-medium mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-[#8c867a]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full pl-9 pr-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] text-xs placeholder-[#5a627a] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-[#a8a296] font-medium mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#8c867a]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] text-xs placeholder-[#5a627a] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs text-[#a8a296] font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8c867a]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] text-xs placeholder-[#5a627a] focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-[#a8a296] font-medium">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setLocalError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#d4af37] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#8c867a]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] text-xs placeholder-[#5a627a] focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#8c867a] hover:text-[#f4efe6]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-[#a8a296] font-medium mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-[#8c867a]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] text-xs placeholder-[#5a627a] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89528] text-[#0b0c10] font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Verifying...'
                  : mode === 'signin'
                  ? 'Sign In to Dashboard'
                  : mode === 'signup'
                  ? 'Complete Registration'
                  : 'Send Reset Instructions'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-[#202534] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] font-semibold">
                Instant Demo Evaluation
              </span>
              <span className="text-[10px] text-[#d4af37]">One-click access</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="p-2.5 rounded-xl bg-[#0b0c10] hover:bg-[#181c28] border border-[#262c3e] text-left transition group"
              >
                <div className="font-semibold text-[#f4efe6] text-[11px] truncate group-hover:text-[#d4af37]">
                  David Miller
                </div>
                <div className="text-[10px] text-[#d4af37]">Owner / Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('technician')}
                className="p-2.5 rounded-xl bg-[#0b0c10] hover:bg-[#181c28] border border-[#262c3e] text-left transition group"
              >
                <div className="font-semibold text-[#f4efe6] text-[11px] truncate group-hover:text-[#38bdf8]">
                  Marcus Reed
                </div>
                <div className="text-[10px] text-[#38bdf8]">Field Tech</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="p-2.5 rounded-xl bg-[#0b0c10] hover:bg-[#181c28] border border-[#262c3e] text-left transition group"
              >
                <div className="font-semibold text-[#f4efe6] text-[11px] truncate group-hover:text-[#c084fc]">
                  Sarah Jenkins
                </div>
                <div className="text-[10px] text-[#c084fc]">Client / Portal</div>
              </button>
            </div>
          </div>

          {/* Public Landing Link */}
          {onNavigateToPublicLanding && (
            <div className="mt-5 text-center pt-3 border-t border-[#1f2434]">
              <button
                type="button"
                onClick={onNavigateToPublicLanding}
                className="inline-flex items-center text-xs text-[#a8a296] hover:text-[#d4af37] transition space-x-1"
              >
                <span>View Public Contractor Services</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
