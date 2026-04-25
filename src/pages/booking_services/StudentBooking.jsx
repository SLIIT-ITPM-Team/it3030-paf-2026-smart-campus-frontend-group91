import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../auth/AuthContext';
import bookingService from '../../services/bookingService';
import { normalizeTime } from './bookingUiUtils';
import './booking.css';

const parseTimeToMinutes = (value) => {
  const normalized = normalizeTime(value);
  if (!normalized) return null;

  const [hoursText, minutesText] = normalized.split(':');
  const hours = Number(hoursText);
  const mins = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;
  return hours * 60 + mins;
};

const formatDuration = (start, end) => {
  const startMins = parseTimeToMinutes(start);
  const endMins = parseTimeToMinutes(end);

  if (startMins === null || endMins === null) return '-';

  let diffMins = endMins - startMins;
  if (diffMins < 0) diffMins += 24 * 60;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const BookingCard = ({ booking, onNavigate }) => {
  const qrRef = useRef(null);
  const isApproved = booking.status === 'APPROVED';
  const isCancelled = booking.status === 'CANCELLED';
  const isPending = booking.status === 'PENDING';
  const isRejected = booking.status === 'REJECTED';

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `booking-${booking.bookingId}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const getMessage = () => {
    if (isApproved) return 'Ready to use. Your QR pass is available below.';
    if (isCancelled) return 'You cancelled this request.';
    if (isRejected) return `Request rejected: ${booking.rejectionReason || 'No reason provided.'}`;
    if (isPending) return 'Your request is pending administrator approval.';
    return 'Status unknown.';
  };

  const getBadgeClass = () => {
    if (isApproved) return 'booking-badge-approved';
    if (isCancelled) return 'booking-badge-cancelled';
    if (isRejected) return 'booking-badge-rejected';
    if (isPending) return 'booking-badge-pending';
    return 'booking-badge-unknown';
  };

  const statusClassMap = {
    APPROVED: 'booking-pass-approved',
    CANCELLED: 'booking-pass-cancelled',
    PENDING: 'booking-pass-pending',
    REJECTED: 'booking-pass-rejected',
  };
  const cardClass = `booking-pass-card ${statusClassMap[booking.status] || ''}`;

  return (
    <div className={cardClass}>
      <div className="booking-pass-indicator"></div>
      <div className="booking-pass-layout">
        <div className="booking-pass-left">
          <div className="booking-pass-header">
            <h3 className="booking-pass-title">{booking.resourceName || 'Unknown Resource'}</h3>
            <span className={`booking-badge ${getBadgeClass()}`}>{booking.status}</span>
          </div>
          <p className="booking-pass-purpose">{booking.purpose || 'No purpose provided'}</p>

          <div className="booking-pass-info-grid">
            <div className="booking-pass-info-box">
              <span className="booking-pass-info-label">Start</span>
              <span className="booking-pass-info-value">{formatDateShort(booking.date)}, {normalizeTime(booking.startTime)}</span>
            </div>
            <div className="booking-pass-info-box">
              <span className="booking-pass-info-label">End</span>
              <span className="booking-pass-info-value">{formatDateShort(booking.date)}, {normalizeTime(booking.endTime)}</span>
            </div>
            <div className="booking-pass-info-box">
              <span className="booking-pass-info-label">Duration</span>
              <span className="booking-pass-info-value">{formatDuration(booking.startTime, booking.endTime)}</span>
            </div>
          </div>

          <div className="booking-pass-message">
            {getMessage()}
          </div>

          <div className="booking-actions">
            <button type="button" className="booking-btn booking-btn-primary" onClick={() => onNavigate(`/booking/${booking.bookingId}`)}>
              View Details
            </button>
          </div>
        </div>

        <div className="booking-pass-right">
          {isApproved && booking.qrCodeValue ? (
            <>
              <div className="booking-pass-qr-label">Booking Pass</div>
              <h4 className="booking-pass-qr-title">Approved QR</h4>
              <div className="booking-pass-qr-container" ref={qrRef}>
                <QRCodeCanvas 
                  value={`Booking ID: #${booking.bookingId}\nUser: ${booking.userName || 'N/A'}\nHall: ${booking.resourceName || 'N/A'}\nTime: ${booking.date} from ${normalizeTime(booking.startTime)} to ${normalizeTime(booking.endTime)}`}
                  size={160} 
                  level="H" 
                  includeMargin={true}
                  style={{ display: 'block' }}
                />
              </div>
              <p className="booking-pass-qr-desc">
                Download and keep this QR ready when using the reserved facility.
              </p>
              <button type="button" className="booking-btn booking-btn-primary" style={{ width: '100%' }} onClick={downloadQR}>
                Download QR
              </button>
            </>
          ) : (
            <div className="booking-pass-unavailable">
              <h4>QR Pass Unavailable</h4>
              <p>A downloadable QR code will appear here once this booking is approved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
          <div className="booking-pill booking-hero-badge" style={{ 
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
          <div className="booking-list">
            {bookings.length === 0 ? (
              <div className="booking-empty">
                <p>No bookings found yet.</p>
                <Link className="booking-btn" to="/user/bookings/new">Create your first booking</Link>
              </div>
            ) : (
              bookings.map((booking) => (
                <BookingCard key={booking.bookingId} booking={booking} onNavigate={navigate} />
              ))
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default StudentBooking;
