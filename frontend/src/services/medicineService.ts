import api from './api';

export const medicineService = {
  getMedicines: async () => {
    const response = await api.get('/medicines');
    return response.data?.data || [];
  },

  searchMedicines: async (params: { q?: string, drugClass?: string, dosageForm?: string, uses?: string, ingredients?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.drugClass) searchParams.append('drugClass', params.drugClass);
    if (params.dosageForm) searchParams.append('dosageForm', params.dosageForm);
    if (params.uses) searchParams.append('uses', params.uses);
    if (params.ingredients) searchParams.append('ingredients', params.ingredients);
    
    // Fallback to plain getMedicines if no search params and we just want some records
    if (searchParams.toString() === '') {
        const response = await api.get('/medicines');
        return response.data?.data || [];
    }

    const response = await api.get(`/medicines/search?${searchParams.toString()}`);
    return response.data?.data || [];
  },
};
