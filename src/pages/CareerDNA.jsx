import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Sparkles, Award, Target, BookOpen, Layers } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const CareerDNA = () => {
  const [dna, setDna] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDna = async () => {
      try {
        const res = await axios.get('/api/career-dna');
        setDna(res.data);
      } catch (err) {
        console.error('Error fetching career DNA records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDna();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  // Descriptions and skills for each role
  const roleDescriptions = {
    'Full Stack Developer': {
      desc: 'Combines frontend interface craft with robust server architectures, API pipelines, and schema designs.',
      skills: ['React/Vite', 'Node/Express', 'MongoDB/Mongoose', 'RESTful APIs', 'Security Handlers'],
      color: 'border-primary text-primary shadow-glow-primary bg-primary/5'
    },
    'Data Analyst': {
      desc: 'Uncovers patterns in telemetry logs, builds reports, and validates data pipelines to guide HODs/Advisors.',
      skills: ['SQL/NoSQL', 'Python Data Science', 'Tableau/Bi Charts', 'Aptitude Calculations', 'Data Scraping'],
      color: 'border-secondary text-secondary shadow-glow-secondary bg-secondary/5'
    },
    'Cloud Engineer': {
      desc: 'Deploys distributed services, manages scaling clusters, and establishes CI/CD build scripts.',
      skills: ['AWS Services', 'Docker Containers', 'Linux Systems', 'CI/CD Pipelines', 'Serverless Functions'],
      color: 'border-success text-success shadow-glow-success bg-success/5'
    },
    'Cybersecurity Analyst': {
      desc: 'Protects application endpoints, audits permission levels, and monitors network packets for anomalies.',
      skills: ['JWT Security', 'Network Protocols', 'Encryption Standards', 'Bcrypt/Hashing', 'Penetration Testing'],
      color: 'border-danger text-danger shadow-glow-danger bg-danger/5'
    },
    'AI Engineer': {
      desc: 'Builds analytical prediction indices, regression algorithms, and models simulating student growth curves.',
      skills: ['Python/PyTorch', 'Linear Algebra', 'Predictive Modeling', 'Heuristic Tuning', 'TensorFlow Core'],
      color: 'border-warning text-warning shadow-glow-warning bg-warning/5'
    },
    'UI/UX Designer': {
      desc: 'Shapes wireframes, designs Figma UI mockups, and tests layouts for responsiveness and mobile ease.',
      skills: ['Figma Prototyping', 'Tailwind Styling', 'User Journey Maps', 'CSS Transitions', 'Framer Animations'],
      color: 'border-cyan-300 text-cyan-300 shadow-glow-primary bg-cyan-300/5'
    }
  };

  // Format data for Recharts Radar
  const chartData = dna.map(item => ({
    subject: item.role,
    A: item.match,
    fullMark: 100
  }));

  const topMatch = dna[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-3xl border-glassBorder"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary text-glow-primary mb-1">
            <Sparkles className="w-4 h-4 text-glow-primary" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">Career DNA Profile</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-white">
            Career DNA Analyzer
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            AI-calculated compatibility index matching your academic marks, projects, and certifications against six core tech roles.
          </p>
        </div>
        {topMatch && (
          <div className={`px-4 py-2 rounded-2xl border text-center ${roleDescriptions[topMatch.role]?.color}`}>
            <p className="text-[8px] font-bold text-slate-400 tracking-wider">TOP COMPATIBILITY</p>
            <p className="text-sm font-black mt-0.5">{topMatch.role} ({topMatch.match}%)</p>
          </div>
        )}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recharts Radar Graph */}
        <GlassCard glow="primary" className="p-6 flex flex-col justify-between items-center min-h-[400px]">
          <h3 className="text-sm font-extrabold tracking-widest text-slate-300 mb-6 uppercase text-center w-full">
            CAREER MATCH RADAR GAUGE
          </h3>
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Radar
                  name="Match %"
                  dataKey="A"
                  stroke="#00E5FF"
                  fill="#00E5FF"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 text-center max-w-sm mt-4">
            Axes outline percentage compliance. Complete specialized certification badges to extend your compatibility levels.
          </p>
        </GlassCard>

        {/* Roles Details list */}
        <div className="space-y-6">
          <h3 className="text-sm font-extrabold tracking-widest text-slate-300 uppercase pl-2">
            DETAILED ROLE ANALYSIS
          </h3>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {dna.map((item, index) => {
              const details = roleDescriptions[item.role] || { desc: '', skills: [], color: 'border-white/5' };
              return (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition space-y-3 relative"
                >
                  {/* Floating compatibility badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-200">{item.role}</span>
                    <span className="text-xs font-black text-primary text-glow-primary">{item.match}% Match</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {details.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {details.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/5 text-[9px] font-bold text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CareerDNA;
