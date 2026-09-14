// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
    },
    age: { 
        type: Number
    },
    gender: { 
    type: String,
     enum: ['male', 'female', 'other']
    },
    bloodGroup: { 
    type: String
    },
    medicalHistory: [{ 
    condition: String, 
    diagnosedOn: Date,
    notes: String 
    }],
    address: { 
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);