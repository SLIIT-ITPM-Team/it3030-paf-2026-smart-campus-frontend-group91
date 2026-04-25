import { useState, useRef, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../auth/AuthContext';
import './ChatComments.css';

const ROLE_CONFIG = {
  USER:       { label: 'User',       avatarBg: 'av-user',  bubbleClass: 'bubble-user',  mockName: 'User'          },
  ADMIN:      { label: 'Admin',      avatarBg: 'av-admin', bubbleClass: 'bubble-admin', mockName: 'Admin'         },
  TECHNICIAN: { label: 'Technician', avatarBg: 'av-tech',  bubbleClass: 'bubble-tech',  mockName: 'Technician'   },
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

const formatTime = (dt) =>
  new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (dt) =>
  new Date(dt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

const ChatComments = ({ ticket, onUpdate, currentRole = 'USER' }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const bottomRef = useRef(null);
  const { user } = useAuth();

  const currentCfg = ROLE_CONFIG[currentRole] || ROLE_CONFIG.USER;
  const currentUserName = currentRole === 'TECHNICIAN'
    ? (ticket.assignedToName || 'Technician')
    : currentRole === 'ADMIN'
    ? (user?.username || 'Admin')
    : (user?.username || currentCfg.mockName);

  const currentRoleLabel = currentCfg.label;
  const isAssigned = !!ticket.assignedTo;
  const canChat = currentRole !== 'TECHNICIAN' || isAssigned;

  const serverComments = ticket.comments || [];
  const visibleComments = [
    ...serverComments,
    ...localComments.filter(lc => !serverComments.find(sc => sc.id === lc.id)),
  ];

  const descriptionMessage = {
    id: 'ticket-description',
    userName: ticket.createdByName || user?.username || 'User',
    senderRole: 'USER',
    content: ticket.description,
    createdAt: ticket.createdAt,
    isDescription: true,
  };

  const allMessages = [descriptionMessage, ...visibleComments];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canChat) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      userName: currentUserName,
      senderRole: currentRole,
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    setLocalComments(prev => [...prev, optimistic]);
    setNewComment('');

    try {
      setSubmitting(true);
      await api.post(`/tickets/${ticket.id}/comments`, {
        content: optimistic.content,
        senderRole: currentRole,
      });
      setLocalComments(prev => prev.filter(c => c.id !== optimistic.id));
      onUpdate();
    } catch {
      setLocalComments(prev => prev.filter(c => c.id !== optimistic.id));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className={`chat-ticket-avatar ${currentCfg.avatarBg}`}>
            {getInitial(currentUserName)}
          </div>
          <div>
            <div className="chat-header-name">{currentUserName}</div>
            <div className="chat-header-sub">{currentRoleLabel} · Ticket #{ticket.id}</div>
          </div>
        </div>
        <div className="chat-header-right">
          <span className={`chat-status-pill status-${ticket.status?.toLowerCase()}`}>
            {ticket.status?.replace('_', ' ')}
          </span>
          <span className="chat-msg-count">{allMessages.length} msgs</span>
        </div>
      </div>

      {!canChat ? (
        <div className="chat-locked">
          <div className="chat-locked-icon">🔒</div>
          <div className="chat-locked-title">Access Restricted</div>
          <div className="chat-locked-msg">You are not assigned to this ticket yet. Please wait for an administrator to assign you before you can view or participate in this conversation.</div>
        </div>
      ) : (
        <div className="chat-messages">
          <div className="chat-date-divider">
            <span>{formatDate(ticket.createdAt)}</span>
          </div>

          {allMessages.map((msg, idx) => {
            const role = msg.senderRole || 'USER';
            const isMine = role === currentRole;
            const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.USER;
            const myCfg = ROLE_CONFIG[currentRole] || ROLE_CONFIG.USER;

            const prevMsg = allMessages[idx - 1];
            const showDivider = prevMsg &&
              new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

            return (
              <div key={msg.id}>
                {showDivider && (
                  <div className="chat-date-divider">
                    <span>{formatDate(msg.createdAt)}</span>
                  </div>
                )}

                <div className={`chat-row ${isMine ? 'row-mine' : 'row-other'}`}>
                  {!isMine && (
                    <div className={`chat-av ${cfg.avatarBg}`} title={msg.userName}>
                      {getInitial(msg.userName)}
                    </div>
                  )}

                  <div className={`chat-col ${isMine ? 'col-mine' : 'col-other'}`}>
                    <div className={`chat-meta ${isMine ? 'meta-mine' : ''}`}>
                      <span className="chat-name">{msg.userName}</span>
                      {msg.isDescription && <span className="tag tag-issue">Issue</span>}
                      {!msg.isDescription && (
                        <span className={`tag tag-${role.toLowerCase()}`}>
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    <div className={`bubble ${isMine ? 'bubble-mine' : cfg.bubbleClass} ${msg.isDescription ? 'bubble-desc' : ''}`}>
                      {msg.content}
                    </div>

                    <div className={`chat-time ${isMine ? 'time-mine' : ''}`}>
                      {formatTime(msg.createdAt)}
                      {isMine && <span className="read-tick"> ✓✓</span>}
                    </div>
                  </div>

                  {isMine && (
                    <div className={`chat-av ${myCfg.avatarBg}`} title={msg.userName}>
                      {getInitial(msg.userName)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {canChat && (
        <div className="chat-footer">
          <form className="chat-form" onSubmit={handleSend}>
            <input
              className="chat-input"
              placeholder="Type a message..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-send"
              disabled={submitting || !newComment.trim()}
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatComments;
