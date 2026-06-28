import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// Pages lazy/direct imports
import Login from '../pages/Login';
import StudentDashboard from '../pages/StudentDashboard';
import FutureMe from '../pages/FutureMe';
import CareerDNA from '../pages/CareerDNA';
import AdvisorCenter from '../pages/AdvisorCenter';
import AdminDashboard from '../pages/AdminDashboard';
import Simulator from '../pages/Simulator';

// Layout Wrapper
const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-darkBg text-slate-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 pt-16 min-h-screen overflow-x-hidden">
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Route Guard: Authentication
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-primary border-slate-800 rounded-full animate-spin shadow-glow-primary" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Route Guard: Role Check
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to default dashboards based on user role
    if (user?.role === 'faculty') return <Navigate to="/advisor-center" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={user.role === 'student' ? '/dashboard' : (user.role === 'faculty' ? '/advisor-center' : '/admin')} replace />}
      />

      {/* Protected Dashboards */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          
          {/* Student Area */}
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/future-me" element={<FutureMe />} />
            <Route path="/career-dna" element={<CareerDNA />} />
          </Route>

          {/* Faculty Advisor Area */}
          <Route element={<RoleRoute allowedRoles={['faculty']} />}>
            <Route path="/advisor-center" element={<AdvisorCenter />} />
          </Route>

          {/* Admin Area */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Simulator Area */}
          <Route path="/simulator" element={<Simulator />} />

          {/* Root redirect */}
          <Route
            path="*"
            element={<Navigate to={user?.role === 'student' ? '/dashboard' : (user?.role === 'faculty' ? '/advisor-center' : '/admin')} replace />}
          />
        </Route>
      </Route>

      {/* Fallback to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
