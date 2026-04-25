import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import './UserDashboard.css';
import './TechnicianDashboard.css';

const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TICKET_STATUSES   = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const badgeClass = (value) =>
  String(value || 'UNKNOWN').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const TechnicianDashboard = () => {
  const { user, hasRoles } = useAuth();
  const isTechnician = hasRoles(['TECHNICIAN']);
  const isAdmin      = hasRoles(['ADMIN']);
  const dashboardRoleLabel = isAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'USER';

  const [activeModule, setActiveModule] = useState('tickets');
  const [tickets, setTickets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [ticketFilters, setTicketFilters] = useState({ status: 'ALL', priority: 'ALL' });

  const displayName = useMemo(() => {
    const src = user?.name || user?.fullName || user?.username;
    return src || user?.email?.split('@')?.[0] || 'Technician';
  }, [user]);

  const today = useMemo(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(new Date()), []);

  // ── fetch tickets from API ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tickets');
        setTickets(Array.isArray(res.data) ? res.data : []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── derived counts ──────────────────────────────────────────
  const openQueueCount       = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount      = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const unassignedCount      = tickets.filter(t => t.status === 'OPEN' && !t.assignedTo).length;
  const assignedToMeCount    = tickets.filter(t =>
    ['OPEN','IN_PROGRESS','RESOLVED'].includes(t.status) &&
    (t.assignedTo === user?.id || String(t.assignedToName || '').toLowerCase().includes(displayName.toLowerCase()))
  ).length;
  const criticalCount        = tickets.filter(t =>
    t.priority === 'CRITICAL' && ['OPEN','IN_PROGRESS'].includes(t.status)
  ).length;

  const summaryCards = [
    { label: 'Open Queue',     value: openQueueCount,    hint: 'Tickets waiting for technician action.' },
    { label: 'In Progress',    value: inProgressCount,   hint: 'Active work currently underway.' },
    { label: 'Unassigned',     value: unassignedCount,   hint: 'Open incidents without an assignee.' },
    { label: 'Assigned to Me', value: assignedToMeCount, hint: 'My active and recently resolved tickets.' },
  ];

  // ── filtered ticket list ────────────────────────────────────
  const visibleTickets = useMemo(() => {
    return tickets.filter(t => {
      if (ticketFilters.status   !== 'ALL' && t.status   !== ticketFilters.status)   return false;
      if (ticketFilters.priority !== 'ALL' && t.priority !== ticketFilters.priority) return false;
      return true;
    });
  }, [tickets, ticketFilters]);

  // ── inline status update ────────────────────────────────────
  const updateStatus = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (e) {
      console.error('Status update failed', e);
    }
  };

  return (
    <section className="udash-root udash-root-tech">
      <div className="udash-wrap">

        {/* ── HERO ── */}
        <header className="udash-hero udash-hero-tech">
          <p className="udash-kicker">Smart Campus Technician Dashboard</p>
          <h1>Incident Operations Hub, {displayName}</h1>
          <p>Manage maintenance and incident lifecycles end-to-end, from triage and assignment to closure.</p>
          <div className="udash-meta-row">
            <span className="udash-pill">{today}</span>
            <span className="udash-pill">Role: {dashboardRoleLabel}</span>
            <span className="udash-pill">Critical Queue: {criticalCount}</span>
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <section className="udash-summary udash-summary-tech">
          {summaryCards.map(card => (
            <div className="udash-stat" key={card.label}>
              <h3>{card.label}</h3>
              <strong>{loading ? '—' : card.value}</strong>
              <span className="udash-small">{card.hint}</span>
            </div>
          ))}
        </section>

        {/* ── QUICK ACTIONS ── */}
        <section className="udash-tech-actions">
          {[
            { label: 'Review OPEN Queue',       status: 'OPEN' },
            { label: 'Continue IN_PROGRESS Work', status: 'IN_PROGRESS' },
            { label: 'View Full Ticket Queue',   status: 'ALL' },
          ].map(({ label, status }) => (
            <button
              key={label}
              type="button"
              className="udash-tech-action"
              onClick={() => { setActiveModule('tickets'); setTicketFilters(p => ({ ...p, status })); }}
            >
              {label}
            </button>
          ))}
        </section>

        {/* ── TABS ── */}
        <nav className="udash-tabs">
          {['tickets'].map(mod => (
            <button
              key={mod}
              type="button"
              className={activeModule === mod ? 'udash-tab udash-tab-active' : 'udash-tab'}
              onClick={() => setActiveModule(mod)}
            >
              Maintenance &amp; Ticketing
            </button>
          ))}
        </nav>

        {/* ── TICKET MODULE ── */}
        {activeModule === 'tickets' && (
          <section className="udash-grid">

            {/* filters */}
            <article className="udash-card">
              <h2>Ticket Filters</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Status
                  <select
                    className="udash-select"
                    value={ticketFilters.status}
                    onChange={e => setTicketFilters(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="ALL">All Statuses</option>
                    {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </label>
                <label className="udash-field">
                  Priority
                  <select
                    className="udash-select"
                    value={ticketFilters.priority}
                    onChange={e => setTicketFilters(p => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="ALL">All Priorities</option>
                    {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <div className="udash-small" style={{ marginTop: '12px' }}>
                Showing <strong>{visibleTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
              </div>
            </article>

            {/* stats recap */}
            <article className="udash-card">
              <h2>Queue Summary</h2>
              <div className="udash-form-grid">
                {[
                  { label: 'Open',        val: openQueueCount,    cls: 'open' },
                  { label: 'In Progress', val: inProgressCount,   cls: 'in-progress' },
                  { label: 'Unassigned',  val: unassignedCount,   cls: 'pending' },
                  { label: 'Critical',    val: criticalCount,     cls: 'critical' },
                ].map(({ label, val, cls }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color, #0d9488)' }}>
                      {loading ? '—' : val}
                    </div>
                    <span className={`udash-badge ${cls}`}>{label}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* ticket list */}
            <article className="udash-card udash-grid-wide">
              <h2>
                {ticketFilters.status === 'ALL' ? 'All Tickets' : `${ticketFilters.status.replace('_',' ')} Tickets`}
                &nbsp;({visibleTickets.length})
              </h2>

              {loading ? (
                <div className="udash-small">Loading tickets from database…</div>
              ) : (
                <ul className="udash-list">
                  {visibleTickets.length === 0 ? (
                    <li className="udash-item">No tickets match the current filters.</li>
                  ) : visibleTickets.map(ticket => (
                    <li className="udash-item" key={ticket.id}>
                      <div className="udash-item-head">
                        <h3>#{ticket.id} — {ticket.category}</h3>
                        <span className={`udash-badge ${badgeClass(ticket.status)}`}>
                          {ticket.status?.replace('_',' ')}
                        </span>
                      </div>
                      <div className="udash-item-meta">{ticket.description}</div>
                      <div className="udash-item-meta">
                        Priority: <span className={`udash-badge ${badgeClass(ticket.priority)}`}>{ticket.priority}</span>
                        &nbsp;| Reported by: <strong>{ticket.createdByName || 'User'}</strong>
                        &nbsp;| Assigned to: <strong>{ticket.assignedToName || 'Unassigned'}</strong>
                      </div>
                      <div className="udash-small">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                        {ticket.contactDetails ? ` | Contact: ${ticket.contactDetails}` : ''}
                      </div>

                      {/* technician action buttons */}
                      {isTechnician && (
                        <div className="udash-actions">
                          {ticket.status === 'OPEN' && (
                            <button
                              type="button"
                              className="udash-btn"
                              onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                            >
                              Start Work
                            </button>
                          )}
                          {ticket.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              className="udash-btn"
                              onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                            >
                              Mark Resolved
                            </button>
                          )}
                          {ticket.status === 'RESOLVED' && (
                            <button
                              type="button"
                              className="udash-btn udash-btn-outline"
                              onClick={() => updateStatus(ticket.id, 'CLOSED')}
                            >
                              Close Ticket
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>

          </section>
        )}

      </div>
    </section>
  );
};

export default TechnicianDashboard;
