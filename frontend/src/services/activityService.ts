import api from './api';

export const activityService = {
  getPlan: async (patientId: string) => {
    const response = await api.get(`/activity-plans/${patientId}`);
    return response.data;
  },

  updatePlan: async (patientId: string, planData: any) => {
    const response = await api.put(`/activity-plans/${patientId}`, planData);
    return response.data;
  },

  addItem: async (patientId: string, itemData: any) => {
    const response = await api.post(`/activity-plans/${patientId}/items`, itemData);
    return response.data;
  },

  removeItem: async (patientId: string, itemId: string) => {
    const response = await api.delete(`/activity-plans/${patientId}/items/${itemId}`);
    return response.data;
  },
};
