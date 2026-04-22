import api from '../api/api';

const toTimeValue = (value) => {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes('T')) {
    return stringValue.split('T')[1].slice(0, 8);
  }
  return stringValue.slice(0, 8);
};

const toBookingDateValue = (payload) => {
  if (payload.bookingDate) return payload.bookingDate;
  if (payload.date) return payload.date;
  if (payload.startTime && String(payload.startTime).includes('T')) {
    return String(payload.startTime).split('T')[0];
  }
  return '';
};

const normalizeCreatePayload = (payload) => {
  const resourceId = Number(payload.resourceId ?? payload.facilityId);
  const bookingDate = toBookingDateValue(payload);
  const startTime = toTimeValue(payload.startTime);
  const endTime = toTimeValue(payload.endTime);
  const expectedAttendees = Number(payload.expectedAttendees ?? payload.attendees ?? 0);

  return {
    resourceId,
    bookingDate,
    startTime,
    endTime,
    purpose: String(payload.purpose ?? '').trim(),
    expectedAttendees,
  };
};

const normalizeBooking = (item) => {
  const bookingDate = item.bookingDate ?? item.date ?? '';
  const startTimeOnly = toTimeValue(item.startTime);
  const endTimeOnly = toTimeValue(item.endTime);
  const startDateTime =
    bookingDate && startTimeOnly ? `${bookingDate}T${startTimeOnly.slice(0, 5)}:00` : item.startTime;
  const endDateTime =
    bookingDate && endTimeOnly ? `${bookingDate}T${endTimeOnly.slice(0, 5)}:00` : item.endTime;

  return {
    ...item,
    id: item.id ?? item.bookingId,
    bookingId: item.bookingId ?? item.id,
    resourceId: item.resourceId ?? item.facilityId,
    facilityId: item.resourceId ?? item.facilityId,
    resourceName: item.resourceName ?? item.facilityName,
    facilityName: item.resourceName ?? item.facilityName,
    attendees: item.attendees ?? item.expectedAttendees ?? 0,
    expectedAttendees: item.expectedAttendees ?? item.attendees ?? 0,
    date: bookingDate,
    startTime: startDateTime,
    endTime: endDateTime,
    startTimeOnly,
    endTimeOnly,
    decisionReason: item.decisionReason ?? item.rejectionReason ?? item.cancellationReason ?? '',
  };
};

const bookingService = {
  getAllBookings: async (filters = {}) => {
    try {
      const response = await api.get('/bookings/admin', {
        params: {
          status: filters.status || undefined,
          resourceId: filters.resourceId || undefined,
          userId: filters.userId || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        },
        headers: {
          'X-User-Role': 'ADMIN',
        },
      });
      return Array.isArray(response.data) ? response.data.map(normalizeBooking) : [];
    } catch (error) {
      try {
        const fallbackResponse = await api.get('/bookings');
        return Array.isArray(fallbackResponse.data)
          ? fallbackResponse.data.map(normalizeBooking)
          : [];
      } catch (fallbackError) {
        console.error('Failed to fetch all bookings:', fallbackError);
        throw fallbackError;
      }
    }
  },

  getUserBookings: async (_userId, filters = {}) => {
    try {
      const response = await api.get('/bookings/my', {
        params: {
          status: filters.status || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        },
      });
      return Array.isArray(response.data) ? response.data.map(normalizeBooking) : [];
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
      throw error;
    }
  },

  getFacilityBookings: async (facilityId) => {
    try {
      const allBookings = await bookingService.getAllBookings();
      return allBookings.filter((booking) => String(booking.resourceId) === String(facilityId));
    } catch (error) {
      try {
        const myBookings = await bookingService.getUserBookings();
        return myBookings.filter((booking) => String(booking.resourceId) === String(facilityId));
      } catch (myBookingsError) {
        try {
        const response = await api.get(`/bookings/facility/${facilityId}`);
        return Array.isArray(response.data) ? response.data.map(normalizeBooking) : [];
        } catch (fallbackError) {
          console.error('Failed to fetch facility bookings:', fallbackError);
          throw fallbackError;
        }
      }
    }
  },

  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return normalizeBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      throw error;
    }
  },

  createBooking: async (payload) => {
    try {
      const response = await api.post('/bookings', normalizeCreatePayload(payload));
      return normalizeBooking(response.data);
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  },

  updateBookingStatus: async (id, status, options = {}) => {
    try {
      const normalizedStatus = String(status || '').toUpperCase();

      if (normalizedStatus === 'APPROVED') {
        const response = await api.patch(`/bookings/${id}/approve`, {}, {
          headers: {
            'X-User-Role': options.userRole || 'ADMIN',
          },
        });
        return normalizeBooking(response.data);
      }

      if (normalizedStatus === 'REJECTED') {
        const response = await api.patch(`/bookings/${id}/reject`, {
          reason: String(options.reason || 'Rejected by admin.').trim(),
        }, {
          headers: {
            'X-User-Role': options.userRole || 'ADMIN',
          },
        });
        return normalizeBooking(response.data);
      }

      if (normalizedStatus === 'CANCELLED') {
        const response = await api.patch(`/bookings/${id}/cancel`, {
          reason: String(options.reason || 'Cancelled by requester.').trim(),
        }, {
          headers: {
            'X-User-Role': options.userRole || 'USER',
          },
        });
        return normalizeBooking(response.data);
      }

      throw new Error(`Unsupported booking status update: ${status}`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  },

  cancelBooking: async (id, reason = 'Cancelled by requester.') => {
    try {
      const response = await api.patch(`/bookings/${id}/cancel`, {
        reason: String(reason || 'Cancelled by requester.').trim(),
      });
      return normalizeBooking(response.data);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      throw error;
    }
  },

  // Conflict detection
  checkAvailability: async (resourceId, bookingDate, startTime, endTime) => {
    const response = await api.get('/bookings/availability', {
      params: {
        resourceId,
        bookingDate,
        startTime,
        endTime,
      },
    });

    return {
      available: Boolean(response?.data?.available),
      message: response?.data?.message || '',
      suggestions: Array.isArray(response?.data?.suggestions)
        ? response.data.suggestions
        : [],
    };
  },

  checkConflict: async (facilityId, startTime, endTime, date) => {
    try {
      const bookingDate =
        date || (startTime && String(startTime).includes('T') ? String(startTime).split('T')[0] : undefined);
      const start = toTimeValue(startTime).slice(0, 5);
      const end = toTimeValue(endTime).slice(0, 5);

      const availability = await bookingService.checkAvailability(
        facilityId,
        bookingDate,
        start,
        end,
      );
      return availability.available === false;
    } catch (error) {
      console.warn('Conflict check failed, falling back to client-side detection:', error);
      return null;
    }
  },

  // Client-side conflict detection helper
  detectConflict: (bookings, startTime, endTime) => {
    const toMinutes = (time) => {
      const [hour, minute] = String(time || '00:00')
        .split(':')
        .map((value) => Number(value));
      return hour * 60 + minute;
    };

    const rangesOverlap = (startA, endA, startB, endB) => {
      return Math.max(startA, startB) < Math.min(endA, endB);
    };

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    return bookings.some((booking) => {
      if (booking.status !== 'APPROVED') return false;
      return rangesOverlap(
        start,
        end,
        toMinutes(booking.startTime),
        toMinutes(booking.endTime)
      );
    });
  },
};

export default bookingService;
