import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import SupportForm from './SupportForm';
import TicketList from './TicketList';
import TicketDetails from './TicketDetails';
import SupportChat from './SupportChat';

/**
 * Support routes component
 */
const SupportRoutes: React.FC = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login?redirect=/support" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/support/chat" replace />} />
      <Route path="/new" element={<SupportForm />} />
      <Route path="/tickets" element={<TicketList />} />
      <Route path="/tickets/:id" element={<TicketDetails />} />
      <Route path="/chat" element={<SupportChat />} />
    </Routes>
  );
};

export default SupportRoutes;
