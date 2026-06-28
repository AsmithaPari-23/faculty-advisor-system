import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Layers, TrendingUp, Calendar, Trash2, Link, Check, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const { user } = useAuth();
  const [toastMsg, setToastMsg] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);

      const students = usersRes.data.filter(u => u.role === 'student');
      const advisors = usersRes.data.filter(u => u.role === 'faculty');

      if (students.length > 0) setSelectedStudent(students[0]._id);
      if (advisors.length > 0) setSelectedAdvisor(advisors[0]._id);

    } catch (err) {
      console.error('Error fetching admin stats data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'https://faculty-advisor-system.onrender.com');
    socket.emit('join', user._id);
    socket.emit('join_admin');

    socket.on('admin_stats_update', (updatedStats) => {
      setStats(updatedStats);
      setToastMsg('Live Global System Statistics Synced!');
      setTimeout(() => setToastMsg(''), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleAssignAdvisor = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    setAssignLoading(true);

    try {
      await axios.post('/api/admin/assign-advisor', {
        studentId: selectedStudent,
        advisorId: selectedAdvisor
      });
      setAssignSuccess('Faculty advisor mapped to student successfully.');
      fetchData();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign advisor');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user profile? This action will purge all associated academic telemetry records and profiles.')) {
      return;
    }
    try {
      await axios.post('/api/admin/delete-user', { userId });
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  // Format charts data
  const riskChartData = stats ? [
    { name: 'Low Risk', Count: stats.riskBreakdown['Low Risk'] || 0, fill: '#00FF94' },
    { name: 'Med Risk', Count: stats.riskBreakdown['Medium Risk'] || 0, fill: '#FFC857' },
    { name: 'High Risk', Count: stats.riskBreakdown['High Risk'] || 0, fill: '#FF5C7A' }
  ] : [];

  const burnoutChartData = stats ? [
    { name: 'Low', Level: stats.burnoutBreakdown['Low'] || 0, fill: '#00FF94' },
    { name: 'Medium', Level: stats.burnoutBreakdown['Medium'] || 0, fill: '#FFC857' },
    { name: 'High', Level: stats.burnoutBreakdown['High'] || 0, fill: '#FF5C7A' }
  ] : [];

  const studentsList = users.filter(u => u.role === 'student');
  const advisorsList = users.filter(u => u.role === 'faculty');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder"
      >
        <div>
          <div className="flex items-center space-x-2 text-secondary mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">ADMIN SYSTEM GATEWAY</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            System Admin / HOD Control Panel
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure system configurations, manage advisor mappings, delete obsolete student accounts, and view global performance reports.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <GlassCard className="p-5 flex flex-col justify-between" hover={false}>
          <p className="text-[8px] font-bold text-slate-500 tracking-wider">TOTAL ENROLLED STUDENTS</p>
          <p className="text-4xl font-extrabold tracking-tight text-white mt-2">{stats?.counts.students}</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between" hover={false}>
          <p className="text-[8px] font-bold text-slate-500 tracking-wider">TOTAL ADVISORY FACULTY</p>
          <p className="text-4xl font-extrabold tracking-tight text-white mt-2">{stats?.counts.advisors}</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between" hover={false}>
          <p className="text-[8px] font-bold text-slate-500 tracking-wider">GLOBAL AVERAGE GROW INDEX</p>
          <p className="text-4xl font-extrabold tracking-tight text-primary mt-2">{stats?.averages.successScore}</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between" hover={false}>
          <p className="text-[8px] font-bold text-slate-500 tracking-wider">GLOBAL PLACEMENT INDEX</p>
          <p className="text-4xl font-extrabold tracking-tight text-success mt-2">{stats?.averages.placementReadiness}%</p>
        </GlassCard>
      </div>

      {/* Breakdown graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Risk Profile breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-300 mb-6 uppercase">
            STUDENT ACADEMIC RISK INDEX
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#090E1A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="Count" fill="#7B61FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Burnout Profile breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-300 mb-6 uppercase">
            STUDENT BURNOUT INDEX
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={burnoutChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#090E1A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="Level" fill="#00E5FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Directory & Mapping section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Accounts Lists */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center space-x-2 text-primary mb-6">
            <Users className="w-5 h-5" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              ACCOUNTS REGISTRY ({users.length})
            </h3>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="pb-3 pl-2">USER</th>
                  <th className="pb-3">ROLE</th>
                  <th className="pb-3">DEPARTMENT</th>
                  <th className="pb-3 text-right pr-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-900/10 transition">
                    <td className="py-3 pl-2">
                      <p className="text-white font-bold">{u.name}</p>
                      <p className="text-[9px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 uppercase text-[9.5px]">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                        u.role === 'admin' ? 'border-secondary/20 text-secondary bg-secondary/5' :
                        u.role === 'faculty' ? 'border-primary/20 text-primary bg-primary/5' :
                        'border-success/20 text-success bg-success/5'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {u.department}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={u.role === 'admin'} // Cannot delete HOD admin
                        className={`p-1.5 rounded-lg border border-transparent ${u.role === 'admin' ? 'text-slate-600 cursor-not-allowed' : 'text-danger hover:border-danger/30 hover:bg-danger/5 transition'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Advisor mapping interface */}
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 text-primary mb-4">
            <Link className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              ADVISORY RELATION ALLOCATOR
            </h3>
          </div>

          {assignSuccess && (
            <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded-lg text-success text-[10px] font-bold uppercase">
              {assignSuccess}
            </div>
          )}
          {assignError && (
            <div className="mb-3 p-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-[10px] font-bold uppercase">
              {assignError}
            </div>
          )}

          <form onSubmit={handleAssignAdvisor} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">SELECT STUDENT</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
              >
                {studentsList.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">SELECT ADVISOR</label>
              <select
                value={selectedAdvisor}
                onChange={(e) => setSelectedAdvisor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
              >
                {advisorsList.map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.department})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={assignLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-slate-900 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>MAP RELATIONSHIP</span>
            </button>
          </form>
        </GlassCard>

      </div>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl glass-glow-primary border border-primary/30 flex items-center space-x-3 text-xs font-bold text-white shadow-2xl"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
