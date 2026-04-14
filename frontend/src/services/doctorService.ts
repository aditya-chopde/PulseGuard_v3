import api from './api';

// Get all doctors (public)
export const doctorService = {
  getDoctors: async () => {
    const response = await api.get('/doctor/doctors');
    return response.data;
  }
};

