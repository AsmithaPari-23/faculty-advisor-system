import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, User as UserIcon, Loader } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Login = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3');
  const [designation, setDesignation] = useState('Assistant Professor');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    if (isRegister) {
      const payload = {
        name,
        email,
        password,
        role,
        department,
        year: role === 'student' ? year : undefined,
        designation: role === 'faculty' ? designation : undefined
      };
      const result = await register(payload);
      if (!result.success) {
        setError(result.message);
        setAuthLoading(false);
      }
    } else {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        setAuthLoading(false);
      }
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setError('');
    setAuthLoading(true);
    const result = await login(demoEmail, demoPass);
    if (!result.success) {
      setError(result.message);
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-slate-300 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-widest text-slate-200">
          FACULTY ADVISOR SYSTEM
        </h2>
        <p className="text-xs font-bold text-slate-400 tracking-wider">
          STUDENT SUCCESS & ANALTICS PLATFORM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <GlassCard className="py-8 px-6 sm:px-10 border border-glassBorder shadow-2xl">
          <div className="flex border-b border-white/5 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold tracking-widest transition duration-200 border-b-2 ${!isRegister ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold tracking-widest transition duration-200 border-b-2 ${isRegister ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              REGISTER
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">FULL NAME</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-3 py-2 bg-slate-950/40 border border-glassBorder hover:border-white/10 focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter institutional email"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/40 border border-glassBorder hover:border-white/10 focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">PASSWORD</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/40 border border-glassBorder hover:border-white/10 focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                />
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">SYSTEM ROLE</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Advisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">DEPARTMENT</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/40 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                  />
                </div>

                {role === 'student' ? (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">YEAR OF STUDY</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                    >
                      <option value="1">First Year (Freshman)</option>
                      <option value="2">Second Year (Sophomore)</option>
                      <option value="3">Third Year (Junior)</option>
                      <option value="4">Fourth Year (Senior)</option>
                    </select>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">DESIGNATION</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/40 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-200"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 mt-2 bg-primary hover:bg-primary/90 text-slate-900 text-sm font-bold tracking-wider rounded-xl transition duration-200 flex items-center justify-center"
            >
              {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : (isRegister ? 'PROVISION ACCOUNT' : 'SECURE ACCESS')}
            </button>
          </form>

          {/* Quick Demo Accounts shortcuts */}
          {!isRegister && (
            <div className="mt-6 border-t border-white/5 pt-5 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider text-center uppercase">
                Evaluate Immediately (Quick Demo Accounts)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickLogin('student@success.edu', 'password123')}
                  className="px-2 py-2 rounded-xl border border-success/20 text-success bg-success/5 hover:bg-success/10 text-[10px] font-bold tracking-wider transition duration-200"
                >
                  STUDENT PORTAL
                </button>
                <button
                  onClick={() => handleQuickLogin('advisor@success.edu', 'password123')}
                  className="px-2 py-2 rounded-xl border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-[10px] font-bold tracking-wider transition duration-200"
                >
                  ADVISOR PORTAL
                </button>
                <button
                  onClick={() => handleQuickLogin('admin@success.edu', 'password123')}
                  className="px-2 py-2 rounded-xl border border-secondary/20 text-secondary bg-secondary/5 hover:bg-secondary/10 text-[10px] font-bold tracking-wider transition duration-200"
                >
                  ADMIN PORTAL
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
