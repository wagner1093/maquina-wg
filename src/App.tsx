import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Hosting from './pages/Hosting';
import Content from './pages/Content';
import Traffic from './pages/Traffic';
import Assistant from './pages/Assistant';
import Clients from './pages/Clients';
import Reminders from './pages/Reminders';
import EditorialCalendar from './pages/EditorialCalendar';
import Pipeline from './pages/Pipeline';
import Proposals from './pages/Proposals';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="finance" element={<Finance />} />
          <Route path="hosting" element={<Hosting />} />
          <Route path="traffic" element={<Traffic />} />
          <Route path="content" element={<Content />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="calendar" element={<EditorialCalendar />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="proposals" element={<Proposals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
