import { PredictionResult, mockPredictions } from './predictions';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  bloodGroup: string;
  weight: number;
  height: number;
  photo: string;
  screenings: PredictionResult[];
  doctorRemarks?: string;
  reviewed?: boolean;
}

export const mockPatients: Patient[] = [
  {
    id: "pat-001",
    name: "Rajesh Kumar",
    age: 45,
    gender: "Male",
    phone: "+91 98765 43210",
    address: "Village Rampur, District Varanasi, UP",
    bloodGroup: "B+",
    weight: 72,
    height: 170,
    photo: "RK",
    screenings: [mockPredictions[0], mockPredictions[1], mockPredictions[3]],
    reviewed: true,
    doctorRemarks: "Patient shows improvement. Continue monitoring.",
  },
  {
    id: "pat-002",
    name: "Priya Sharma",
    age: 62,
    gender: "Female",
    phone: "+91 87654 32109",
    address: "Village Sundarpur, District Lucknow, UP",
    bloodGroup: "A+",
    weight: 58,
    height: 155,
    photo: "PS",
    screenings: [mockPredictions[2], mockPredictions[4]],
    reviewed: false,
  },
  {
    id: "pat-003",
    name: "Amit Patel",
    age: 38,
    gender: "Male",
    phone: "+91 76543 21098",
    address: "Village Keshavpur, District Jaipur, RJ",
    bloodGroup: "O+",
    weight: 80,
    height: 175,
    photo: "AP",
    screenings: [mockPredictions[0]],
    reviewed: true,
    doctorRemarks: "Normal readings. No follow-up needed.",
  },
  {
    id: "pat-004",
    name: "Sunita Devi",
    age: 55,
    gender: "Female",
    phone: "+91 65432 10987",
    address: "Village Govindpur, District Patna, BR",
    bloodGroup: "AB+",
    weight: 65,
    height: 160,
    photo: "SD",
    screenings: [mockPredictions[2], mockPredictions[1], mockPredictions[4]],
    reviewed: false,
  },
  {
    id: "pat-005",
    name: "Mohan Singh",
    age: 70,
    gender: "Male",
    phone: "+91 54321 09876",
    address: "Village Laxmipur, District Bhopal, MP",
    bloodGroup: "O-",
    weight: 68,
    height: 168,
    photo: "MS",
    screenings: [mockPredictions[3], mockPredictions[0]],
    reviewed: true,
    doctorRemarks: "Mild condition stable. Annual review recommended.",
  },
];

export const currentPatient = mockPatients[0];
