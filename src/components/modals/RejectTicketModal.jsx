import { useState } from 'react';
import api from '../../api/api';
import './RejectTicketModal.css';

const RejectTicketModal = ({ ticket, onClose, onUpdate, rejectEndpoint = 'reject', modalTitle = 'Reject Ticket' }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await api.patch(`/tickets/${ticket.id}/${rejectEndpoint}`, { reason });

      if (rejectEndpoint === 'reject') {
        await api.post(`/tickets/${ticket.id}/comments`, {
          content: `Your ticket has been rejected. Rejection reason: ${reason}`,
          senderRole: 'ADMIN'
        });
      }

      const updated = await api.get(`/tickets/${ticket.id}`);
      onUpdate(updated.data);
      onClose();
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-panel reject-modal">
        <div className="modal-header">
          <h2>{modalTitle} #{ticket.id}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="alert alert-warning">
            {rejectEndpoint === 'decline-assignment'
              ? 'Declining will unassign you from this ticket and return it to OPEN status.'
              : 'Rejecting this ticket will close it permanently. You must provide a reason for the user.'}
          </div>

          <div className="form-group">
            <label>Reason *</label>
            <textarea
              className="input-field t-area"
              rows="4"
              placeholder={rejectEndpoint === 'decline-assignment'
                ? 'e.g. This is outside my area of expertise.'
                : 'e.g. This is a duplicate request, or we do not service personal laptops.'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-danger" disabled={loading || !reason.trim()}>
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectTicketModal;
