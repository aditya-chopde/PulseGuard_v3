import api from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'patient' | 'doctor';
    name: string;
  };
}

export const authService = {
  login: async (email: string, password: string, role: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
  },

  signup: async (data: any): Promise<LoginResponse> => {
    // Process arrays for backend (comma split handled server-side, but ensure strings)
    const processedData = {
      ...data,
      medicalHistory: typeof data.medicalHistory === 'string' ? data.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : data.medicalHistory || [],
      allergies: typeof data.allergies === 'string' ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : data.allergies || [],
    };
    const response = await api.post('/auth/signup', processedData);
    return response.data;
  },
};
