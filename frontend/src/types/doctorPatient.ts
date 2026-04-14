export interface DoctorPatientMapping {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
    clinicName?: string;
    phone?: string;
  };
  patientId: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedBy: string;
  assignedAt?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined';

