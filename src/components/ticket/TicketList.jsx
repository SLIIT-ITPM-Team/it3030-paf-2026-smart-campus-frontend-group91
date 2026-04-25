import { useState } from 'react';
import './TicketList.css';

const PAGE_SIZE = 8;

const TicketList = ({ tickets, selectedId, onSelect, loading, currentRole }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = tickets.filter(t =>
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    String(t.id).includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="loading-state">Loading tickets...</div>;

  return (
    <>
      <div className="ticket-list-header">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search Ticket"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="sort-bar">
          <select className="sort-select">
            <option>Order By Escalation</option>
            <option>Order By Date</option>
            <option>Order By Priority</option>
          </select>
          <span>⇅</span>
        </div>
      </div>

      <div className="ticket-list-scrollable">
        {paginated.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>No tickets found.</div>
        ) : (
          paginated.map(ticket => (
            <div
              key={ticket.id}
              className={`ticket-item ${selectedId === ticket.id ? 'active' : ''}`}
              onClick={() => onSelect(ticket)}
            >
              <div className="ticket-avatar">
                {ticket.createdByName ? ticket.createdByName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ticket-item-body">
                <div className="ticket-item-top">
                  <span className="ticket-item-name">{ticket.createdByName || 'User'}</span>
                  <span className="ticket-item-time">
                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="ticket-item-id">#{ticket.id} · {ticket.category}</div>
                <div className="ticket-item-preview">{ticket.description}</div>
                {ticket.assignedToName && (
                  <div className="ticket-item-assigned">
                    🔧 {ticket.assignedToName}
                  </div>
                )}
              </div>
              <div className={`ticket-status-dot dot-${ticket.status.toLowerCase()}`} />
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <span>{PAGE_SIZE} Per Page</span>
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${page === i + 1 ? 'active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
        </div>
      </div>
    </>
  );
};

export default TicketList;
