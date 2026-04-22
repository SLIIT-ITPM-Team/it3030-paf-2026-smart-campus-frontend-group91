import api from '../api/api';

const mapResource = (item) => ({
  id: item.id ?? item.resourceId,
  resourceId: item.resourceId ?? item.id,
  resourceName: item.resourceName ?? item.name,
  resourceType: item.resourceType ?? item.type,
  location: item.location,
  capacity: item.capacity,
  status: item.status,
});

const resourceService = {
  getResources: async (filters = {}) => {
    const response = await api.get('/resources', {
      params: {
        keyword: filters.keyword || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
      },
    });

    return Array.isArray(response.data) ? response.data.map(mapResource) : [];
  },

  getResourceById: async (resourceId) => {
    const response = await api.get(`/resources/${resourceId}`);
    return mapResource(response.data);
  },
};

export default resourceService;
