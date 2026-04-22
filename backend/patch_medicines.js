import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Medicine from './models/Medicine.js';

const patchMedicines = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pulseguard');
        console.log('Connected to DB. Starting medicine patch...');

        const medicines = [
            { name: 'Aspirin', drugClass: 'NSAID', uses: ['Pain relief', 'Fever', 'Inflammation', 'Angina'], dosage: '75mg - 325mg daily', dosageForm: 'Tablet', ingredients: ['Acetylsalicylic acid'], sideEffects: ['Nausea', 'Heartburn'], precautions: ['Asthma', 'Bleeding disorders'] },
            { name: 'Atorvastatin', drugClass: 'Statin', uses: ['Lower cholesterol', 'Prevent heart disease'], dosage: '10mg - 80mg daily', dosageForm: 'Tablet', ingredients: ['Atorvastatin calcium'], sideEffects: ['Muscle pain', 'Liver toxicity'], precautions: ['Liver disease', 'Pregnancy'] },
            { name: 'Lisinopril', drugClass: 'ACE Inhibitor', uses: ['Hypertension', 'Heart failure'], dosage: '10mg - 40mg daily', dosageForm: 'Tablet', ingredients: ['Lisinopril dihydrate'], sideEffects: ['Dry cough', 'Dizziness'], precautions: ['Kidney issues', 'Pregnancy'] },
            { name: 'Metoprolol', drugClass: 'Beta Blocker', uses: ['Angina', 'Hypertension', 'Arrhythmia'], dosage: '25mg - 100mg daily', dosageForm: 'Capsule', ingredients: ['Metoprolol succinate'], sideEffects: ['Fatigue', 'Bradycardia'], precautions: ['Asthma', 'Heart block'] },
            { name: 'Amlodipine', drugClass: 'Calcium Channel Blocker', uses: ['Hypertension', 'Angina'], dosage: '5mg - 10mg daily', dosageForm: 'Tablet', ingredients: ['Amlodipine besylate'], sideEffects: ['Swelling', 'Fatigue'], precautions: ['Liver disease', 'Heart failure'] }
        ];

        for (const med of medicines) {
            await Medicine.findOneAndUpdate({ name: med.name }, med, { upsert: true, new: true });
        }
        console.log('Medicines patched successfully.');

        console.log('--- PATCH COMPLETE ---');
        process.exit();
    } catch (err) {
        console.error('Error during patch:', err);
        process.exit(1);
    }
};

patchMedicines();
