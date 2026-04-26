import api from './api';

export const medicineService = {
  getMedicines: async () => {
    const response = await api.get('/medicines');
    return response.data?.data || [];
  },

  searchMedicines: async (params: { 
    q?: string, 
    drugClass?: string, 
    dosageForm?: string, 
    uses?: string, 
    ingredients?: string,
    dosageStrength?: string,
    routeOfAdministration?: string,
    isAvailableOTC?: string,
    requiresPrescription?: string
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    // Fallback to plain getMedicines if no search params
    if (searchParams.toString() === '') {
        const response = await api.get('/medicines');
        return response.data?.data || [];
    }

    const response = await api.get(`/medicines/search?${searchParams.toString()}`);
    return response.data?.data || [];
  },
};
