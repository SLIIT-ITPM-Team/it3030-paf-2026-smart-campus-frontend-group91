import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import resourceService from '../../services/resourceService';
import {
  bookingBadgeClass,
  buildMonthGrid,
  endOfWeek,
  normalizeTime,
  startOfWeek,
  toDateKey,
  toMonthLabel,
} from './bookingUiUtils';
import './booking.css';

const AdminBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [filter, setFilter] = useState({
    status: 'ALL',
    resourceId: 'ALL',
    userQuery: '',
    fromDate: '',
    toDate: '',
  });

  const [adminCalendarMode, setAdminCalendarMode] = useState('month');
  const [adminCalendarDate, setAdminCalendarDate] = useState(new Date());
  const [rejectReasons, setRejectReasons] = useState({});
  const [cancelReasons, setCancelReasons] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingResult, resourceResult] = await Promise.all([
        bookingService.getAllBookings(),
        resourceService.getResources(),
      ]);
      setBookings(bookingResult);
      setResources(resourceResult);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load admin booking records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filter.status !== 'ALL' && booking.status !== filter.status) return false;
      if (filter.resourceId !== 'ALL' && String(booking.resourceId) !== String(filter.resourceId)) return false;

      if (filter.userQuery) {
        const keyword = filter.userQuery.toLowerCase();
        const source = `${booking.userName || ''} ${booking.userEmail || ''}`.toLowerCase();
        if (!source.includes(keyword)) return false;
      }

      if (filter.fromDate && booking.date < filter.fromDate) return false;
      if (filter.toDate && booking.date > filter.toDate) return false;

      return true;
    });
  }, [bookings, filter]);

  const bookingMap = useMemo(() => {
    return filteredBookings.reduce((acc, booking) => {
      const key = booking.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(booking);
      return acc;
    }, {});
  }, [filteredBookings]);

  const runAction = async (bookingId, status) => {
    try {
      const booking = bookings.find((item) => item.bookingId === bookingId);
      if (!booking) return;

      if (status === 'APPROVED' && booking.status !== 'PENDING') {
        setError('Only PENDING bookings can be approved.');
        return;
      }

      if (status === 'REJECTED') {
        if (booking.status !== 'PENDING') {
          setError('Only PENDING bookings can be rejected.');
          return;
        }
        const reason = String(rejectReasons[bookingId] || '').trim();
        if (!reason) {
          setError('Rejection reason is required.');
          return;
        }
      }

      if (status === 'CANCELLED' && booking.status !== 'APPROVED') {
        setError('Only APPROVED bookings can be cancelled by admin.');
        return;
      }

      const updated = await bookingService.updateBookingStatus(bookingId, status, {
        reason:
          status === 'REJECTED'
            ? rejectReasons[bookingId]
            : status === 'CANCELLED'
              ? cancelReasons[bookingId] || 'Cancelled by admin.'
              : undefined,
        userRole: 'ADMIN',
      });

      setBookings((prev) => prev.map((item) => (item.bookingId === bookingId ? { ...item, ...updated } : item)));
      setMessage(`Booking #${bookingId} updated to ${status}. Notification email has been triggered.`);
      setError('');
    } catch (actionError) {
      setError(actionError?.response?.data?.message || `Failed to ${status.toLowerCase()} booking.`);
    }
  };

  const monthCells = buildMonthGrid(adminCalendarDate);
  const weekStart = startOfWeek(adminCalendarDate);
  const weekEnd = endOfWeek(adminCalendarDate);

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-hero">
          <div className="booking-hero-kicker">Admin Dashboard</div>
          <div className="booking-hero-row">
            <div>
              <h1 className="booking-title">Booking Management</h1>
              <p className="booking-sub">
                View all bookings across users, process requests quickly, and monitor schedules through comprehensive calendar views.
              </p>
            </div>
            <div className="booking-hero-badge">
              <span className="booking-pill" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '6px 14px',
                fontWeight: '600',
                letterSpacing: '0.02em'
              }}>
                <span className="booking-status-dot" style={{ background: '#4ade80', margin: 0, boxShadow: '0 0 8px #4ade80' }}></span>
                System Online
              </span>
            </div>
          </div>
        </div>

        {!loading && !error && (
          <div className="booking-metrics">
            <div className="booking-metric">
              <span className="booking-metric-value">{bookings.length}</span>
              <span className="booking-metric-label">Total Bookings</span>
            </div>
            <div className="booking-metric">
              <span className="booking-metric-value">{bookings.filter(b => b.status === 'PENDING').length}</span>
              <span className="booking-metric-label">Pending Requests</span>
            </div>
            <div className="booking-metric">
              <span className="booking-metric-value">{bookings.filter(b => b.status === 'APPROVED').length}</span>
              <span className="booking-metric-label">Approved</span>
            </div>
            <div className="booking-metric">
              <span className="booking-metric-value">{bookings.filter(b => {
                const today = new Date().toISOString().split('T')[0];
                return b.date === today;
              }).length}</span>
              <span className="booking-metric-label">Today's Bookings</span>
            </div>
          </div>
        )}

        {loading ? <div className="booking-alert booking-alert-info">Loading all bookings...</div> : null}
        {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}
        {message ? <div className="booking-alert booking-alert-success">{message}</div> : null}

        <div className="booking-card booking-grid">
          <div className="booking-col-2">
            <label className="booking-label">Status</label>
            <select
              className="booking-select"
              value={filter.status}
              onChange={(event) => setFilter((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="ALL">ALL</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="booking-col-3">
            <label className="booking-label">Resource</label>
            <select
              className="booking-select"
              value={filter.resourceId}
              onChange={(event) => setFilter((prev) => ({ ...prev, resourceId: event.target.value }))}
            >
              <option value="ALL">ALL</option>
              {resources.map((resource) => (
                <option key={resource.resourceId} value={resource.resourceId}>{resource.resourceName}</option>
              ))}
            </select>
          </div>

          <div className="booking-col-3">
            <label className="booking-label">User</label>
            <input
              className="booking-input"
              value={filter.userQuery}
              onChange={(event) => setFilter((prev) => ({ ...prev, userQuery: event.target.value }))}
              placeholder="Search by user name/email"
            />
          </div>

          <div className="booking-col-2">
            <label className="booking-label">From Date</label>
            <input
              className="booking-input"
              type="date"
              value={filter.fromDate}
              onChange={(event) => setFilter((prev) => ({ ...prev, fromDate: event.target.value }))}
            />
          </div>

          <div className="booking-col-2">
            <label className="booking-label">To Date</label>
            <input
              className="booking-input"
              type="date"
              value={filter.toDate}
              onChange={(event) => setFilter((prev) => ({ ...prev, toDate: event.target.value }))}
            />
          </div>
        </div>

        <div className="booking-card" style={{ overflowX: 'auto' }}>
          <table className="booking-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>User</th>
                <th>Resource</th>
                <th>Date/Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.bookingId}>
                  <td>#{booking.bookingId}</td>
                  <td>
                    {booking.userName || 'N/A'}
                    <br />
                    <small>{booking.userEmail || '-'}</small>
                  </td>
                  <td>{booking.resourceName}</td>
                  <td>
                    {booking.date}
                    <br />
                    {normalizeTime(booking.startTime)} - {normalizeTime(booking.endTime)}
                  </td>
                  <td>{booking.purpose}</td>
                  <td><span className={bookingBadgeClass(booking.status)}>{booking.status}</span></td>
                  <td>
                    <div className="booking-actions">
                      <button
                        type="button"
                        className="booking-btn"
                        disabled={booking.status !== 'PENDING'}
                        onClick={() => runAction(booking.bookingId, 'APPROVED')}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        className="booking-btn booking-btn-danger"
                        disabled={booking.status !== 'PENDING'}
                        onClick={() => runAction(booking.bookingId, 'REJECTED')}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        className="booking-btn booking-btn-muted"
                        disabled={booking.status !== 'APPROVED'}
                        onClick={() => runAction(booking.bookingId, 'CANCELLED')}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="booking-btn"
                        onClick={() => navigate(`/admin/booking/${booking.bookingId}`)}
                      >
                        Details
                      </button>
                    </div>

                    {booking.status === 'PENDING' ? (
                      <input
                        className="booking-input"
                        style={{ marginTop: 6 }}
                        placeholder="Rejection reason"
                        value={rejectReasons[booking.bookingId] || ''}
                        onChange={(event) =>
                          setRejectReasons((prev) => ({
                            ...prev,
                            [booking.bookingId]: event.target.value,
                          }))
                        }
                      />
                    ) : null}

                    {booking.status === 'APPROVED' ? (
                      <input
                        className="booking-input"
                        style={{ marginTop: 6 }}
                        placeholder="Optional cancellation reason"
                        value={cancelReasons[booking.bookingId] || ''}
                        onChange={(event) =>
                          setCancelReasons((prev) => ({
                            ...prev,
                            [booking.bookingId]: event.target.value,
                          }))
                        }
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="booking-card">
          <h3 style={{ marginTop: 0 }}>Admin Calendar</h3>
          <div className="booking-calendar-toolbar">
            <div className="booking-actions">
              <button
                type="button"
                className="booking-btn"
                onClick={() => {
                  const d = new Date(adminCalendarDate);
                  if (adminCalendarMode === 'month') d.setMonth(d.getMonth() - 1);
                  else d.setDate(d.getDate() - 7);
                  setAdminCalendarDate(d);
                }}
              >
                Previous
              </button>
              <button
                type="button"
                className="booking-btn"
                onClick={() => {
                  const d = new Date(adminCalendarDate);
                  if (adminCalendarMode === 'month') d.setMonth(d.getMonth() + 1);
                  else d.setDate(d.getDate() + 7);
                  setAdminCalendarDate(d);
                }}
              >
                Next
              </button>
            </div>
            <strong>
              {adminCalendarMode === 'month'
                ? toMonthLabel(adminCalendarDate)
                : `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`}
            </strong>
            <div className="booking-actions">
              <button
                type="button"
                className={`booking-btn ${adminCalendarMode === 'month' ? 'booking-btn-primary' : 'booking-btn-muted'}`}
                onClick={() => setAdminCalendarMode('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`booking-btn ${adminCalendarMode === 'week' ? 'booking-btn-primary' : 'booking-btn-muted'}`}
                onClick={() => setAdminCalendarMode('week')}
              >
                Week
              </button>
            </div>
          </div>

          <div className="booking-calendar-grid">
            {(adminCalendarMode === 'month' ? monthCells : Array.from({ length: 7 }, (_, idx) => {
              const day = new Date(weekStart);
              day.setDate(weekStart.getDate() + idx);
              return day;
            })).map((day) => {
              const key = toDateKey(day);
              const dayBookings = bookingMap[key] || [];
              const todayKey = toDateKey(new Date());
              const isToday = key === todayKey;
              const isOtherMonth = adminCalendarMode === 'month' && day.getMonth() !== adminCalendarDate.getMonth();

              return (
                <div
                  key={key}
                  className={`booking-calendar-day ${isToday ? 'booking-calendar-day-today' : ''} ${isOtherMonth ? 'booking-calendar-day-other' : ''}`}
                >
                  <div className="booking-calendar-date">{day.toLocaleDateString()}</div>
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.bookingId}
                      className={`booking-event booking-event-${booking.status}`}
                      onClick={() => navigate(`/admin/booking/${booking.bookingId}`)}
                    >
                      {normalizeTime(booking.startTime)} {booking.userName || 'User'}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminBookings;
