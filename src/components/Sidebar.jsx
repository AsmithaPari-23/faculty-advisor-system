import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Award,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Filter links by active role
  const getLinks = () => {
    switch (user.role) {
      case 'student':
        return [
          {
            path: '/dashboard',
            name: 'Analytics Dashboard',
            icon: LayoutDashboard
          },
          {
            path: '/career-dna',
            name: 'Career DNA Analyzer',
            icon: Award
          },
          {
            path: '/future-me',
            name: 'Future Me Simulator',
            icon: Compass
          },
          {
            path: '/simulator',
            name: 'Live Telemetry Sim',
            icon: Sparkles
          }
        ];
      case 'faculty':
        return [
          {
            path: '/advisor-center',
            name: 'Advisor Center',
            icon: BrainCircuit
          },
          {
            path: '/simulator',
            name: 'Live Telemetry Sim',
            icon: Sparkles
          }
        ];
      case 'admin':
        return [
          {
            path: '/admin',
            name: 'System Admin Panel',
            icon: ShieldCheck
          },
          {
            path: '/simulator',
            name: 'Live Telemetry Sim',
            icon: Sparkles
          }
        ];
      default:
        return [];
    }
  };

  const menuItems = getLinks();

  return (
    <aside className="glass w-64 h-[calc(100vh-4rem)] fixed top-16 left-0 z-30 border-r border-glassBorder p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
            Navigation Modules
          </p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 hover:border-glassBorder'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="p-4 rounded-xl border border-glassBorder bg-slate-950/20 text-center">
        <div className="flex items-center justify-center space-x-1.5 mb-1 text-slate-400">
          <span className="text-[10px] font-extrabold tracking-widest uppercase">ANALYTICS ENGINE</span>
        </div>
        <p className="text-[9px] text-slate-500">
          Success indexes auto-refresh upon academic uploads.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
