import { useState, useEffect } from 'react';
import api from '../../api/api';
import './AssignTechnicianModal.css';

const AssignTechnicianModal = ({ ticket, onClose, onUpdate }) => {
  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const { data } = await api.get('/auth/technicians');
        setTechnicians(data);
      } catch (err) {
        console.error('Failed to fetch technicians', err);
        setError('Failed to load technicians.');
      } finally {
        setFetching(false);
      }
    };
    fetchTechnicians();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!technicianId) return;
    setError('');
    try {
      setLoading(true);
      const selectedTech = technicians.find(t => t.id === parseInt(technicianId));
      await api.patch(`/tickets/${ticket.id}/assign`, {
        assignedToId: parseInt(technicianId)
      });
      await api.post(`/tickets/${ticket.id}/comments`, {
        content: `A technician has been assigned to this ticket. ${selectedTech?.username} will be handling your request.`,
        senderRole: 'ADMIN'
      });
      const updated = await api.get(`/tickets/${ticket.id}`);
      onUpdate(updated.data);
      onClose();
    } catch (err) {
      console.error('Failed to assign technician', err);
      setError(err.response?.data?.error || 'Assignment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-panel assign-modal">
        <div className="modal-header">
          <h2>Assign Technician</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="ticket-summary">
            <strong>Ticket #{ticket.id}</strong> - {ticket.category}
            <div className="text-secondary">{ticket.description?.substring(0, 80)}...</div>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

          <div className="form-group">
            <label>Select Technician *</label>
            {fetching ? (
              <div className="text-secondary" style={{ padding: '0.5rem' }}>Loading technicians...</div>
            ) : technicians.length === 0 ? (
              <div style={{ padding: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
                No technicians registered yet.
              </div>
            ) : (
              <select
                className="input-field"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                required
              >
                <option value="" disabled>Choose Technician...</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.username} ({tech.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !technicianId || fetching}
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;
