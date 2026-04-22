import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import resourceService from '../../services/resourceService';
import waitlistService from '../../services/waitlistService';
import {
  compareTime,
  isPastDateTime,
  normalizeTime,
} from './bookingUiUtils';
import './booking.css';

const INITIAL_FORM = {
  resourceId: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: 1,
};

const BookingFormPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [availability, setAvailability] = useState({
    checked: false,
    checking: false,
    available: false,
    message: '',
    suggestions: [],
  });
  const [alert, setAlert] = useState({ type: 'info', text: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const result = await resourceService.getResources();
        setResources(result);

        const selectedFromQuery = params.get('resourceId');
        if (selectedFromQuery) {
          setForm((prev) => ({ ...prev, resourceId: String(selectedFromQuery) }));
        }
      } catch (error) {
        setAlert({
          type: 'error',
          text: error?.response?.data?.message || 'Unable to load resources.',
        });
      }
    };

    loadResources();
  }, [params]);

  const selectedResource = useMemo(
    () => resources.find((item) => String(item.resourceId) === String(form.resourceId)),
    [resources, form.resourceId],
  );

  useEffect(() => {
    let isMounted = true;
    const shouldCheck =
      form.resourceId && form.bookingDate && form.startTime && form.endTime && compareTime(form.startTime, form.endTime);

    if (!shouldCheck) {
      setAvailability({
        checked: false,
        checking: false,
        available: false,
        message: '',
        suggestions: [],
      });
      return undefined;
    }

    setAvailability((prev) => ({ ...prev, checking: true }));

    const timeout = setTimeout(async () => {
      try {
        const response = await bookingService.checkAvailability(
          Number(form.resourceId),
          form.bookingDate,
          form.startTime,
          form.endTime,
        );

        if (!isMounted) return;

        setAvailability({
          checked: true,
          checking: false,
          available: response.available,
          message: response.message,
          suggestions: response.suggestions || [],
        });
      } catch (error) {
        if (!isMounted) return;
        setAvailability({
          checked: true,
          checking: false,
          available: false,
          message: 'Unable to validate slot right now. Please try again.',
          suggestions: [],
        });
      }
    }, 360);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [form.resourceId, form.bookingDate, form.startTime, form.endTime]);

  const validate = () => {
    const nextErrors = {};

    if (!form.resourceId) nextErrors.resourceId = 'Resource is required.';
    if (!form.bookingDate) nextErrors.bookingDate = 'Date is required.';
    if (!form.startTime) nextErrors.startTime = 'Start time is required.';
    if (!form.endTime) nextErrors.endTime = 'End time is required.';
    if (!form.purpose.trim()) nextErrors.purpose = 'Purpose is required.';

    if (form.expectedAttendees < 1) {
      nextErrors.expectedAttendees = 'Expected attendees must be at least 1.';
    }

    if (selectedResource?.capacity > 0 && Number(form.expectedAttendees) > selectedResource.capacity) {
      nextErrors.expectedAttendees = `Attendees exceed capacity (${selectedResource.capacity}).`;
    }

    if (form.startTime && form.endTime && !compareTime(form.startTime, form.endTime)) {
      nextErrors.endTime = 'End time must be after start time.';
    }

    if (isPastDateTime(form.bookingDate, form.startTime)) {
      nextErrors.startTime = 'Booking cannot be in the past.';
    }

    if (selectedResource?.status === 'OUT_OF_SERVICE') {
      nextErrors.resourceId = 'This resource is currently OUT_OF_SERVICE and cannot be booked.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setAlert({ type: 'info', text: '' });
  };

  const onJoinWaitlist = async () => {
    try {
      const entry = await waitlistService.joinWaitlist({
        resourceId: form.resourceId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
      });

      setAlert({
        type: 'success',
        text: `Added to waitlist successfully. Your position is #${entry.position || '-'}.`,
      });
    } catch (error) {
      setAlert({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to join waitlist for this slot.',
      });
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    if (availability.checked && !availability.available) {
      setAlert({
        type: 'error',
        text: 'This slot is currently unavailable. Join waitlist or choose a suggested slot.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const booking = await bookingService.createBooking({
        resourceId: Number(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        expectedAttendees: Number(form.expectedAttendees),
      });

      setAlert({
        type: 'success',
        text: `Booking submitted with status ${booking.status}. A confirmation email has been triggered.`,
      });
      setTimeout(() => navigate('/user/bookings'), 700);
    } catch (error) {
      setAlert({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Booking could not be submitted because the slot is unavailable or invalid.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-card">
          <h1 className="booking-title">Create Booking Request</h1>
          <p className="booking-sub">
            Select a resource, set date and time, and submit a booking that starts in <strong>PENDING</strong> state.
          </p>
        </div>

        {alert.text ? (
          <div className={`booking-alert booking-alert-${alert.type === 'error' ? 'error' : alert.type === 'success' ? 'success' : 'info'}`}>
            {alert.text}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="booking-card booking-grid">
          <div className="booking-col-6">
            <label className="booking-label" htmlFor="resourceId">Resource</label>
            <select
              id="resourceId"
              name="resourceId"
              className="booking-select"
              value={form.resourceId}
              onChange={onFieldChange}
            >
              <option value="">Select resource</option>
              {resources.map((resource) => (
                <option key={resource.resourceId} value={resource.resourceId}>
                  {resource.resourceName} ({resource.resourceType})
                </option>
              ))}
            </select>
            {errors.resourceId ? <small className="field-error">{errors.resourceId}</small> : null}
          </div>

          <div className="booking-col-3">
            <label className="booking-label" htmlFor="bookingDate">Date</label>
            <input
              id="bookingDate"
              name="bookingDate"
              type="date"
              className="booking-input"
              value={form.bookingDate}
              onChange={onFieldChange}
            />
            {errors.bookingDate ? <small className="field-error">{errors.bookingDate}</small> : null}
          </div>

          <div className="booking-col-3">
            <label className="booking-label" htmlFor="expectedAttendees">Expected Attendees</label>
            <input
              id="expectedAttendees"
              name="expectedAttendees"
              type="number"
              min="1"
              className="booking-input"
              value={form.expectedAttendees}
              onChange={onFieldChange}
            />
            {errors.expectedAttendees ? <small className="field-error">{errors.expectedAttendees}</small> : null}
          </div>

          <div className="booking-col-3">
            <label className="booking-label" htmlFor="startTime">Start Time</label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              className="booking-input"
              value={form.startTime}
              onChange={onFieldChange}
            />
            {errors.startTime ? <small className="field-error">{errors.startTime}</small> : null}
          </div>

          <div className="booking-col-3">
            <label className="booking-label" htmlFor="endTime">End Time</label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              className="booking-input"
              value={form.endTime}
              onChange={onFieldChange}
            />
            {errors.endTime ? <small className="field-error">{errors.endTime}</small> : null}
          </div>

          <div className="booking-col-6">
            <label className="booking-label" htmlFor="purpose">Purpose</label>
            <textarea
              id="purpose"
              name="purpose"
              className="booking-textarea"
              value={form.purpose}
              onChange={onFieldChange}
              placeholder="Describe why you need this resource"
            />
            {errors.purpose ? <small className="field-error">{errors.purpose}</small> : null}
          </div>

          <div className="booking-col-6">
            <label className="booking-label">Real-Time Availability</label>
            {!availability.checked && !availability.checking ? (
              <div className="booking-alert booking-alert-info">
                Fill resource/date/time to run automatic availability checks.
              </div>
            ) : null}
            {availability.checking ? (
              <div className="booking-alert booking-alert-info">Checking slot availability...</div>
            ) : null}
            {availability.checked ? (
              <div className={availability.available ? 'booking-status-free' : 'booking-status-busy'}>
                <span className="booking-status-dot" />
                {availability.available ? 'Slot is available' : 'Slot is unavailable'}
                {availability.message ? ` - ${availability.message}` : ''}
              </div>
            ) : null}

            {!availability.available && availability.suggestions.length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <strong>Next 3 available slots on the same day:</strong>
                <ul>
                  {availability.suggestions.slice(0, 3).map((slot, index) => (
                    <li key={`${slot.startTime}-${slot.endTime}-${index}`}>
                      {normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}
                      <button
                        type="button"
                        className="booking-btn booking-btn-muted"
                        style={{ marginLeft: 8 }}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            startTime: normalizeTime(slot.startTime),
                            endTime: normalizeTime(slot.endTime),
                          }))
                        }
                      >
                        Use this slot
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {availability.checked && !availability.available ? (
              <div className="booking-actions" style={{ marginTop: 10 }}>
                <button type="button" className="booking-btn booking-btn-danger" onClick={onJoinWaitlist}>
                  Join Waitlist
                </button>
              </div>
            ) : null}
          </div>

          {selectedResource ? (
            <div className="booking-col-12 booking-card" style={{ margin: 0 }}>
              <strong>Selected Resource Details</strong>
              <p className="booking-sub" style={{ marginTop: 8 }}>
                {selectedResource.resourceName} | {selectedResource.resourceType} | {selectedResource.location} | Capacity: {selectedResource.capacity}
              </p>
              <p className="booking-sub">
                Status: <strong>{selectedResource.status}</strong>
              </p>
            </div>
          ) : null}

          <div className="booking-col-12 booking-actions">
            <button type="submit" className="booking-btn booking-btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
            <button type="button" className="booking-btn booking-btn-muted" onClick={() => navigate('/user/bookings')}>
              Back to My Bookings
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default BookingFormPage;
