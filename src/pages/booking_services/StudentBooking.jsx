import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import bookingService from '../../services/bookingService';
import './booking.css';

const StudentBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((booking) => String(booking.status).toUpperCase() === 'PENDING').length,
    approved: bookings.filter((booking) => String(booking.status).toUpperCase() === 'APPROVED').length,
  };

  useEffect(() => {
    const createdBooking = location.state?.createdBooking;

    const loadBookings = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await bookingService.getUserBookings(user?.id);
        const list = Array.isArray(data) ? data : [];

        if (createdBooking && !list.some((item) => String(item.bookingId) === String(createdBooking.bookingId))) {
          setBookings([createdBooking, ...list]);
        } else {
          setBookings(list);
        }
      } catch (loadError) {
        if (createdBooking) {
          setBookings([createdBooking]);
        } else {
          setError(loadError?.response?.data?.message || 'Unable to load your bookings right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadBookings();

    if (createdBooking) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [user?.id, location.pathname, location.state, navigate]);

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-card booking-hero booking-hero-row">
          <div>
            <div className="booking-hero-kicker">Booking History</div>
            <h1 className="booking-title">My Bookings</h1>
            <p className="booking-sub">Track your resource bookings and view current status updates.</p>
          </div>
          <div className="booking-pill booking-hero-badge">
            {bookingStats.total} {bookingStats.total === 1 ? 'booking' : 'bookings'}
          </div>
        </div>

        <div className="booking-card booking-metrics">
          <div className="booking-metric">
            <span className="booking-metric-value">{bookingStats.total}</span>
            <span className="booking-metric-label">Total bookings</span>
          </div>
          <div className="booking-metric">
            <span className="booking-metric-value">{bookingStats.pending}</span>
            <span className="booking-metric-label">Pending requests</span>
          </div>
          <div className="booking-metric">
            <span className="booking-metric-value">{bookingStats.approved}</span>
            <span className="booking-metric-label">Approved bookings</span>
          </div>
        </div>

        {loading ? <div className="booking-alert booking-alert-info">Loading your bookings...</div> : null}
        {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}

        {!loading && !error ? (
          <div className="booking-card booking-table-shell">
            {bookings.length === 0 ? (
              <div className="booking-empty">
                <p>No bookings found yet.</p>
                <Link className="booking-btn" to="/user/bookings/new">Create your first booking</Link>
              </div>
            ) : (
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Resource</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td>#{booking.bookingId}</td>
                      <td>{booking.resourceName || 'N/A'}</td>
                      <td>{booking.date || 'N/A'}</td>
                      <td>
                        {booking.startTime || '--:--'} - {booking.endTime || '--:--'}
                      </td>
                      <td>
                        <span className={`booking-badge booking-badge-${String(booking.status || 'UNKNOWN').toLowerCase()}`}>
                          {booking.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="booking-btn"
                          onClick={() => navigate(`/booking/${booking.bookingId}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default StudentBooking;
