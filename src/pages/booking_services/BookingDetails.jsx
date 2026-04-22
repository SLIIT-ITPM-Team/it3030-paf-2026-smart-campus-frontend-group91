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

  const onCancel = async () => {
    if (!booking) return;
    if (!['PENDING', 'APPROVED'].includes(booking.status)) return;

    const reason = window.prompt(
      'Cancellation reason (optional):',
      isAdmin ? 'Cancelled by admin.' : 'Cancelled by requester.',
    );

    try {
      const updated = await bookingService.cancelBooking(booking.bookingId, reason || undefined);
      setBooking(updated);
      setMessage('Booking cancelled. Confirmation email has been triggered.');
    } catch (cancelError) {
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
                <button
                  type="button"
                  className="booking-btn booking-btn-danger"
                  disabled={!['PENDING', 'APPROVED'].includes(booking.status)}
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

  const onCancel = async () => {
    if (!booking) return;
    if (!['PENDING', 'APPROVED'].includes(booking.status)) return;

    const reason = window.prompt('Cancellation reason (optional):', isAdmin ? 'Cancelled by admin.' : 'Cancelled by requester.');

    try {
      const updated = await bookingService.cancelBooking(booking.bookingId, reason || undefined);
      setBooking(updated);
      setMessage('Booking cancelled. Confirmation email has been triggered.');
    } catch (cancelError) {
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
                <button
                  type="button"
                  className="booking-btn booking-btn-danger"
                  disabled={!['PENDING', 'APPROVED'].includes(booking.status)}
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
                  <p className="booking-sub" style={{ marginTop: 8 }}>This QR is valid only for the approved date/time slot.</p>
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
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import { AuthContext } from '../../auth/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const formatScheduleDate = (value) =>
    new Date(value).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

const formatScheduleTime = (value) =>
    new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

const BookingDetails= () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approvedBookings, setApprovedBookings] = useState([]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' });
    const [bookingData, setBookingData] = useState({
        purpose: '',
        attendees: '',
        startTime: '',
        endTime: ''
    });
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);

    const currentDateTime = new Date().toISOString().slice(0, 16);

    useEffect(() => {
        const loadFacilityData = async () => {
            try {
                const facilities = await facilityService.getAllFacilities();
                const selected = facilities.find((item) => String(item.id) === String(id));
                setFacility(selected || null);

                if (selected) {
                    const allBookings = await bookingService.getFacilityBookings(selected.id);
                    const now = new Date();

                    const activeSchedule = allBookings.filter((booking) => {
                        const isApproved = booking.status === 'APPROVED';
                        const isFuture = new Date(booking.endTime) > now;
                        return isApproved && isFuture;
                    });

                    activeSchedule.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    setApprovedBookings(activeSchedule);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setFacility(null);
            } finally {
                setLoading(false);
            }
        };

        loadFacilityData();
    }, [id]);

    const handleFormChange = (e) => {
        const updated = { ...bookingData, [e.target.name]: e.target.value };
        setBookingData(updated);
        setHasConflict(false);
        setBookingMessage({ type: '', text: '' });
    };

    const checkBookingConflict = async () => {
        if (!bookingData.startTime || !bookingData.endTime) {
            return;
        }

        setCheckingConflict(true);
        try {
            const conflict = await bookingService.checkConflict(
                facility.id,
                bookingData.startTime,
                bookingData.endTime
            );
            setHasConflict(conflict);
            if (conflict) {
                setBookingMessage({
                    type: 'error',
                    text: '❌ This time slot is unavailable. Please select a different date or time.'
                });
            }
        } catch (error) {
            console.error('Error checking conflict:', error);
        } finally {
            setCheckingConflict(false);
        }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingMessage({ type: '', text: '' });

        // Validation: User must be logged in
        if (!user) {
            setBookingMessage({ type: 'error', text: '❌ You must be logged in to book a facility.' });
            return;
        }

        // Validation: Purpose is required
        if (!bookingData.purpose || bookingData.purpose.trim() === '') {
            setBookingMessage({ type: 'error', text: '❌ Please provide the purpose of your booking.' });
            return;
        }

        // Validation: Expected attendees
        const attendees = parseInt(bookingData.attendees);
        if (!bookingData.attendees || attendees < 1) {
            setBookingMessage({ type: 'error', text: '❌ Please specify a valid number of expected attendees.' });
            return;
        }

        if (facility.capacity && attendees > facility.capacity) {
            setBookingMessage({
                type: 'error',
                text: `❌ Expected attendees (${attendees}) exceeds facility capacity (${facility.capacity}).`
            });
            return;
        }

        // Validation: Start and end times are required
        if (!bookingData.startTime || !bookingData.endTime) {
            setBookingMessage({ type: 'error', text: '❌ Please specify both start and end times.' });
            return;
        }

        const startTime = new Date(bookingData.startTime);
        const endTime = new Date(bookingData.endTime);
        const now = new Date();

        // Validation: Cannot book past date or time
        if (startTime < now) {
            setBookingMessage({ type: 'error', text: '❌ Cannot book a resource for a past date or time.' });
            return;
        }

        // Validation: End time must be after start time
        if (startTime >= endTime) {
            setBookingMessage({ type: 'error', text: '❌ End time must be after start time.' });
            return;
        }

        // Validation: Check for conflicts
        if (hasConflict) {
            setBookingMessage({
                type: 'error',
                text: '❌ This time slot is unavailable. Please select a different date or time.'
            });
            return;
        }

        // Validation: Resource must not be OUT_OF_SERVICE
        if (facility.status === 'OUT_OF_SERVICE') {
            setBookingMessage({ type: 'error', text: '❌ Cannot book a resource marked as OUT_OF_SERVICE.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                facilityId: facility.id,
                facilityName: facility.name,
                userId: user.id,
                userName: user.name,
                purpose: bookingData.purpose,
                attendees: attendees,
                startTime: bookingData.startTime,
                endTime: bookingData.endTime
            };

            await bookingService.createBooking(payload);

            setBookingMessage({
                type: 'success',
                text: '✅ Booking request submitted successfully! A confirmation email has been sent to your inbox. An admin will review your request shortly and you\'ll receive another email once approved.'
            });
            setShowBookingForm(false);
            setBookingData({ purpose: '', attendees: '', startTime: '', endTime: '' });
            setHasConflict(false);
            // Reload bookings to show the new PENDING booking
            setTimeout(() => loadFacilityData(), 1500);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to submit booking.';
            setBookingMessage({
                type: 'error',
                text: `❌ ${errorMsg}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadFacilityData = async () => {
        try {
            const facilities = await facilityService.getAllFacilities();
            const selected = facilities.find((item) => String(item.id) === String(id));
            
            if (selected) {
                const allBookings = await bookingService.getFacilityBookings(selected.id);
                const now = new Date();

                const activeSchedule = allBookings.filter((booking) => {
                    const isApproved = booking.status === 'APPROVED';
                    const isFuture = new Date(booking.endTime) > now;
                    return isApproved && isFuture;
                });

                activeSchedule.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setApprovedBookings(activeSchedule);
            }
        } catch (error) {
            console.error('Error reloading facility data:', error);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: '#0d6efd' }}>Loading facility details...</div>;
    }

    if (!facility) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
                <button onClick={() => navigate('/facilities')} style={{ marginBottom: '16px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer' }}>
                    Back to Facilities
                </button>
                <div>Facility not found.</div>
            </div>
        );
    }

    const inputStyle = {
        width: '100%',
        padding: '12px 14px',
        marginBottom: '16px',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        backgroundColor: '#ffffff',
        color: '#0f172a'
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #eef6ff 0%, #ffffff 42%, #f8fbff 100%)',
                padding: '22px 18px 48px',
                fontFamily: 'sans-serif'
            }}
        >
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/facilities')}
                    style={{ marginBottom: '16px', backgroundColor: '#ffffff', border: '1px solid #dbeafe', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#1e3a8a', boxShadow: '0 12px 28px rgba(8, 66, 152, 0.08)' }}
                >
                    &larr; Back to Facilities
                </button>

                <div style={{ border: '1px solid #dbeafe', borderRadius: '28px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.09)' }}>
                    {facility.imageUrl ? (
                        <img src={facility.imageUrl} alt={facility.name} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1e3a8a', fontSize: '24px', fontWeight: 'bold' }}>
                            {facility.type}
                        </div>
                    )}

                    <div style={{ padding: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(220px, 0.7fr)', gap: '18px', marginBottom: '26px', alignItems: 'start' }}>
                            <div>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: '10px' }}>
                                    Facility Booking Hub
                                </div>
                                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '34px', lineHeight: 1.15 }}>{facility.name}</h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '999px', backgroundColor: facility.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2', color: facility.status === 'ACTIVE' ? '#065f46' : '#991b1b', fontWeight: 'bold', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        {facility.status}
                                    </span>
                                    <span style={{ color: '#475569', fontSize: '15px' }}>Location: {facility.location}</span>
                                </div>
                                <p style={{ margin: '16px 0 0', color: '#475569', lineHeight: 1.7, maxWidth: '640px' }}>
                                    Review availability, check the upcoming schedule, and send a booking request from one clear workspace.
                                </p>
                            </div>

                            <div style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)', border: '1px solid #bfdbfe', borderRadius: '22px', padding: '18px', textAlign: 'center' }}>
                                <QRCodeSVG
                                    value={`${window.location.origin}/incidents/new?resourceId=${facility.id}`}
                                    size={92}
                                />
                                <p style={{ fontSize: '12px', color: '#475569', margin: '10px 0 0', lineHeight: 1.6 }}>
                                    Scan to report an incident for this facility.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '28px' }}>
                            <div style={{ backgroundColor: '#f8fbff', borderRadius: '18px', padding: '18px', border: '1px solid #dbeafe' }}>
                                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.06em' }}>Type</div>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginTop: '8px' }}>{facility.type || 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: '#f8fbff', borderRadius: '18px', padding: '18px', border: '1px solid #dbeafe' }}>
                                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.06em' }}>Capacity</div>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginTop: '8px' }}>{facility.capacity > 0 ? facility.capacity : 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: '#f8fbff', borderRadius: '18px', padding: '18px', border: '1px solid #dbeafe' }}>
                                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.06em' }}>Open Time</div>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginTop: '8px' }}>{facility.openTime || 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: '#f8fbff', borderRadius: '18px', padding: '18px', border: '1px solid #dbeafe' }}>
                                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.06em' }}>Close Time</div>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginTop: '8px' }}>{facility.closeTime || 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: '20px' }}>
                            <section style={{ backgroundColor: '#f8fbff', padding: '22px', borderRadius: '24px', border: '1px solid #dbeafe' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>Upcoming Schedule</h3>
                                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                                            Approved reservations that are still upcoming.
                                        </p>
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #dbeafe', borderRadius: '999px', padding: '8px 14px', color: '#1e3a8a', fontWeight: 'bold', fontSize: '13px' }}>
                                        {approvedBookings.length} reserved slots
                                    </div>
                                </div>

                                {approvedBookings.length === 0 ? (
                                    <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '18px', padding: '24px', textAlign: 'center', color: '#64748b', lineHeight: 1.7 }}>
                                        No upcoming bookings. This space is currently open for new requests.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {approvedBookings.map((booking) => (
                                            <div key={booking.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px', borderRadius: '16px', border: '1px solid #dbeafe' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>
                                                    {new Date(booking.startTime).getDate()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatScheduleDate(booking.startTime)}</div>
                                                    <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                                                        {formatScheduleTime(booking.startTime)} - {formatScheduleTime(booking.endTime)}
                                                    </div>
                                                </div>
                                                <div style={{ backgroundColor: '#e0f2fe', color: '#075985', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                                                    Reserved
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)', borderRadius: '24px', border: '1px solid #dbeafe', padding: '22px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '8px' }}>
                                        Booking Request
                                    </div>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>Reserve This Space</h3>
                                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
                                        Fill in your purpose, attendees, and preferred times to send a request for admin approval.
                                    </p>
                                </div>

                                {bookingMessage.text && (
                                    <div style={{ padding: '14px 16px', borderRadius: '14px', marginBottom: '18px', backgroundColor: bookingMessage.type === 'success' ? '#d1fae5' : '#fee2e2', color: bookingMessage.type === 'success' ? '#065f46' : '#991b1b', border: `1px solid ${bookingMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`, lineHeight: 1.6 }}>
                                        {bookingMessage.text}
                                    </div>
                                )}

                                {facility.status === 'OUT_OF_SERVICE' ? (
                                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '18px', borderRadius: '16px', textAlign: 'center', fontWeight: 'bold', lineHeight: 1.7 }}>
                                        This facility is currently down for maintenance and cannot be booked.
                                    </div>
                                ) : !user ? (
                                    <div style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '18px', borderRadius: '16px', textAlign: 'center', lineHeight: 1.7 }}>
                                        Please <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>log in</strong> to request a booking for this facility.
                                    </div>
                                ) : !showBookingForm ? (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div style={{ backgroundColor: '#f8fbff', border: '1px solid #dbeafe', borderRadius: '18px', padding: '18px', color: '#475569', lineHeight: 1.7 }}>
                                            Booking requests are reviewed by admins before confirmation. Once approved, the reservation will show up in your bookings with a downloadable QR pass.
                                        </div>
                                        <button
                                            onClick={() => setShowBookingForm(true)}
                                            style={{ width: '100%', background: 'linear-gradient(135deg, #0b4aa6 0%, #0d6efd 100%)', color: '#ffffff', border: 'none', padding: '15px', borderRadius: '14px', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 14px 26px rgba(13, 110, 253, 0.22)' }}
                                        >
                                            Request to Book Space
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#f8fbff', padding: '22px', borderRadius: '20px', border: '1px solid #dbeafe' }}>
                                        <h4 style={{ marginTop: 0, color: '#0f172a', marginBottom: '18px', fontSize: '18px' }}>Booking Request Form</h4>
                                        <form onSubmit={handleBookingSubmit}>
                                            <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Purpose of Booking <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input type="text" name="purpose" required value={bookingData.purpose} onChange={handleFormChange} placeholder="e.g. Group Study, Club Meeting, Seminar" style={inputStyle} />
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px' }}>Please describe what you will use the facility for.</p>

                                            <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Expected Attendees <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input type="number" name="attendees" required min="1" max={facility.capacity || 999} value={bookingData.attendees} onChange={handleFormChange} placeholder={`Max capacity: ${facility.capacity || 'Not specified'}`} style={inputStyle} />
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px' }}>The number of people who will attend.</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Start Date & Time <span style={{ color: '#ef4444' }}>*</span></label>
                                                    <input
                                                        type="datetime-local"
                                                        name="startTime"
                                                        required
                                                        min={currentDateTime}
                                                        value={bookingData.startTime}
                                                        onChange={handleFormChange}
                                                        style={inputStyle}
                                                    />
                                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Cannot be in the past.</p>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>End Date & Time <span style={{ color: '#ef4444' }}>*</span></label>
                                                    <input
                                                        type="datetime-local"
                                                        name="endTime"
                                                        required
                                                        min={bookingData.startTime || currentDateTime}
                                                        value={bookingData.endTime}
                                                        onChange={handleFormChange}
                                                        style={inputStyle}
                                                    />
                                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Must be after start time.</p>
                                                </div>
                                            </div>

                                            {bookingData.startTime && bookingData.endTime && (
                                                <button
                                                    type="button"
                                                    onClick={checkBookingConflict}
                                                    disabled={checkingConflict}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: '#ffffff',
                                                        color: '#1e3a8a',
                                                        border: '1px solid #bfdbfe',
                                                        padding: '10px',
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        cursor: checkingConflict ? 'not-allowed' : 'pointer',
                                                        marginBottom: '14px',
                                                        opacity: checkingConflict ? 0.7 : 1
                                                    }}
                                                >
                                                    {checkingConflict ? '🔍 Checking Availability...' : '🔍 Check Availability'}
                                                </button>
                                            )}

                                            {hasConflict && (
                                                <div style={{
                                                    backgroundColor: '#fee2e2',
                                                    border: '1px solid #fecaca',
                                                    color: '#991b1b',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    marginBottom: '14px',
                                                    fontSize: '13px',
                                                    lineHeight: 1.6
                                                }}>
                                                    ⚠️ <strong>Slot Unavailable:</strong> This time slot has a conflicting booking. Please select a different date or time.
                                                </div>
                                            )}

                                            {!hasConflict && bookingData.startTime && bookingData.endTime && (
                                                <div style={{
                                                    backgroundColor: '#d1fae5',
                                                    border: '1px solid #a7f3d0',
                                                    color: '#065f46',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    marginBottom: '14px',
                                                    fontSize: '13px',
                                                    lineHeight: 1.6
                                                }}>
                                                    ✅ <strong>Slot Available:</strong> This time slot is available for booking.
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                                                <button type="submit" disabled={isSubmitting || hasConflict} style={{ flex: 2, minWidth: '180px', backgroundColor: hasConflict ? '#cbd5e1' : '#0d6efd', color: '#ffffff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: 'bold', cursor: isSubmitting || hasConflict ? 'not-allowed' : 'pointer', opacity: isSubmitting || hasConflict ? 0.6 : 1 }}>
                                                    {isSubmitting ? '⏳ Submitting Your Request...' : hasConflict ? '❌ Slot Unavailable' : '✓ Submit Booking Request'}
                                                </button>
                                                <button type="button" onClick={() => { setShowBookingForm(false); setHasConflict(false); setBookingMessage({ type: '', text: '' }); }} style={{ flex: 1, minWidth: '140px', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '13px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                    Cancel
                                                </button>
                                            </div>

                                            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#f8fbff', borderRadius: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                                                <strong>📧 Email Confirmation:</strong> You will receive a confirmation email immediately after submitting. An admin will review your request and send you another email once approved or rejected.
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;