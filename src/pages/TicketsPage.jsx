import { useAuth } from '../auth/AuthContext';
import TicketDashboard from '../components/dashboard/TicketDashboard';

const TicketsPage = () => {
  const { user } = useAuth();
  const currentRole = user?.roles?.[0] || 'USER';
  return <TicketDashboard currentRole={currentRole} />;
};

export default TicketsPage;
