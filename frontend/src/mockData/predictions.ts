export interface PredictionResult {
  id: string;
  _id?: string;
  condition: string;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  riskScore: number;
  confidence: number;
  features: { name: string; contribution: number }[];
  date: string;
  audioUrl?: string;
  createdAt?: string;
  doctorRemarks?: string;
  reviewed?: boolean;
}

export const mockPredictions: PredictionResult[] = [
  {
    id: "pred-001",
    condition: "Normal",
    severity: "None",
    riskScore: 12,
    confidence: 94,
    features: [
      { name: "Murmur Intensity", contribution: 5 },
      { name: "Spectral Frequency Spread", contribution: 8 },
      { name: "Signal Irregularity", contribution: 3 },
      { name: "S1/S2 Ratio", contribution: 2 },
      { name: "Heart Rate Variability", contribution: 6 },
    ],
    date: "2026-03-08",
  },
  {
    id: "pred-002",
    condition: "Mitral Regurgitation",
    severity: "Moderate",
    riskScore: 67,
    confidence: 89,
    features: [
      { name: "Murmur Intensity", contribution: 72 },
      { name: "Spectral Frequency Spread", contribution: 58 },
      { name: "Signal Irregularity", contribution: 45 },
      { name: "S1/S2 Ratio", contribution: 38 },
      { name: "Heart Rate Variability", contribution: 30 },
    ],
    date: "2026-03-05",
  },
  {
    id: "pred-003",
    condition: "Aortic Stenosis",
    severity: "Severe",
    riskScore: 86,
    confidence: 91,
    features: [
      { name: "Murmur Intensity", contribution: 88 },
      { name: "Spectral Frequency Spread", contribution: 75 },
      { name: "Signal Irregularity", contribution: 62 },
      { name: "S1/S2 Ratio", contribution: 55 },
      { name: "Heart Rate Variability", contribution: 48 },
    ],
    date: "2026-02-28",
  },
  {
    id: "pred-004",
    condition: "Mitral Stenosis",
    severity: "Mild",
    riskScore: 35,
    confidence: 87,
    features: [
      { name: "Murmur Intensity", contribution: 32 },
      { name: "Spectral Frequency Spread", contribution: 28 },
      { name: "Signal Irregularity", contribution: 20 },
      { name: "S1/S2 Ratio", contribution: 18 },
      { name: "Heart Rate Variability", contribution: 15 },
    ],
    date: "2026-02-20",
  },
  {
    id: "pred-005",
    condition: "Mitral Valve Prolapse",
    severity: "Moderate",
    riskScore: 54,
    confidence: 85,
    features: [
      { name: "Murmur Intensity", contribution: 50 },
      { name: "Spectral Frequency Spread", contribution: 42 },
      { name: "Signal Irregularity", contribution: 38 },
      { name: "S1/S2 Ratio", contribution: 30 },
      { name: "Heart Rate Variability", contribution: 25 },
    ],
    date: "2026-02-15",
  },
];

export function getRandomPrediction(): PredictionResult {
  const conditions = [
    { condition: "Normal", severity: "None" as const, riskRange: [5, 20], confRange: [90, 98] },
    { condition: "Mitral Regurgitation", severity: "Moderate" as const, riskRange: [55, 75], confRange: [82, 92] },
    { condition: "Aortic Stenosis", severity: "Severe" as const, riskRange: [75, 95], confRange: [85, 95] },
    { condition: "Mitral Stenosis", severity: "Mild" as const, riskRange: [25, 45], confRange: [80, 90] },
    { condition: "Mitral Valve Prolapse", severity: "Moderate" as const, riskRange: [45, 65], confRange: [78, 90] },
  ];
  const pick = conditions[Math.floor(Math.random() * conditions.length)];
  const riskScore = Math.floor(Math.random() * (pick.riskRange[1] - pick.riskRange[0])) + pick.riskRange[0];
  const confidence = Math.floor(Math.random() * (pick.confRange[1] - pick.confRange[0])) + pick.confRange[0];

  return {
    id: `pred-${Date.now()}`,
    condition: pick.condition,
    severity: pick.severity,
    riskScore,
    confidence,
    features: [
      { name: "Murmur Intensity", contribution: Math.floor(Math.random() * 80) + 10 },
      { name: "Spectral Frequency Spread", contribution: Math.floor(Math.random() * 70) + 10 },
      { name: "Signal Irregularity", contribution: Math.floor(Math.random() * 60) + 10 },
      { name: "S1/S2 Ratio", contribution: Math.floor(Math.random() * 50) + 10 },
      { name: "Heart Rate Variability", contribution: Math.floor(Math.random() * 40) + 10 },
    ],
    date: new Date().toISOString().split('T')[0],
  };
}
