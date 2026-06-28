import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Users, AlertOctagon, Flame, Check, X, ClipboardCheck, ArrowUpRight, MessageSquare, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';

const AdvisorCenter = () => {
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recommendations Dispatcher states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [recSuccess, setRecSuccess] = useState('');
  const [recError, setRecError] = useState('');
  const [submittingRec, setSubmittingRec] = useState(false);

  // Moderate meeting states
  const [notesText, setNotesText] = useState({});

  const { user } = useAuth();
  const [toastMsg, setToastMsg] = useState('');

  const fetchData = async () => {
    try {
      const [studentsRes, meetingsRes] = await Promise.all([
        axios.get('/api/advisor/students'),
        axios.get('/api/advisor/meetings')
      ]);
      setStudents(studentsRes.data);
      setMeetings(meetingsRes.data);
      if (studentsRes.data.length > 0) {
        setSelectedStudent(studentsRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching advisor center data:', err);
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

    socket.on('advisor_student_update', (updatedStudent) => {
      setStudents(prevStudents => {
        return prevStudents.map(s => s._id.toString() === updatedStudent._id.toString() ? updatedStudent : s);
      });
      setToastMsg(`Telemetry Sync: ${updatedStudent.name}'s metrics updated!`);
      setTimeout(() => setToastMsg(''), 4500);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleModerateMeeting = async (meetingId, action) => {
    try {
      const notes = notesText[meetingId] || '';
      await axios.post(`/api/advisor/meetings/${meetingId}`, {
        status: action,
        notes
      });
      // Refresh
      const meetingsRes = await axios.get('/api/advisor/meetings');
      setMeetings(meetingsRes.data);
    } catch (err) {
      console.error('Error moderating meeting:', err);
    }
  };

  const handlePostRecommendation = async (e) => {
    e.preventDefault();
    setRecError('');
    setRecSuccess('');
    setSubmittingRec(true);

    try {
      await axios.post('/api/advisor/recommendations', {
        studentId: selectedStudent,
        recommendation: recommendationText
      });
      setRecSuccess('Recommendation successfully appended to student success profile.');
      setRecommendationText('');
    } catch (err) {
      setRecError(err.response?.data?.message || 'Failed to post recommendation');
    } finally {
      setSubmittingRec(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  // Filter students needing immediate attention (High risk OR High burnout)
  const priorityStudents = students.filter(
    s => s.academicRisk === 'High Risk' || s.burnoutRisk === 'High'
  );

  // Format chart data for placement readiness ranking
  const readinessChartData = students.map(s => ({
    name: s.name.split(' ')[0],
    Readiness: s.placementReadiness
  })).sort((a, b) => b.Readiness - a.Readiness);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">Advisor Intelligence</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            Advisor Intelligence Center
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time telemetry reports mapping academic compliance and burnout indicators for students under your advisory.
          </p>
        </div>
      </motion.div>

      {/* PRIORITY ALERTS: Immediate Attention */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-danger pl-2">
          <Flame className="w-5 h-5 text-danger" />
          <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
            STUDENTS NEEDING IMMEDIATE ATTENTION
          </h3>
        </div>

        {priorityStudents.length === 0 ? (
          <GlassCard glow="success" className="p-4 flex items-center space-x-3 text-xs" hover={false}>
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <p className="text-slate-300 font-semibold uppercase">
              All clear. No students currently flagged for academic risk or high burnout levels.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priorityStudents.map(student => (
              <GlassCard
                key={student._id}
                glow="danger"
                className="flex flex-col justify-between h-48 border border-danger/30 bg-danger/5"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-white">{student.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{student.department}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{student.email}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold">
                    <div className="p-2 rounded bg-slate-950/40 border border-white/5">
                      <p className="text-slate-500">ACADEMIC RISK</p>
                      <p className={`mt-0.5 ${student.academicRisk === 'High Risk' ? 'text-danger' : 'text-warning'}`}>
                        {student.academicRisk}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-950/40 border border-white/5">
                      <p className="text-slate-500">BURNOUT LEVEL</p>
                      <p className={`mt-0.5 ${student.burnoutRisk === 'High' ? 'text-danger' : 'text-warning'}`}>
                        {student.burnoutRisk}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
                  <span>Growth score: <span className="text-white font-extrabold">{student.successScore}</span></span>
                  <span>Readiness: <span className="text-white font-extrabold">{student.placementReadiness}%</span></span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Roster & Placement rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Full Directory */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center space-x-2 text-primary mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              STUDENT TELEMETRY DIRECTORY ({students.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="pb-3 pl-2">NAME</th>
                  <th className="pb-3">RISKS</th>
                  <th className="pb-3 text-center">COMPLETED PROJECT</th>
                  <th className="pb-3 text-center">CERTS</th>
                  <th className="pb-3 text-right">SUCCESS SCORE</th>
                  <th className="pb-3 text-right pr-2">READINESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-slate-900/20 transition duration-150">
                    <td className="py-3 pl-2">
                      <p className="text-white font-bold">{s.name}</p>
                      <p className="text-[9px] text-slate-500">{s.email}</p>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-1.5 text-[9px]">
                        <span className={`px-2 py-0.5 rounded border ${s.academicRisk === 'High Risk' ? 'border-danger/30 text-danger bg-danger/5' : (s.academicRisk === 'Medium Risk' ? 'border-warning/30 text-warning bg-warning/5' : 'border-success/20 text-success bg-success/5')}`}>
                          {s.academicRisk}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${s.burnoutRisk === 'High' ? 'border-danger/30 text-danger bg-danger/5' : (s.burnoutRisk === 'Medium' ? 'border-warning/30 text-warning bg-warning/5' : 'border-success/20 text-success bg-success/5')}`}>
                          Burnout: {s.burnoutRisk}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-slate-400">
                      {s.academicRecord.projectsCount}
                    </td>
                    <td className="py-3 text-center text-slate-400">
                      {s.academicRecord.certificationsCount}
                    </td>
                    <td className="py-3 text-right text-white font-extrabold">
                      {s.successScore}
                    </td>
                    <td className="py-3 text-right text-success font-black pr-2">
                      {s.placementReadiness}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Recharts Placement charts */}
        <GlassCard className="p-6">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-300 mb-6 uppercase">
            PLACEMENT READINESS RANKING
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessChartData}>
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
                <Bar dataKey="Readiness" fill="#00FF94" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-500 mt-4 leading-relaxed text-center">
            Comparison chart representing student preparation indexes based on aptitude, certifications, and projects count.
          </p>
        </GlassCard>

      </div>

      {/* Bottom section: Moderate meetings & dispatch manual recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Moderate Meeting Requests */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center space-x-2 text-primary mb-4">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              CONSULTATION SCHEDULER REQUESTS
            </h3>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {meetings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active consultation requests.
              </div>
            ) : (
              meetings.map(m => (
                <div
                  key={m._id}
                  className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">Student: {m.studentName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Date: {new Date(m.date).toLocaleString()}</p>
                      {m.notes && <p className="text-[10px] text-slate-400 mt-1 italic">Notes: "{m.notes}"</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                        m.status === 'Approved' ? 'border-primary/20 text-primary bg-primary/5' :
                        m.status === 'Completed' ? 'border-success/20 text-success bg-success/5' :
                        m.status === 'Cancelled' ? 'border-danger/20 text-danger bg-danger/5' :
                        'border-slate-700 text-slate-400 bg-slate-800/10'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Pending or Approved sessions */}
                  {m.status === 'Pending' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Add discussion summary / feedback note..."
                        value={notesText[m._id] || ''}
                        onChange={(e) => setNotesText(prev => ({ ...prev, [m._id]: e.target.value }))}
                        className="flex-1 px-3 py-1.5 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
                      />
                      <div className="flex space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleModerateMeeting(m._id, 'Approved')}
                          className="px-3 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary/10 transition text-[10px] font-bold uppercase flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleModerateMeeting(m._id, 'Cancelled')}
                          className="px-3 py-1.5 rounded-xl border border-danger text-danger hover:bg-danger/10 transition text-[10px] font-bold uppercase flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {m.status === 'Approved' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Final conference outcome notes..."
                        value={notesText[m._id] || ''}
                        onChange={(e) => setNotesText(prev => ({ ...prev, [m._id]: e.target.value }))}
                        className="flex-1 px-3 py-1.5 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
                      />
                      <button
                        onClick={() => handleModerateMeeting(m._id, 'Completed')}
                        className="px-3 py-1.5 rounded-xl border border-success text-success hover:bg-success/10 transition text-[10px] font-bold uppercase self-end sm:self-center flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recommendation Dispatcher */}
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 text-primary mb-4">
            <MessageSquare className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
              RECOMMENDATIONS DISPATCH
            </h3>
          </div>

          {recSuccess && (
            <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded-lg text-success text-[10px] font-bold uppercase">
              {recSuccess}
            </div>
          )}
          {recError && (
            <div className="mb-3 p-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-[10px] font-bold uppercase">
              {recError}
            </div>
          )}

          <form onSubmit={handlePostRecommendation} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">SELECT STUDENT</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
              >
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.academicRisk})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">RECOMMENDATION TEXT</label>
              <textarea
                required
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                placeholder="E.g., Complete AWS Cloud practitioner certification badge, practice 20 hours coding practice..."
                className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition h-24 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRec}
              className="w-full py-2 bg-primary hover:bg-primary/95 text-slate-900 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              <span>DISPATCH ADVICE</span>
              <Send className="w-3.5 h-3.5" />
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

export default AdvisorCenter;
