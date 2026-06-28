import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sliders, ChevronRight, HelpCircle, GraduationCap, Award, Compass, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';

// Simple debounce helper
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const FutureMe = () => {
  // Baseline actual state
  const [actualData, setActualData] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Sliders state
  const [attendance, setAttendance] = useState(80);
  const [marks, setMarks] = useState(70);
  const [projects, setProjects] = useState(1);
  const [certifications, setCertifications] = useState(0);
  const [assignments, setAssignments] = useState(80);

  // Prediction output
  const [prediction, setPrediction] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch actual baselines on mount
  useEffect(() => {
    const fetchBaselines = async () => {
      try {
        const [acadRes, successRes] = await Promise.all([
          axios.get('/api/student/academic'),
          axios.get('/api/student-success')
        ]);

        setActualData(acadRes.data);
        setSuccessData(successRes.data);

        // Pre-fill sliders with current actual values
        const attAvg = Math.round(acadRes.data.attendance.reduce((sum, a) => sum + a.percentage, 0) / acadRes.data.attendance.length);
        const marksAvg = Math.round(acadRes.data.marks.reduce((sum, m) => sum + m.score, 0) / acadRes.data.marks.length);
        const assignmentsRate = Math.round((acadRes.data.assignments.completed / (acadRes.data.assignments.completed + acadRes.data.assignments.pending)) * 100);

        setAttendance(attAvg);
        setMarks(marksAvg);
        setProjects(acadRes.data.projects.length);
        setCertifications(acadRes.data.certifications.length);
        setAssignments(assignmentsRate);

      } catch (err) {
        console.error('Error fetching academic baselines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBaselines();
  }, []);

  // Recalculate simulation values
  const runSimulation = async (att, mrk, prj, crt, asg) => {
    setSimLoading(true);
    try {
      const response = await axios.post('/api/future-me/simulate', {
        attendance: att,
        marks: mrk,
        projects: prj,
        certifications: crt,
        assignments: asg
      });
      setPrediction(response.data);
    } catch (err) {
      console.error('Simulation calculation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // Debounce API calls to prevent slider lag
  const debouncedSimulate = useCallback(
    debounce((att, mrk, prj, crt, asg) => {
      runSimulation(att, mrk, prj, crt, asg);
    }, 400),
    []
  );

  // Trigger simulation on any slider change
  useEffect(() => {
    if (loading) return;
    debouncedSimulate(attendance, marks, projects, certifications, assignments);
  }, [attendance, marks, projects, certifications, assignments, loading, debouncedSimulate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  // Format career match changes for Recharts Comparison
  const getCareerChartData = () => {
    if (!prediction) return [];
    
    return prediction.currentCareerDNA.map(curr => {
      const pred = prediction.predictedCareerDNA.find(p => p.role === curr.role) || { match: 0 };
      return {
        role: curr.role.split(' ')[0], // short name
        Current: curr.match,
        Predicted: pred.match
      };
    });
  };

  const careerChartData = getCareerChartData();

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">PROJECTION FORECASTS</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            Future Me Simulator
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Adjust academic parameters using the sliders below to dynamically simulate future growth scores, placement readiness, and career alignment.
          </p>
        </div>
      </motion.div>

      {/* Simulator Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sliders Panel */}
        <GlassCard glow="primary" className="p-6 lg:col-span-1 border border-glassBorder flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-primary mb-6">
              <Sliders className="w-5 h-5" />
              <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
                SIMULATION CONTROLS
              </h3>
            </div>

            <div className="space-y-6">
              {/* Attendance slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase">Class Attendance</span>
                  <span className="text-primary">{attendance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={attendance}
                  onChange={(e) => setAttendance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Marks slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase">Average Grades (Marks)</span>
                  <span className="text-primary">{marks}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Assignments slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase">Assignment Completion</span>
                  <span className="text-primary">{assignments}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={assignments}
                  onChange={(e) => setAssignments(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Projects count */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase">Capstone Projects Count</span>
                  <span className="text-primary">{projects}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={projects}
                  onChange={(e) => setProjects(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Certs count */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase">Certifications Earned</span>
                  <span className="text-primary">{certifications}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={certifications}
                  onChange={(e) => setCertifications(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 text-[9px] font-bold text-slate-500 tracking-wider text-center uppercase flex items-center justify-center space-x-1">
            <span>Forecasts update in real-time</span>
            {simLoading && <span className="w-2 h-2 rounded-full bg-primary animate-ping" />}
          </div>
        </GlassCard>

        {/* Prediction Outputs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main cards comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Success Score prediction card */}
            <GlassCard glow="secondary" className="p-6 relative overflow-hidden" hover={false}>
              <div className="flex justify-between items-start mb-4">
                <GraduationCap className="w-6 h-6 text-secondary" />
                <span className="text-[10px] font-black text-slate-500 uppercase">SUCCESS INDEX</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Current</p>
                  <p className="text-3xl font-extrabold text-slate-500">{prediction?.currentScore || 0}</p>
                </div>
                <div className="text-center font-black text-slate-500 text-sm">➔</div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-secondary uppercase">Predicted</p>
                  <p className="text-5xl font-black text-white">
                    {prediction?.predictedScore || 0}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Placement Readiness comparison card */}
            <GlassCard glow="success" className="p-6 relative overflow-hidden" hover={false}>
              <div className="flex justify-between items-start mb-4">
                <TrendingUp className="w-6 h-6 text-success" />
                <span className="text-[10px] font-black text-slate-500 uppercase">PLACEMENT INDEX</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Current</p>
                  <p className="text-3xl font-extrabold text-slate-500">{prediction?.currentPlacement || 0}%</p>
                </div>
                <div className="text-center font-black text-slate-500 text-sm">➔</div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-success uppercase">Predicted</p>
                  <p className="text-5xl font-black text-white">
                    {prediction?.predictedPlacement || 0}%
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* AI Recommendation Message */}
          <GlassCard glow="primary" className="p-5 border border-primary/20 relative overflow-hidden" hover={false}>
            <div className="flex items-start space-x-3 text-xs leading-relaxed font-semibold text-slate-200">
              <Compass className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-extrabold tracking-widest text-primary mb-1 uppercase">PROJECTION OUTCOMES</p>
                <p>{prediction?.recommendations}</p>
              </div>
            </div>
          </GlassCard>

          {/* Career Shifting compatibility Graph */}
          <GlassCard className="p-6">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-300 mb-6 uppercase">
              SIMULATED CAREER PATHWAY SHIFTING
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={careerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="role" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#090E1A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="Current" fill="rgba(123, 97, 255, 0.4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Predicted" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 text-[10px] font-bold text-slate-400 mt-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-secondary/40 rounded-full" />
                <span>CURRENT DNA MATCH (%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-primary rounded-full" />
                <span>SIMULATED DNA MATCH (%)</span>
              </div>
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
};

export default FutureMe;
