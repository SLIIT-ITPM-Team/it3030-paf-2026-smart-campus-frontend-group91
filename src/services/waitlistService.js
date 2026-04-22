import api from '../api/api';

const mapWaitlist = (item) => ({
  id: item.id ?? item.waitlistId,
  waitlistId: item.waitlistId ?? item.id,
  resourceId: item.resourceId,
  resourceName: item.resourceName,
  bookingDate: item.bookingDate,
  startTime: item.startTime,
  endTime: item.endTime,
  status: item.status,
  position: item.position,
  notifiedAt: item.notifiedAt,
  claimExpiresAt: item.claimExpiresAt,
  createdAt: item.createdAt,
});

const waitlistService = {
  joinWaitlist: async (payload) => {
    const response = await api.post('/waitlists', {
      resourceId: Number(payload.resourceId),
      bookingDate: payload.bookingDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });

    return mapWaitlist(response.data);
  },

  getMyWaitlist: async () => {
    const response = await api.get('/waitlists/my');
    return Array.isArray(response.data) ? response.data.map(mapWaitlist) : [];
  },

  leaveWaitlist: async (waitlistId) => {
    const response = await api.delete(`/waitlists/${waitlistId}`);
    return mapWaitlist(response.data);
  },

  claimSlot: async (waitlistId) => {
    const response = await api.post(`/waitlists/${waitlistId}/claim`);
    return response.data;
  },
};

export default waitlistService;
