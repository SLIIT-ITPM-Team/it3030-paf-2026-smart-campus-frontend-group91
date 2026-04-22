import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import bookingService from '../../services/bookingService';
import './booking.css';

const StudentBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await bookingService.getUserBookings(user?.id);
        setBookings(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load your bookings right now.');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user?.id]);

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-card">
          <h1 className="booking-title">My Bookings</h1>
          <p className="booking-sub">Track your resource bookings and view current status updates.</p>
        </div>

        {loading ? <div className="booking-alert booking-alert-info">Loading your bookings...</div> : null}
        {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}

        {!loading && !error ? (
          <div className="booking-card" style={{ overflowX: 'auto' }}>
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
