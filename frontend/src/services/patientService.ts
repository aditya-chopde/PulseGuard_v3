import api from './api';

export const patientService = {
  getPatients: async () => {
    const response = await api.get('/patients');
    const patients = response.data?.data || [];
    
    // Map to frontend structure and fetch screenings to prevent UI crashes
    return Promise.all(patients.map(async (p: any) => {
      let screenings = [];
      try {
        const screenRes = await api.get(`/screenings/${p._id}`);
        screenings = screenRes.data?.data || [];
      } catch (e) {
        console.error("Failed to fetch screenings for", p._id);
      }
      return {
        ...p,
        id: p._id, // Dashboard requires id or _id
        age: p.details?.age || 0,
        gender: p.details?.gender || 'N/A',
        bloodGroup: p.details?.bloodGroup || 'N/A',
        weight: p.details?.weight || 0,
        height: p.details?.height || 0,
        photo: (p.name || 'UU').substring(0, 2).toUpperCase(),
        reviewed: p.details?.reviewed ?? false,
        screenings
      };
    }));
  },

  getPatientById: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    const data = response.data?.data;
    if (!data) return null;

    let screenings = [];
    try {
      const screenRes = await api.get(`/screenings/${id}`);
      screenings = screenRes.data?.data || [];
    } catch (e) {
      console.error("Failed to fetch screenings for", id);
    }

    return {
      ...data.user,
      id: data.user?._id || id,
      age: data.details?.age || 0,
      gender: data.details?.gender || 'N/A',
      bloodGroup: data.details?.bloodGroup || 'N/A',
      weight: data.details?.weight || 0,
      height: data.details?.height || 0,
      photo: (data.user?.name || 'UU').substring(0, 2).toUpperCase(),
      reviewed: data.details?.reviewed ?? false,
      screenings
    };
  },

  createPatient: async (data: any) => {
    const response = await api.post('/patients', data);
    return response.data;
  },
};
