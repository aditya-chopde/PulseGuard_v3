import api from './api';

export const recommendationService = {
  getRecommendations: async (severity: string, riskScore: number) => {
    const response = await api.get('/recommendations', {
      params: { severity, riskScore },
    });
    return response.data;
  },
};
