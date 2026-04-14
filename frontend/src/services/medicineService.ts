import api from './api';

export const medicineService = {
  getMedicines: async () => {
    const response = await api.get('/medicines');
    return response.data?.data || [];
  },

  searchMedicines: async (query: string) => {
    const response = await api.get(`/medicines/search?q=${query}`);
    return response.data?.data || [];
  },
};
