import { useState } from 'react';
import api from '../../api/api';
import AssignTechnicianModal from '../modals/AssignTechnicianModal';
import RejectTicketModal from '../modals/RejectTicketModal';
import SlaPanel from './SlaPanel';
import './TicketDetails.css';

const ROLE_PROFILE = {
  USER:       { label: 'User',       avatarBg: '#6366f1', initial: 'U' },
  ADMIN:      { label: 'Admin',      avatarBg: '#ef4444', initial: 'A' },
  TECHNICIAN: { label: 'Technician', avatarBg: '#f59e0b', initial: 'T' },
};

const TicketDetails = ({ ticket, onUpdate, currentRole = 'USER' }) => {
  const [updatingStr, setUpdatingStr] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [notesText, setNotesText] = useState('');

  const statuses = currentRole === 'ADMIN'
    ? ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
    : ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      setPendingStatus(newStatus);
      setNotesText('');
      setShowNotesModal(true);
      return;
    }
    await submitStatusChange(newStatus, null);
  };

  const submitStatusChange = async (status, notes) => {
    try {
      setUpdatingStr(true);
      await api.patch(`/tickets/${ticket.id}/status`, { status, resolutionNotes: notes || undefined });

      let chatMessage = null;
      if (status === 'IN_PROGRESS') chatMessage = 'I have accepted this ticket and will start working on it.';
      else if (status === 'RESOLVED') chatMessage = `This ticket has been resolved. Resolution: ${notes}`;
      else if (status === 'CLOSED') chatMessage = `This ticket has been closed. Reason: ${notes}`;

      if (chatMessage) {
        await api.post(`/tickets/${ticket.id}/comments`, { content: chatMessage, senderRole: currentRole });
      }

      const updated = await api.get(`/tickets/${ticket.id}`);
      onUpdate(updated.data);
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdatingStr(false);
    }
  };

  const handleNotesSubmit = async () => {
    if (!notesText.trim()) return;
    setShowNotesModal(false);
    await submitStatusChange(pendingStatus, notesText);
    setNotesText('');
    setPendingStatus(null);
  };

  return (
    <div className="details-container">
      <div className="details-top">
        <div className="details-user-row">
          <div className="details-avatar" style={{ background: ROLE_PROFILE[currentRole]?.avatarBg }}>
            {currentRole === 'TECHNICIAN' && ticket.assignedToName
              ? ticket.assignedToName.charAt(0).toUpperCase()
              : ROLE_PROFILE[currentRole]?.initial}
          </div>
          <div className="details-user-info">
            <div className="details-user-name">
              {currentRole === 'TECHNICIAN'
                ? (ticket.assignedToName || 'Technician')
                : ROLE_PROFILE[currentRole]?.label}
            </div>
            <div className="details-user-id">
              {currentRole === 'ADMIN' && 'Administrator'}
              {currentRole === 'TECHNICIAN' && 'Support Technician'}
              {currentRole === 'USER' && 'Ticket Submitter'}
            </div>
          </div>
        </div>

        <div className="details-ticket-id">#{ticket.id}</div>

        {currentRole === 'TECHNICIAN' && ticket.status === 'IN_PROGRESS' && (
          <div className="details-main-actions">
            <button className="btn-success" onClick={() => handleStatusChange('RESOLVED')} disabled={updatingStr}>
              Resolve
            </button>
          </div>
        )}
        {currentRole === 'ADMIN' && ticket.status !== 'RESOLVED' && ticket.status !== 'REJECTED' && ticket.status !== 'CLOSED' && (
          <div className="details-main-actions">
            <button className="btn-danger" onClick={() => setShowRejectModal(true)} disabled={updatingStr}>
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="details-content">
        {currentRole === 'TECHNICIAN' && (
          <div>
            <div className="section-label">Status</div>
            <div className="status-selector">
              {statuses.map(s => (
                <button
                  key={s}
                  className={`status-btn ${ticket.status === s ? 'active' : ''}`}
                  disabled={updatingStr}
                  onClick={() => handleStatusChange(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="details-row">
          <span className="details-row-label">Category</span>
          <span className="details-row-value">{ticket.category}</span>
        </div>

        <div className="details-row">
          <span className="details-row-label">Priority</span>
          <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
        </div>

        <div className="details-row">
          <span className="details-row-label">Status</span>
          <span className={`badge badge-${ticket.status?.toLowerCase()}`}>{ticket.status?.replace('_', ' ')}</span>
        </div>

        <div className="details-row">
          <span className="details-row-label">Resource</span>
          <span className="details-row-value">{ticket.resourceId || 'N/A'}</span>
        </div>

        <div className="details-row">
          <span className="details-row-label">Assigned To</span>
          <span className="details-row-value">
            {ticket.assignedToName || 'Unassigned'}
          </span>
        </div>

        <div>
          <div className="section-label">Description</div>
          <div className="description-box">{ticket.description}</div>
        </div>

        {ticket.resolutionNotes && (
          <div>
            <div className="section-label">Resolution Notes</div>
            <div className="resolution-box">{ticket.resolutionNotes}</div>
          </div>
        )}

        <SlaPanel ticket={ticket} />

        <div className="details-row">
          <span className="details-row-label">Created at</span>
          <span className="details-row-value">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
        {ticket.firstResponseAt && (
          <div className="details-row">
            <span className="details-row-label">First Response</span>
            <span className="details-row-value">{new Date(ticket.firstResponseAt).toLocaleDateString()}</span>
          </div>
        )}
        {ticket.resolvedAt && (
          <div className="details-row">
            <span className="details-row-label">Resolved at</span>
            <span className="details-row-value">{new Date(ticket.resolvedAt).toLocaleDateString()}</span>
          </div>
        )}

        {ticket.status === 'OPEN' && currentRole === 'ADMIN' && (
          <div className="admin-actions-box">
            <div className="section-label">Admin Actions</div>
            <div className="admin-btn-group">
              <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
                Assign Technician
              </button>
            </div>
          </div>
        )}

        {currentRole === 'TECHNICIAN' && ticket.assignedTo && ticket.status !== 'RESOLVED' && ticket.status !== 'REJECTED' && ticket.status !== 'CLOSED' && (
          <div className="admin-actions-box">
            <div className="section-label">Assignment Actions</div>
            <div className="admin-btn-group">
              <button
                className="btn-primary"
                disabled={updatingStr}
                onClick={async () => {
                  try {
                    setUpdatingStr(true);
                    await api.patch(`/tickets/${ticket.id}/status`, { status: 'IN_PROGRESS' });
                    await api.post(`/tickets/${ticket.id}/comments`, {
                      content: 'I have accepted this assignment and will begin working on your ticket.',
                      senderRole: 'TECHNICIAN'
                    });
                    const updated = await api.get(`/tickets/${ticket.id}`);
                    onUpdate(updated.data);
                  } catch (error) {
                    console.error('Failed to accept assignment', error);
                  } finally {
                    setUpdatingStr(false);
                  }
                }}
              >
                Accept Assignment
              </button>
              <button className="btn-danger-outline" onClick={() => setShowRejectModal(true)}>
                Decline
              </button>
            </div>
          </div>
        )}
      </div>

      {showAssignModal && (
        <AssignTechnicianModal ticket={ticket} onClose={() => setShowAssignModal(false)} onUpdate={onUpdate} />
      )}

      {showRejectModal && (
        <RejectTicketModal
          ticket={ticket}
          onClose={() => setShowRejectModal(false)}
          onUpdate={onUpdate}
          rejectEndpoint={currentRole === 'TECHNICIAN' ? 'decline-assignment' : 'reject'}
          modalTitle={currentRole === 'TECHNICIAN' ? 'Decline Assignment' : 'Reject Ticket'}
        />
      )}

      {showNotesModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{pendingStatus === 'RESOLVED' ? 'Resolve Ticket' : 'Close Ticket'}</h3>
            <p>Please provide notes about how this ticket was {pendingStatus === 'RESOLVED' ? 'resolved' : 'closed'}.</p>
            <textarea
              className="notes-textarea"
              placeholder={pendingStatus === 'RESOLVED' ? 'Describe the resolution...' : 'Reason for closing...'}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button className="btn-danger-outline" onClick={() => { setShowNotesModal(false); setPendingStatus(null); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleNotesSubmit} disabled={!notesText.trim() || updatingStr}>
                {pendingStatus === 'RESOLVED' ? 'Mark as Resolved' : 'Close Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
