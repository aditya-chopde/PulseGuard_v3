import api from './api';

export const screeningService = {
  submitScreening: async (formData: FormData) => {
    const response = await api.post('/screenings', formData);
    return response.data;
  },

  getPatientScreenings: async (patientId: string) => {
    const response = await api.get(`/screenings/${patientId}`);
    return response.data;
  },

  updateDoctorReview: async (screeningId: string, doctorRemarks: string) => {
    const response = await api.patch(`/screenings/${screeningId}`, { doctorRemarks, reviewed: true });
    return response.data;
  },

  getScreeningById: async (screeningId: string) => {
    const response = await api.get(`/screenings/detail/${screeningId}`);
    return response.data;
  },

  downloadReport: async (screeningId: string) => {
    const response = await api.get(`/screenings/${screeningId}/report`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
