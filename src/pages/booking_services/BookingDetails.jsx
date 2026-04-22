import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import bookingService from '../../services/bookingService';
import { bookingBadgeClass, normalizeTime } from './bookingUiUtils';
import './booking.css';

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { hasRoles } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = hasRoles(['ADMIN']);

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await bookingService.getBookingById(bookingId);
        setBooking(result);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  const qrUrl = useMemo(() => {
    if (!booking?.qrCodeValue) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(booking.qrCodeValue)}`;
  }, [booking?.qrCodeValue]);

  const canReject = isAdmin && booking?.status === 'PENDING';
  const canCancel = booking
    ? (isAdmin ? booking.status === 'APPROVED' : ['PENDING', 'APPROVED'].includes(booking.status))
    : false;

  const onReject = async () => {
    if (!booking || !canReject) return;

    const reason = window.prompt('Rejection reason:', 'Rejected by admin.');
    if (reason === null) return;

    const trimmedReason = String(reason).trim();
    if (!trimmedReason) {
      setError('Rejection reason is required.');
      setMessage('');
      return;
    }

    try {
      const updated = await bookingService.updateBookingStatus(booking.bookingId, 'REJECTED', {
        reason: trimmedReason,
        userRole: 'ADMIN',
      });
      setBooking(updated);
      setError('');
      setMessage('Booking rejected. Notification email has been triggered.');
    } catch (rejectError) {
      setMessage('');
      setError(rejectError?.response?.data?.message || 'Unable to reject this booking.');
    }
  };

  const onCancel = async () => {
    if (!booking) return;
    if (!canCancel) return;

    const reason = window.prompt(
      'Cancellation reason (optional):',
      isAdmin ? 'Cancelled by admin.' : 'Cancelled by requester.',
    );

    try {
      const updated = await bookingService.cancelBooking(booking.bookingId, reason || undefined);
      setBooking(updated);
      setError('');
      setMessage('Booking cancelled. Confirmation email has been triggered.');
    } catch (cancelError) {
      setMessage('');
      setError(cancelError?.response?.data?.message || 'Unable to cancel this booking.');
    }
  };

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-card">
          <h1 className="booking-title">Booking Details</h1>
          <p className="booking-sub">Review full booking details and QR check-in information.</p>
        </div>

        {loading ? <div className="booking-alert booking-alert-info">Loading booking details...</div> : null}
        {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}
        {message ? <div className="booking-alert booking-alert-success">{message}</div> : null}

        {booking ? (
          <div className="booking-card booking-grid">
            <div className="booking-col-8">
              <p><strong>Booking ID:</strong> #{booking.bookingId}</p>
              <p><strong>Resource:</strong> {booking.resourceName}</p>
              <p><strong>Location:</strong> {booking.resourceLocation || 'N/A'}</p>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Time:</strong> {normalizeTime(booking.startTime)} - {normalizeTime(booking.endTime)}</p>
              <p><strong>Purpose:</strong> {booking.purpose}</p>
              <p><strong>Expected attendees:</strong> {booking.expectedAttendees}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={bookingBadgeClass(booking.status)}>{booking.status}</span>
              </p>
              {booking.rejectionReason ? <p><strong>Rejection Reason:</strong> {booking.rejectionReason}</p> : null}
              {booking.cancellationReason ? <p><strong>Cancellation Reason:</strong> {booking.cancellationReason}</p> : null}
              <p><strong>Created At:</strong> {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}</p>
              <p><strong>Updated At:</strong> {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : 'N/A'}</p>

              <div className="booking-actions" style={{ marginTop: 8 }}>
                {canReject ? (
                  <button
                    type="button"
                    className="booking-btn booking-btn-danger"
                    onClick={onReject}
                  >
                    Reject Booking
                  </button>
                ) : null}
                <button
                  type="button"
                  className="booking-btn booking-btn-danger"
                  disabled={!canCancel}
                  onClick={onCancel}
                >
                  Cancel Booking
                </button>
                <button
                  type="button"
                  className="booking-btn booking-btn-muted"
                  onClick={() => navigate(isAdmin ? '/admin/bookings' : '/user/bookings')}
                >
                  Back
                </button>
              </div>
            </div>

            <div className="booking-col-4">
              <h3 style={{ marginTop: 0 }}>QR Check-In</h3>
              {booking.status === 'APPROVED' && qrUrl ? (
                <>
                  <img className="booking-qr" src={qrUrl} alt="Booking QR code" />
                  <p className="booking-sub" style={{ marginTop: 8 }}>
                    This QR is valid only for the approved date/time slot.
                  </p>
                  <div className="booking-actions">
                    <a className="booking-btn" href={qrUrl} download={`booking-${booking.bookingId}-qr.png`}>
                      Download QR
                    </a>
                  </div>
                </>
              ) : (
                <div className="booking-alert booking-alert-info">
                  QR is available only for approved bookings. Cancelled/rejected QR codes are invalid.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default BookingDetails;
