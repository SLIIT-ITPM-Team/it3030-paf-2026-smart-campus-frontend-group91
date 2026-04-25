import { useState, useEffect } from 'react';
import api from '../../api/api';
import TicketList from '../ticket/TicketList';
import ChatComments from '../chat/ChatComments';
import TicketDetails from '../ticket/TicketDetails';
import CreateTicketModal from '../ticket/CreateTicketModal';
import './TicketDashboard.css';

const TicketDashboard = ({ currentRole }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

  const filteredTickets = activeFilter === 'ALL'
    ? tickets
    : tickets.filter(t => t.status === activeFilter);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets');
      const data = response.data;
      setTickets(data);
      if (data.length > 0) {
        setSelectedTicket(prev => {
          if (!prev) return data[0];
          const updated = data.find(t => t.id === prev.id);
          return updated || data[0];
        });
      } else {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedTicket(null);
    setActiveFilter('ALL');
    fetchTickets();
  }, [currentRole]);

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleTicketCreated = () => {
    fetchTickets();
    setIsModalOpen(false);
  };

  const handleTicketUpdate = async (updatedTicket) => {
    if (updatedTicket) {
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    } else {
      try {
        const response = await api.get(`/tickets/${selectedTicket.id}`);
        setSelectedTicket(response.data);
        setTickets(prev => prev.map(t => t.id === response.data.id ? response.data : t));
      } catch (error) {
        console.error('Failed to refresh ticket', error);
      }
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="panel left-panel glass-panel">
        <div className="panel-header">
          <div className="panel-header-top">
            <h2>Incidents</h2>
            {currentRole === 'USER' && (
              <button className="btn-new-ticket" onClick={() => setIsModalOpen(true)}>+ New Ticket</button>
            )}
          </div>
          <div className="filters">
            {FILTERS.map(f => (
              <button
                key={f}
                data-status={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => { setActiveFilter(f); }}
              >
                <span className="filter-label">
                  {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                </span>
                <span className="filter-count">
                  {f === 'ALL' ? tickets.length : tickets.filter(t => t.status === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <TicketList
          tickets={filteredTickets}
          selectedId={selectedTicket?.id}
          onSelect={handleTicketSelect}
          loading={loading}
          currentRole={currentRole}
        />
      </div>

      <div className="panel center-panel glass-panel">
        {selectedTicket ? (
          <ChatComments ticket={selectedTicket} onUpdate={handleTicketUpdate} currentRole={currentRole} />
        ) : (
          <div className="empty-state">Select a ticket to view conversation</div>
        )}
      </div>

      <div className="panel right-panel glass-panel">
        {selectedTicket ? (
          <TicketDetails
            ticket={selectedTicket}
            onUpdate={handleTicketUpdate}
            currentRole={currentRole}
          />
        ) : (
          <div className="empty-state">Select a ticket to view details</div>
        )}
      </div>

      {isModalOpen && (
        <CreateTicketModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </div>
  );
};

export default TicketDashboard;
