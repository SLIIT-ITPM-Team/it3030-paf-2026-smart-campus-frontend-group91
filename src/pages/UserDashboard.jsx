import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import bookingService from '../services/bookingService';
import facilityService from '../services/facilityService';
import './UserDashboard.css';

const BOOKING_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const badgeClass = (value) =>
  String(value || 'UNKNOWN').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const normalizeTimeForDisplay = (value) => {
  if (!value) return '';
  const s = String(value);
  return s.includes('T') ? s.split('T')[1].slice(0, 5) : s.slice(0, 5);
};

const mapApiBooking = (b) => ({
  id: b.bookingId ?? b.id,
  resourceId: String(b.resourceId ?? b.facilityId ?? ''),
  resourceName: b.resourceName ?? b.facilityName ?? 'Unknown Resource',
  resourceType: b.resourceType ?? b.type ?? 'UNKNOWN',
  resourceLocation: b.resourceLocation ?? b.location ?? 'N/A',
  date: b.bookingDate ?? b.date ?? (b.startTime ? String(b.startTime).slice(0, 10) : ''),
  startTime: b.startTimeOnly ?? normalizeTimeForDisplay(b.startTime),
  endTime: b.endTimeOnly ?? normalizeTimeForDisplay(b.endTime),
  purpose: b.purpose ?? '',
  attendees: b.attendees ?? b.expectedAttendees ?? 0,
  status: b.status ?? 'PENDING',
  decisionReason: b.decisionReason ?? b.rejectionReason ?? b.cancellationReason ?? '',
  userEmail: b.userEmail ?? '',
  requestedBy: b.userName ?? b.userEmail ?? 'Campus User',
});

// format location object from catalog API
const formatLocation = (loc) => {
  if (!loc) return 'N/A';
  if (typeof loc === 'string') return loc;
  return [loc.buildingName, loc.floorNumber && `Floor ${loc.floorNumber}`, loc.roomNumber]
    .filter(Boolean).join(', ') || loc.description || 'N/A';
};

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = useMemo(() => {
    const src = user?.name || user?.fullName || user?.username;
    return src || user?.email?.split('@')?.[0] || 'User';
  }, [user]);

  const today = useMemo(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(new Date()), []);

  const [activeModule, setActiveModule] = useState('catalogue');

  // ── Resources ───────────────────────────────────────────────
  const [resources, setResources]           = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [catalogueFilters, setCatalogueFilters] = useState({
    query: '', type: 'ALL', minCapacity: '', location: '', status: 'ALL',
  });

  useEffect(() => {
    facilityService.getAllFacilities()
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setResourcesLoading(false));
  }, []);

  const resourceTypes    = useMemo(() => [...new Set(resources.map(r => r.type).filter(Boolean))], [resources]);
  const resourceStatuses = useMemo(() => [...new Set(resources.map(r => r.status).filter(Boolean))], [resources]);

  const filteredResources = useMemo(() => resources.filter(item => {
    if (catalogueFilters.query &&
      !`${item.name ?? ''} ${item.id}`.toLowerCase().includes(catalogueFilters.query.toLowerCase()))
      return false;
    if (catalogueFilters.type !== 'ALL' && item.type !== catalogueFilters.type) return false;
    if (catalogueFilters.status !== 'ALL' && item.status !== catalogueFilters.status) return false;
    if (catalogueFilters.location) {
      const locStr = formatLocation(item.location).toLowerCase();
      if (!locStr.includes(catalogueFilters.location.toLowerCase())) return false;
    }
    if (catalogueFilters.minCapacity) {
      const min = Number(catalogueFilters.minCapacity);
      if (!Number.isNaN(min) && (item.capacity ?? 0) < min) return false;
    }
    return true;
  }), [resources, catalogueFilters]);

  // ── Bookings ─────────────────────────────────────────────────
  const [bookings, setBookings]           = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilters, setBookingFilters] = useState({ status: 'ALL', type: 'ALL', location: '' });
  const [bookingError, setBookingError]   = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    bookingService.getUserBookings(user?.id)
      .then(data => setBookings(Array.isArray(data) ? data.map(mapApiBooking) : []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [user?.id]);

  const visibleBookings = useMemo(() => bookings
    .filter(b => {
      if (bookingFilters.status !== 'ALL' && b.status !== bookingFilters.status) return false;
      if (bookingFilters.type !== 'ALL' && b.resourceType !== bookingFilters.type) return false;
      if (bookingFilters.location &&
        !b.resourceLocation.toLowerCase().includes(bookingFilters.location.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
  [bookings, bookingFilters]);

  const cancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'CANCELLED', decisionReason: 'Cancelled by requester.' } : b
      ));
      setBookingMessage(`Booking ${bookingId} cancelled.`);
      setBookingError('');
    } catch {
      setBookingError('Failed to cancel booking. Please try again.');
    }
  };

  // ── Tickets ──────────────────────────────────────────────────
  const [tickets, setTickets]             = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketFilters, setTicketFilters] = useState({ status: 'ALL', priority: 'ALL' });

  useEffect(() => {
    api.get('/tickets')
      .then(res => setTickets(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, []);

  const visibleTickets = useMemo(() => tickets.filter(t => {
    if (ticketFilters.status !== 'ALL' && t.status !== ticketFilters.status) return false;
    if (ticketFilters.priority !== 'ALL' && t.priority !== ticketFilters.priority) return false;
    return true;
  }), [tickets, ticketFilters]);

  // ── Summary counts ───────────────────────────────────────────
  const summaryCards = [
    { label: 'Catalogue Items', value: resources.length,  hint: 'Facilities and assets in the system.' },
    { label: 'My Bookings',     value: bookings.length,   hint: 'Current and past booking requests.' },
    { label: 'My Open Tickets', value: tickets.filter(t => ['OPEN','IN_PROGRESS','RESOLVED'].includes(t.status)).length,
      hint: 'Tickets still active.' },
  ];

  return (
    <section className="udash-root">
      <div className="udash-wrap">

        {/* ── HERO ── */}
        <header className="udash-hero">
          <p className="udash-kicker">Smart Campus User Dashboard</p>
          <h1>Welcome, {displayName}</h1>
          <p>Resource discovery, booking operations, and incident ticketing in one place.</p>
          <div className="udash-meta-row">
            <span className="udash-pill">{today}</span>
            <span className="udash-pill">Role: USER</span>
          </div>
        </header>

        {/* ── STATS ── */}
        <section className="udash-summary">
          {summaryCards.map(card => (
            <div className="udash-stat" key={card.label}>
              <h3>{card.label}</h3>
              <strong>{card.value}</strong>
              <span className="udash-small">{card.hint}</span>
            </div>
          ))}
        </section>

        {/* ── TABS ── */}
        <nav className="udash-tabs">
          {[
            { id: 'catalogue', label: 'Facilities & Assets' },
            { id: 'bookings',  label: 'Booking Management' },
            { id: 'tickets',   label: 'Maintenance & Ticketing' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={activeModule === tab.id ? 'udash-tab udash-tab-active' : 'udash-tab'}
              onClick={() => setActiveModule(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ══ CATALOGUE ══ */}
        {activeModule === 'catalogue' && (
          <section className="udash-grid">
            <article className="udash-card udash-grid-wide">
              <h2>Facilities &amp; Assets Catalogue</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Search
                  <input className="udash-input" type="text" placeholder="Search by name or ID"
                    value={catalogueFilters.query}
                    onChange={e => setCatalogueFilters(p => ({ ...p, query: e.target.value }))} />
                </label>
                <label className="udash-field">
                  Type
                  <select className="udash-select" value={catalogueFilters.type}
                    onChange={e => setCatalogueFilters(p => ({ ...p, type: e.target.value }))}>
                    <option value="ALL">All Types</option>
                    {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="udash-field">
                  Min Capacity
                  <input className="udash-input" type="number" min="0" placeholder="e.g. 50"
                    value={catalogueFilters.minCapacity}
                    onChange={e => setCatalogueFilters(p => ({ ...p, minCapacity: e.target.value }))} />
                </label>
                <label className="udash-field">
                  Location
                  <input className="udash-input" type="text" placeholder="Filter by location"
                    value={catalogueFilters.location}
                    onChange={e => setCatalogueFilters(p => ({ ...p, location: e.target.value }))} />
                </label>
                <label className="udash-field">
                  Status
                  <select className="udash-select" value={catalogueFilters.status}
                    onChange={e => setCatalogueFilters(p => ({ ...p, status: e.target.value }))}>
                    <option value="ALL">All Statuses</option>
                    {resourceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>Available Resources ({filteredResources.length})</h2>
              {resourcesLoading ? (
                <div className="udash-small">Loading resources…</div>
              ) : (
                <ul className="udash-list">
                  {filteredResources.map(item => (
                    <li className="udash-item" key={item.id}>
                      <div className="udash-item-head">
                        <h3>{item.name}</h3>
                        <span className={`udash-badge ${badgeClass(item.status)}`}>{item.status}</span>
                      </div>
                      <div className="udash-item-meta">
                        <strong>{item.type}</strong> | Capacity: {item.capacity > 0 ? item.capacity : 'N/A'} | {formatLocation(item.location)}
                      </div>
                      {item.description && <div className="udash-item-meta">Info: {item.description}</div>}
                      <div className="udash-small">ID: {item.id}</div>
                    </li>
                  ))}
                  {filteredResources.length === 0 && (
                    <li className="udash-item">No resources match current filters.</li>
                  )}
                </ul>
              )}
            </article>
          </section>
        )}

        {/* ══ BOOKINGS ══ */}
        {activeModule === 'bookings' && (
          <section className="udash-grid">
            <article className="udash-card">
              <h2>Booking Filters</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Status
                  <select className="udash-select" value={bookingFilters.status}
                    onChange={e => setBookingFilters(p => ({ ...p, status: e.target.value }))}>
                    <option value="ALL">All</option>
                    {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="udash-field">
                  Resource Type
                  <select className="udash-select" value={bookingFilters.type}
                    onChange={e => setBookingFilters(p => ({ ...p, type: e.target.value }))}>
                    <option value="ALL">All Types</option>
                    {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="udash-field">
                  Location
                  <input className="udash-input" type="text" placeholder="Search location"
                    value={bookingFilters.location}
                    onChange={e => setBookingFilters(p => ({ ...p, location: e.target.value }))} />
                </label>
              </div>
              <div className="udash-actions" style={{ marginTop: '14px' }}>
                <button type="button" className="udash-btn"
                  onClick={() => navigate('/user/bookings/new')}>
                  + New Booking
                </button>
              </div>
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>My Bookings ({visibleBookings.length})</h2>
              {bookingsLoading ? (
                <div className="udash-small">Loading bookings…</div>
              ) : (
                <ul className="udash-list">
                  {visibleBookings.map(booking => (
                    <li className="udash-item" key={booking.id}>
                      <div className="udash-item-head">
                        <h3>{booking.resourceName} ({booking.resourceType})</h3>
                        <span className={`udash-badge ${badgeClass(booking.status)}`}>{booking.status}</span>
                      </div>
                      <div className="udash-item-meta">
                        {booking.date} | {booking.startTime} – {booking.endTime} | {booking.resourceLocation}
                      </div>
                      <div className="udash-item-meta">
                        Purpose: {booking.purpose} | Attendees: {booking.attendees > 0 ? booking.attendees : 'N/A'}
                      </div>
                      <div className="udash-small">Booking ID: {booking.id}</div>
                      {booking.decisionReason && (
                        <div className="udash-small">Note: {booking.decisionReason}</div>
                      )}
                      {booking.status === 'APPROVED' && (
                        <div className="udash-actions">
                          <button type="button" className="udash-btn udash-btn-outline"
                            onClick={() => cancelBooking(booking.id)}>
                            Cancel Booking
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                  {visibleBookings.length === 0 && (
                    <li className="udash-item">No bookings found.</li>
                  )}
                </ul>
              )}
              {bookingMessage && <div className="udash-message">{bookingMessage}</div>}
              {bookingError   && <div className="udash-error">{bookingError}</div>}
            </article>
          </section>
        )}

        {/* ══ TICKETS ══ */}
        {activeModule === 'tickets' && (
          <section className="udash-grid">
            <article className="udash-card">
              <h2>Ticket Filters</h2>
              <div className="udash-form-grid">
                <label className="udash-field">
                  Status
                  <select className="udash-select" value={ticketFilters.status}
                    onChange={e => setTicketFilters(p => ({ ...p, status: e.target.value }))}>
                    <option value="ALL">All</option>
                    {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </label>
                <label className="udash-field">
                  Priority
                  <select className="udash-select" value={ticketFilters.priority}
                    onChange={e => setTicketFilters(p => ({ ...p, priority: e.target.value }))}>
                    <option value="ALL">All</option>
                    {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <div className="udash-actions" style={{ marginTop: '14px' }}>
                <button type="button" className="udash-btn"
                  onClick={() => navigate('/user/tickets')}>
                  + New Ticket
                </button>
              </div>
            </article>

            <article className="udash-card udash-grid-wide">
              <h2>My Tickets ({visibleTickets.length})</h2>
              {ticketsLoading ? (
                <div className="udash-small">Loading tickets…</div>
              ) : (
                <ul className="udash-list">
                  {visibleTickets.map(ticket => (
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
                        &nbsp;| Assigned to: <strong>{ticket.assignedToName || 'Unassigned'}</strong>
                      </div>
                      <div className="udash-small">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </div>
                      {ticket.resolutionNotes && (
                        <div className="udash-small">Resolution: {ticket.resolutionNotes}</div>
                      )}
                    </li>
                  ))}
                  {visibleTickets.length === 0 && (
                    <li className="udash-item">No tickets found.</li>
                  )}
                </ul>
              )}
            </article>
          </section>
        )}

      </div>
    </section>
  );
};

export default UserDashboard;
