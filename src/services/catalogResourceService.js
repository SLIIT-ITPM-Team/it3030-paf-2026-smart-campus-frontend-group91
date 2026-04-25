import api from '../api/api';

const mapWindow = (windowItem = {}) => ({
  id: windowItem.id ?? null,
  dayOfWeek: windowItem.dayOfWeek || 'MONDAY',
  startTime: windowItem.startTime || '08:00',
  endTime: windowItem.endTime || '18:00',
});

const mapLocation = (location = {}) => ({
  id: location.id ?? null,
  buildingName: location.buildingName || '',
  floorNumber: location.floorNumber || '',
  roomNumber: location.roomNumber || '',
  description: location.description || '',
});

const mapResource = (item = {}) => ({
  id: item.id ?? null,
  name: item.name || '',
  type: item.type || 'LECTURE_HALL',
  capacity: item.capacity ?? 0,
  status: item.status || 'ACTIVE',
  location: mapLocation(item.location),
  availabilityWindows: Array.isArray(item.availabilityWindows)
    ? item.availabilityWindows.map(mapWindow)
    : [],
});

const catalogResourceService = {
  getResources: async (filters = {}) => {
    const response = await api.get('/catalog/resources', {
      params: {
        keyword: filters.keyword || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        minCapacity: filters.minCapacity || undefined,
        location: filters.location || undefined,
      },
    });

    return Array.isArray(response.data) ? response.data.map(mapResource) : [];
  },

  getResource: async (resourceId) => {
    const response = await api.get(`/catalog/resources/${resourceId}`);
    return mapResource(response.data);
  },

  createResource: async (payload) => {
    const response = await api.post('/catalog/resources', payload);
    return mapResource(response.data);
  },

  updateResource: async (resourceId, payload) => {
    const response = await api.put(`/catalog/resources/${resourceId}`, payload);
    return mapResource(response.data);
  },

  updateStatus: async (resourceId, status) => {
    const response = await api.patch(`/catalog/resources/${resourceId}/status`, null, {
      params: { status },
    });
    return mapResource(response.data);
  },

  replaceAvailability: async (resourceId, windows = []) => {
    const response = await api.put(`/catalog/resources/${resourceId}/availability`, windows);
    return Array.isArray(response.data) ? response.data.map(mapWindow) : [];
  },

  deleteResource: async (resourceId) => {
    await api.delete(`/catalog/resources/${resourceId}`);
  },
};

export default catalogResourceService;
