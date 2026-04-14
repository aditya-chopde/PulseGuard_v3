import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Medicine from './models/Medicine.js'; // make sure extension is .js

mongoose.connect('mongodb://127.0.0.1:27017/pulseguard');

// 🔥 Convert comma-separated string → array
const toArray = (value) => {
  if (!value) return [];
  return value.split(',').map(item => item.trim());
};

const medicines = [];

fs.createReadStream('medicines_mongodb.csv')
  .pipe(csv())
  .on('data', (row) => {
    medicines.push({
      name: row.name,
      drugClass: row.drugClass,
      uses: toArray(row.uses),
      dosage: row.dosage,
      sideEffects: toArray(row.sideEffects),
      precautions: toArray(row.precautions)
    });
  })
  .on('end', async () => {
    try {
      const bulkOps = medicines.map(med => ({
        updateOne: {
          filter: { name: med.name }, // ✅ prevents duplicates
          update: { $set: med },
          upsert: true
        }
      }));

      await Medicine.bulkWrite(bulkOps);

      console.log('✅ Data imported without duplicates');
      mongoose.connection.close();
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  });