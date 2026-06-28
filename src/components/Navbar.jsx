import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Establish WebSocket client connection
    const socket = io(import.meta.env.VITE_API_URL || 'https://faculty-advisor-system.onrender.com');
    socket.emit('join', user._id);

    // Dynamic notification listeners
    socket.on('new_meeting_request', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'meeting',
          text: `New consultation request from ${data.studentName}!`,
          time: new Date(data.date).toLocaleDateString()
        },
        ...prev
      ]);
    });

    socket.on('academic_risk_alert', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'risk',
          text: `Alert: Student ${data.studentName} flagged as High Risk!`,
          time: 'Just Now'
        },
        ...prev
      ]);
    });

    socket.on('meeting_status_updated', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'status',
          text: `Meeting status updated to: ${data.status}`,
          time: 'Just Now'
        },
        ...prev
      ]);
    });

    socket.on('new_recommendation', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'recs',
          text: data.recommendation,
          time: 'Just Now'
        },
        ...prev
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getRoleColor = (role) => {
    if (role === 'admin') return 'border-[#7B61FF] text-[#7B61FF] bg-[#7B61FF]/10';
    if (role === 'faculty') return 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10';
    return 'border-[#00FF94] text-[#00FF94] bg-[#00FF94]/10';
  };

  return (
    <header className="glass h-16 w-full fixed top-0 left-0 right-0 z-40 border-b border-glassBorder flex items-center justify-between px-6 backdrop-blur-md">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-slate-300" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-widest text-slate-200 hidden md:block">
            FACULTY ADVISOR SYSTEM
          </h1>
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">
            STUDENT SUCCESS PLATFORM
          </span>
        </div>
      </div>

      {/* Action Controls & Notifications */}
      <div className="flex items-center space-x-4">
        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl border border-glassBorder hover:bg-slate-800/40 text-slate-300 hover:text-white transition duration-200"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-danger animate-pulse shadow-glow-danger" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass border border-glassBorder rounded-2xl shadow-2xl p-4 z-50 text-slate-300 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                <span className="text-xs font-bold text-slate-200">Alert Feed</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No active system alerts.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className="text-xs border-b border-white/5 pb-2 last:border-0">
                      <div className="flex justify-between items-center text-slate-400 text-[10px] mb-1">
                        <span className="font-semibold text-primary">{n.type.toUpperCase()}</span>
                        <span>{n.time}</span>
                      </div>
                      <p className="text-slate-200">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user.name}</p>
              <p className="text-[9px] text-slate-400">{user.email}</p>
            </div>
            <div className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>
              {user.role}
            </div>

            {/* Log Out */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl border border-glassBorder hover:border-danger/30 text-slate-400 hover:text-danger hover:bg-danger/5 transition duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
