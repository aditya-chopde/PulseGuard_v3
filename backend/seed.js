import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import PatientDetail from './models/PatientDetail.js';
import DoctorPatient from './models/DoctorPatient.js';
import Screening from './models/Screening.js';
import Medicine from './models/Medicine.js';
import ActivityPlan from './models/ActivityPlan.js';
import ActivityItem from './models/ActivityItem.js';

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pulseguard');
        console.log('Connected to DB. Starting seed...');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // 1. Doctors
        const doctors = [
            { name: 'Dr. Gregory House', email: 'house@pulseguard.com', password: passwordHash, role: 'doctor', phone: '1234567890', specialization: 'Cardiology' },
            { name: 'Dr. John Watson', email: 'watson@pulseguard.com', password: passwordHash, role: 'doctor', phone: '0987654321', specialization: 'General Practice' },
            { name: 'Dr. Alice Roberts', email: 'roberts@pulseguard.com', password: passwordHash, role: 'doctor', phone: '1122334455', specialization: 'Neurology' }
        ];

        let createdDoctors = [];
        for (const docObj of doctors) {
            let doc = await User.findOne({ email: docObj.email });
            if (!doc) doc = await User.create(docObj);
            createdDoctors.push(doc);
        }
        console.log('Doctors seeded.');

        // 2. Patients
        const patients = [
            { user: { name: 'John Doe', email: 'johndoe@example.com', password: passwordHash, role: 'patient', phone: '5556667777' }, details: { age: 45, gender: 'Male', height: 175, weight: 75, bloodGroup: 'O+', address: '123 Apple St, NY' } },
            { user: { name: 'Jane Smith', email: 'janesmith@example.com', password: passwordHash, role: 'patient', phone: '8889990000' }, details: { age: 52, gender: 'Female', height: 162, weight: 68, bloodGroup: 'A-', address: '456 Orange Blvd, CA' } },
            { user: { name: 'Mike Johnson', email: 'mikej@example.com', password: passwordHash, role: 'patient', phone: '3334445555' }, details: { age: 38, gender: 'Male', height: 180, weight: 85, bloodGroup: 'B+', address: '789 Banana Ct, TX' } }
        ];

        let createdPatients = [];
        for (const p of patients) {
            let user = await User.findOne({ email: p.user.email });
            if (!user) user = await User.create(p.user);

            let details = await PatientDetail.findOne({ userId: user._id });
            if (!details) {
                p.details.userId = user._id;
                await PatientDetail.create(p.details);
            }
            createdPatients.push(user);
        }
        console.log('Patients seeded.');

        const drHouse = createdDoctors[0];
        const drWatson = createdDoctors[1];

        // 3. User-Doctor Relations
        const relations = [
            { doctorId: drHouse._id, patientId: createdPatients[0]._id },
            { doctorId: drHouse._id, patientId: createdPatients[1]._id },
            { doctorId: drWatson._id, patientId: createdPatients[2]._id }
        ];

        for (const rel of relations) {
            let existingRel = await DoctorPatient.findOne({ doctorId: rel.doctorId, patientId: rel.patientId });
            if (!existingRel) await DoctorPatient.create(rel);
        }
        console.log('Doctor-Patient relationships seeded.');

        // 4. Medicines
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
        console.log('Medicines seeded.');

        // 5. Activity Plans & Items (For John Doe under Dr. House)
        let johnPlan = await ActivityPlan.findOne({ patientId: createdPatients[0]._id });
        if (!johnPlan) {
            johnPlan = await ActivityPlan.create({
                patientId: createdPatients[0]._id,
                doctorId: drHouse._id,
                notes: 'Cardiac rehabilitation phase II daily routine.'
            });
        }

        const planItems = [
            { planId: johnPlan._id, time: '08:00 AM', activity: 'Take Aspirin 75mg', category: 'medication', sortOrder: 1 },
            { planId: johnPlan._id, time: '09:00 AM', activity: 'Brisk walking for 30 mins', category: 'exercise', sortOrder: 2 },
            { planId: johnPlan._id, time: '01:00 PM', activity: 'DASH diet lunch (low sodium)', category: 'diet', sortOrder: 3 },
            { planId: johnPlan._id, time: '04:00 PM', activity: 'Take Atorvastatin 20mg', category: 'medication', sortOrder: 4 },
            { planId: johnPlan._id, time: '10:00 PM', activity: 'Ensure 8 hrs sleep', category: 'rest', sortOrder: 5 }
        ];

        for (const item of planItems) {
            let existingItem = await ActivityItem.findOne({ planId: item.planId, time: item.time, activity: item.activity });
            if (!existingItem) await ActivityItem.create(item);
        }
        console.log('Activity plans and items seeded.');

        // 6. Screenings
        const screenings = [
            {
                patientId: createdPatients[0]._id, // John Doe
                initiatedBy: drHouse._id,
                audioUrl: '/uploads/sample_murmur.wav',
                inputMethod: 'upload',
                condition: 'Murmur',
                severity: 'Moderate',
                riskScore: 72,
                confidence: 89,
                features: [{ name: 'Systolic Murmur', contribution: 80 }, { name: 'Irregular Rhythm', contribution: 20 }],
                reviewed: true,
                doctorRemarks: 'Confirmed moderate systolic murmur. Scheduled for echo.'
            },
            {
                patientId: createdPatients[1]._id, // Jane Smith
                initiatedBy: createdPatients[1]._id,
                audioUrl: '/uploads/sample_normal.wav',
                inputMethod: 'record',
                condition: 'Normal',
                severity: 'None',
                riskScore: 12,
                confidence: 96,
                features: [{ name: 'S1 Quality', contribution: 50 }, { name: 'S2 Quality', contribution: 50 }],
                reviewed: false
            },
            {
                patientId: createdPatients[2]._id, // Mike Johnson
                initiatedBy: drWatson._id,
                audioUrl: '/uploads/sample_stenosis.wav',
                inputMethod: 'record',
                condition: 'Aortic Stenosis',
                severity: 'Severe',
                riskScore: 88,
                confidence: 92,
                features: [{ name: 'Crescendo-decrescendo murmur', contribution: 90 }, { name: 'S2 diminished', contribution: 10 }],
                reviewed: true,
                doctorRemarks: 'Severe AS, considering surgical intervention.'
            }
        ];

        for (const scr of screenings) {
            let existingScr = await Screening.findOne({ patientId: scr.patientId, audioUrl: scr.audioUrl });
            if (!existingScr) await Screening.create(scr);
        }
        console.log('Screenings seeded.');

        console.log('--- SEEDING COMPLETE ---');
        process.exit();
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
