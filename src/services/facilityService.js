import api from '../api/api';

const facilityService = {
  getAllFacilities: async () => {
    const response = await api.get('/catalog/resources');
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default facilityService;
