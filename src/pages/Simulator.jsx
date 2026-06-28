import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Terminal,
  Activity,
  Play,
  Square,
  Users,
  Wifi,
  WifiOff,
  Cpu,
  BookOpen,
  Calendar,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Simulator = () => {
  const [students, setStudents] = useState([]);
  const [actions, setActions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedActionKey, setSelectedActionKey] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // 1. Fetch Students
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/telemetry/students');
        setStudents(res.data);
        if (res.data.length > 0) {
          setSelectedStudentId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching simulator students:', err);
      }
    };

    // 2. Fetch Actions & Status
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/telemetry/status');
        setActions(res.data.availableActions);
        setIsAutoRunning(res.data.isAutoRunning);
        if (res.data.availableActions.length > 0) {
          setSelectedActionKey(res.data.availableActions[0].key);
        }
      } catch (err) {
        console.error('Error fetching simulator actions/status:', err);
      }
    };

    // 3. Fetch Historical Logs
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/telemetry/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching simulator logs:', err);
      }
    };

    fetchStudents();
    fetchStatus();
    fetchLogs();
  }, []);

  useEffect(() => {
    // Connect to WebSockets
    const socket = io(import.meta.env.VITE_API_URL || 'https://faculty-advisor-system.onrender.com');

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to real-time telemetry logs
    socket.on('telemetry_log', (newLog) => {
      setLogs(prev => [newLog, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll log console
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleManualSimulate = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedActionKey) return;
    setBtnLoading(true);

    try {
      await axios.post('/api/telemetry/simulate', {
        studentId: selectedStudentId,
        actionKey: selectedActionKey
      });
    } catch (err) {
      console.error('Manual telemetry execution failed:', err);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleQuickAction = async (studentId, actionKey) => {
    try {
      await axios.post('/api/telemetry/simulate', {
        studentId,
        actionKey
      });
    } catch (err) {
      console.error('Quick telemetry action failed:', err);
    }
  };

  const handleToggleAuto = async () => {
    const nextState = !isAutoRunning;
    try {
      const res = await axios.post('/api/telemetry/toggle-auto', {
        enabled: nextState
      });
      setIsAutoRunning(res.data.isAutoRunning);
    } catch (err) {
      console.error('Toggle background simulation failure:', err);
    }
  };

  const getLogColorClass = (type) => {
    if (type === 'danger') return 'text-danger font-bold';
    if (type === 'warning') return 'text-warning font-semibold';
    if (type === 'success') return 'text-success font-bold';
    return 'text-[#00E5FF]';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Connection Indicators */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">REAL-TIME DATA INGESTION GATEWAY</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            Live Telemetry & Activity Simulator
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Demonstrate real-time updates across student dashboards, advisor center, and HOD statistics panels.
          </p>
        </div>

        {/* Websocket Connection Status */}
        <div className="flex items-center space-x-3">
          <span className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border text-[10px] font-bold uppercase tracking-wider ${
            isConnected ? 'border-success/20 text-success bg-success/5' : 'border-danger/20 text-danger bg-danger/5'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-success animate-pulse" />
                <span>Websockets Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-danger" />
                <span>Websockets Offline</span>
              </>
            )}
          </span>
        </div>
      </motion.div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form controls */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Automated Generator Controller */}
          <GlassCard glow={isAutoRunning ? 'success' : 'none'} className="p-6 border border-glassBorder flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-primary mb-4">
                <Cpu className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
                  AUTOMATED ACTIVITY DAEMON
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                When active, the backend server simulates dynamic campus activity logs every 6 seconds, updating academic scores and pushes alerts automatically.
              </p>
            </div>

            <button
              onClick={handleToggleAuto}
              className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                isAutoRunning 
                  ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30' 
                  : 'bg-success hover:bg-success/95 text-slate-900'
              }`}
            >
              {isAutoRunning ? (
                <>
                  <Square className="w-4 h-4 fill-danger" />
                  <span>DISABLE ACTIVITY DAEMON</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-900" />
                  <span>ENABLE ACTIVITY DAEMON</span>
                </>
              )}
            </button>
          </GlassCard>

          {/* Manual Telemetry Trigger Form */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-2 text-primary mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
                MANUAL TELEMETRY DISPATCH
              </h3>
            </div>

            <form onSubmit={handleManualSimulate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
                >
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Select Telemetry Action</label>
                <select
                  value={selectedActionKey}
                  onChange={(e) => setSelectedActionKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-glassBorder focus:border-primary/50 focus:outline-none rounded-xl text-xs text-slate-100 transition"
                >
                  {actions.map(act => (
                    <option key={act.key} value={act.key}>{act.name} - {act.description.substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={btnLoading || students.length === 0}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-slate-900 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>DISPATCH SIMULATED TELEMETRY</span>
              </button>
            </form>
          </GlassCard>

        </div>

        {/* Central Terminal Console & Student list */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          
          {/* Visual Monospace console */}
          <GlassCard className="p-6 flex-1 flex flex-col justify-between border-glassBorder bg-slate-950/45" hover={false}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-slate-400">
                <Terminal className="w-5 h-5 text-secondary" />
                <span className="text-[10px] font-extrabold tracking-widest uppercase">LIVE SYSTEM TELEMETRY LOGGER</span>
              </div>
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
            </div>

            {/* Terminal console frame */}
            <div className="flex-1 bg-slate-950/90 rounded-2xl border border-white/5 p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">No telemetry data streamed yet. Start daemon or click dispatch above.</div>
              ) : (
                logs.slice().reverse().map((log, index) => (
                  <div key={log.id || index} className="flex items-start space-x-2 animate-fadeIn">
                    <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-slate-400 font-bold uppercase">{log.action}:</span>
                    <span className={getLogColorClass(log.type)}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
            
            <p className="text-[9px] text-slate-500 mt-3 uppercase tracking-wider text-center">
              Logs stream via WebSockets in real-time. Dashboard visuals synchronize instantly.
            </p>
          </GlassCard>

          {/* Quick Trigger Grid per Student */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-2 text-primary mb-4">
              <Users className="w-5 h-5" />
              <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
                QUICK MULTI-STUDENT ACTIONS
              </h3>
            </div>

            <div className="space-y-4 max-h-[170px] overflow-y-auto pr-1">
              {students.map(s => (
                <div key={s._id} className="p-3 rounded-xl bg-slate-950/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-[9px] text-slate-500">{s.department} | Year {s.year}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction(s._id, 'study_coding')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 hover:border-success/30 hover:text-success text-[10px] font-bold uppercase transition flex items-center space-x-1"
                    >
                      <Award className="w-3 h-3" />
                      <span>CODE (+hrs)</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction(s._id, 'complete_assignment')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 hover:border-primary/30 hover:text-primary text-[10px] font-bold uppercase transition flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>SUBMIT ASG</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction(s._id, 'skip_class')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 hover:border-danger/30 hover:text-danger text-[10px] font-bold uppercase transition flex items-center space-x-1"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>SKIP CLASS</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
};

export default Simulator;
