import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['doctor', 'patient'],
        default: 'patient',
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    specialization: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    licenseNumber: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    clinicName: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
