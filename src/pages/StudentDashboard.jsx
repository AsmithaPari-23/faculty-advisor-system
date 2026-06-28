import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Send
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import CircularProgress from '../components/CircularProgress';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [success, setSuccess] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for meeting requests
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingSuccess, setMeetingSuccess] = useState('');
  const [meetingError, setMeetingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, acadRes, successRes, meetingsRes] = await Promise.all([
          axios.get('/api/student/profile'),
          axios.get('/api/student/academic'),
          axios.get('/api/student-success'),
          axios.get('/api/student/meetings')
        ]);
        setProfile(profileRes.data);
        setAcademic(acadRes.data);
        setSuccess(successRes.data);
        setMeetings(meetingsRes.data);
      } catch (err) {
        console.error('Error fetching student dashboard records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'https://faculty-advisor-system.onrender.com');
    socket.emit('join', user._id);

    socket.on('telemetry_update', (data) => {
      setAcademic(data.academicData);
      setSuccess(data.successData);
      setToastMsg('Live Academic Telemetry Synchronized!');
      setTimeout(() => setToastMsg(''), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    setMeetingError('');
    setMeetingSuccess('');
    setSubmitting(true);

    try {
      const res = await axios.post('/api/student/meeting', {
        date: meetingDate,
        notes: meetingNotes
      });
      setMeetings(prev => [{ ...res.data.meeting, advisorName: profile.advisor.name }, ...prev]);
      setMeetingSuccess('Consultation request dispatched to your advisor.');
      setMeetingDate('');
      setMeetingNotes('');
    } catch (err) {
      setMeetingError(err.response?.data?.message || 'Failed to request meeting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  // Calculate average values for cards
  const attendanceAvg = academic?.attendance?.length > 0
    ? Math.round(academic.attendance.reduce((sum, a) => sum + a.percentage, 0) / academic.attendance.length)
    : 0;

  const marksAvg = academic?.marks?.length > 0
    ? Math.round(academic.marks.reduce((sum, m) => sum + m.score, 0) / academic.marks.length)
    : 0;

  const projectsCount = academic?.projects?.length || 0;
  const certsCount = academic?.certifications?.length || 0;

  // Chart structures
  const performanceTrendData = academic?.marks.map((m, idx) => ({
    name: m.subject.split(' ')[0], // short name
    Marks: m.score,
    Attendance: academic.attendance[idx]?.percentage || 0
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder relative overflow-hidden"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">Student Telemetry Insights</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            Welcome back, {profile?.name}!
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Your educational growth and career index reports are loaded. Department: <span className="text-slate-300 font-semibold">{profile?.department}</span> | Year: <span className="text-slate-300 font-semibold">{profile?.year}</span>
          </p>
        </div>

        {/* Risk Alerts */}
        <div className="flex space-x-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-950/40 border border-white/5 text-center min-w-[100px]">
            <p className="text-[8px] font-bold text-slate-500 tracking-wider">ACADEMIC RISK</p>
            <p className={`text-xs font-bold mt-1 ${success?.academicRisk === 'High Risk' ? 'text-danger text-glow-danger' : (success?.academicRisk === 'Medium Risk' ? 'text-warning' : 'text-success')}`}>
              {success?.academicRisk || 'Low Risk'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-2xl bg-slate-950/40 border text-center min-w-[100px] ${success?.burnoutRisk === 'High' ? 'border-danger/30 bg-danger/5 shadow-glow-danger' : 'border-white/5'}`}>
            <p className="text-[8px] font-bold text-slate-500 tracking-wider">BURNOUT LEVEL</p>
            <p className={`text-xs font-bold mt-1 ${success?.burnoutRisk === 'High' ? 'text-danger' : (success?.burnoutRisk === 'Medium' ? 'text-warning' : 'text-success')}`}>
              {success?.burnoutRisk || 'Low'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Growth Index Score ring */}
        <GlassCard glow="primary" className="flex flex-col items-center justify-center py-10">
          <h3 className="text-sm font-extrabold tracking-widest text-slate-300 mb-6 uppercase text-center">
            AI SUCCESS SCORE
          </h3>
          <CircularProgress value={success?.successScore || 0} />
          <p className="text-[10px] text-slate-500 mt-6 text-center leading-relaxed">
            Composite index calculating grades, class attendance,<br />and completed certifications.
          </p>
        </GlassCard>

        {/* Quick Indicators Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col justify-between" glow={attendanceAvg < 75 ? 'danger' : 'none'}>
            <div className="flex justify-between items-start text-slate-400">
              <Calendar className="w-5 h-5 text-secondary" />
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">ATTENDANCE</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-white">{attendanceAvg}%</p>
              <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">Avg. Class Presence</p>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between" glow={marksAvg < 60 ? 'warning' : 'none'}>
            <div className="flex justify-between items-start text-slate-400">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">MARKS INDEX</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-white">{marksAvg}%</p>
              <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">Cumulative Grade Avg</p>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start text-slate-400">
              <Layers className="w-5 h-5 text-success" />
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">PROJECTS</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-white">{projectsCount}</p>
              <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">Active Capstones</p>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start text-slate-400">
              <Award className="w-5 h-5 text-warning" />
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">CERTS</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-white">{certsCount}</p>
              <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">Verified Credentials</p>
            </div>
          </GlassCard>

          {/* Placement readiness index */}
          <GlassCard glow="success" className="col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">PLACEMENT READINESS</span>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-white">
                  {success?.placementReadiness}%
                </p>
                <p className="text-[9px] font-semibold text-slate-400 mt-1">
                  STATUS: <span className="text-success font-bold uppercase">{success?.placementStatus}</span>
                </p>
              </div>
              <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5 mb-1.5">
                <div
                  className="bg-success h-full rounded-full"
                  style={{ width: `${success?.placementReadiness}%` }}
                />
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Chart & Live Alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recharts Grades Graph */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 mb-6 uppercase">
              ACADEMIC PERFORMANCE DISTRIBUTION
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#090E1A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Marks"
                  stroke="#00E5FF"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Attendance"
                  stroke="#7B61FF"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-[10px] font-bold text-slate-400 mt-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-primary rounded-full" />
              <span>MARKS INDEX (%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-secondary rounded-full" />
              <span>ATTENDANCE (%)</span>
            </div>
          </div>
        </GlassCard>

        {/* AI Recommendations Action Items */}
        <GlassCard glow="none" className="p-6">
          <div className="flex items-center space-x-2 text-primary mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              AI ACTION ITEMS
            </h3>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {success?.recommendations?.map((rec, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition flex items-start space-x-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Bottom widgets: Schedule Checkin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Request meeting with advisor */}
        <GlassCard className="p-6 lg:col-span-1 border border-glassBorder flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 mb-1 uppercase">
              SCHEDULE ADVISOR CONSULTATION
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Assigned Advisor: <span className="text-slate-300 font-bold">{profile?.advisor.name}</span>
            </p>
            
            {meetingSuccess && (
              <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded-lg text-success text-[10px] font-bold uppercase">
                {meetingSuccess}
              </div>
            )}
            {meetingError && (
              <div className="mb-3 p-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-[10px] font-bold uppercase">
                {meetingError}
              </div>
            )}

            <form onSubmit={handleRequestMeeting} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">DATE & TIME</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">DISCUSSION NOTES</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="E.g., Placement advice, course catalog details, academic planning..."
                  className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition h-16 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-slate-900 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>REQUEST CONFERENCES</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </GlassCard>

        {/* Meeting Status lists */}
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="text-sm font-extrabold tracking-widest text-slate-300 mb-4 uppercase">
            CONSULTATION LOG
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {meetings.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No requested checkins found.
              </div>
            ) : (
              meetings.map(m => (
                <div
                  key={m._id}
                  className="p-4 rounded-xl bg-slate-950/30 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">Session with {m.advisorName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Date: {new Date(m.date).toLocaleString()}</p>
                    {m.notes && <p className="text-[10px] text-slate-400 mt-1 italic">Notes: "{m.notes}"</p>}
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                      m.status === 'Approved' ? 'border-primary/20 text-primary bg-primary/5 shadow-glow-primary' :
                      m.status === 'Completed' ? 'border-success/20 text-success bg-success/5' :
                      m.status === 'Cancelled' ? 'border-danger/20 text-danger bg-danger/5' :
                      'border-slate-700 text-slate-400 bg-slate-800/10'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
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

export default StudentDashboard;
