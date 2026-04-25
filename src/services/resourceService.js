import api from '../api/api';

const buildLocationLabel = (loc) => {
  if (!loc) return '';
  return [loc.buildingName, loc.floorNumber && `Floor ${loc.floorNumber}`, loc.roomNumber]
    .filter(Boolean)
    .join(', ');
};

const mapResource = (item) => ({
  id: item.id,
  resourceId: item.id,          // alias kept for BookingFormPage compatibility
  resourceName: item.name || '',
  resourceType: item.type || '',
  location: buildLocationLabel(item.location),
  capacity: item.capacity,
  status: item.status,
});

const resourceService = {
  getResources: async () => {
    const response = await api.get('/catalog/resources', {
      params: { status: 'ACTIVE' },
    });
    return Array.isArray(response.data) ? response.data.map(mapResource) : [];
  },

  getResourceById: async (resourceId) => {
    const response = await api.get(`/catalog/resources/${resourceId}`);
    return mapResource(response.data);
  },
};

export default resourceService;
