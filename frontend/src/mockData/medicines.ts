export interface Medicine {
  name: string;
  drugClass: string;
  uses: string;
  dosage: string;
  sideEffects: string[];
  precautions: string[];
}

export const mockMedicines: Medicine[] = [
  {
    name: "Atenolol",
    drugClass: "Beta-blocker",
    uses: "Used to treat high blood pressure and chest pain (angina). It helps to lower heart rate and blood pressure.",
    dosage: "25-100mg once daily. Dosage adjusted by physician based on condition.",
    sideEffects: ["Fatigue", "Cold hands/feet", "Dizziness", "Nausea", "Slow heartbeat"],
    precautions: ["Do not stop suddenly", "Monitor blood pressure regularly", "Inform doctor if diabetic"],
  },
  {
    name: "Lisinopril",
    drugClass: "ACE Inhibitor",
    uses: "Treats high blood pressure and heart failure. Helps protect the heart after a heart attack.",
    dosage: "5-40mg once daily. Start with lower dose.",
    sideEffects: ["Dry cough", "Dizziness", "Headache", "Fatigue", "Nausea"],
    precautions: ["Avoid potassium supplements", "Monitor kidney function", "Not for use in pregnancy"],
  },
  {
    name: "Warfarin",
    drugClass: "Anticoagulant",
    uses: "Prevents blood clots in conditions like atrial fibrillation, heart valve replacement.",
    dosage: "Individualized dosing based on INR levels. Typically 2-10mg daily.",
    sideEffects: ["Bleeding", "Bruising easily", "Blood in urine", "Nosebleeds"],
    precautions: ["Regular INR monitoring", "Consistent vitamin K intake", "Avoid alcohol"],
  },
  {
    name: "Amlodipine",
    drugClass: "Calcium Channel Blocker",
    uses: "Treats high blood pressure and coronary artery disease. Relaxes blood vessels.",
    dosage: "2.5-10mg once daily.",
    sideEffects: ["Swelling in ankles", "Flushing", "Headache", "Dizziness", "Fatigue"],
    precautions: ["Monitor blood pressure", "Report swelling", "Avoid grapefruit juice"],
  },
  {
    name: "Digoxin",
    drugClass: "Cardiac Glycoside",
    uses: "Treats heart failure and atrial fibrillation. Strengthens heartbeat and controls heart rate.",
    dosage: "0.125-0.25mg once daily. Adjusted based on kidney function.",
    sideEffects: ["Nausea", "Loss of appetite", "Blurred vision", "Fatigue", "Irregular heartbeat"],
    precautions: ["Regular blood level monitoring", "Monitor potassium levels", "Report vision changes"],
  },
  {
    name: "Furosemide",
    drugClass: "Loop Diuretic",
    uses: "Treats fluid retention (edema) in heart failure. Removes excess fluid from the body.",
    dosage: "20-80mg once or twice daily.",
    sideEffects: ["Frequent urination", "Dehydration", "Dizziness", "Muscle cramps", "Low potassium"],
    precautions: ["Monitor electrolytes", "Stay hydrated", "Take in the morning"],
  },
];

export function searchMedicine(query: string): Medicine | undefined {
  return mockMedicines.find(m => m.name.toLowerCase().includes(query.toLowerCase()));
}
