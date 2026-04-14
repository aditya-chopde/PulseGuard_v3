import api from './api';

export const getRequests = () =>
  api.get("/doctor-patients/requests").then(res => res.data);

export const sendRequest = (doctorId: string) =>
  api.post("/doctor-patients/request", { doctorId }).then(res => res.data);

export const respondRequest = (id: string, action: string) =>
  api.patch(`/doctor-patients/${id}/respond`, { action }).then(res => res.data);

