const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/solarsavings')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Create Schema
const consultationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    consultationType: { type: String, required: true }
});

const Consultation = mongoose.model('Consultation', consultationSchema, 'consultations'); // explicitly name the collection 'consultations'

// POST route
app.post('/api/consultations', async (req, res) => {
    try {
        const { name, phone, email, date, time, consultationType } = req.body;

        // Validation
        if (!name || !phone || !email || !date || !time || !consultationType) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (isNaN(phone)) {
            return res.status(400).json({ message: 'Phone number must be numeric.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email must be valid.' });
        }

        const newConsultation = new Consultation({
            name, phone, email, date, time, consultationType
        });

        await newConsultation.save();
        res.status(201).json({ message: 'Your consultation request has been submitted successfully. Our solar expert will contact you soon.' });
    } catch (error) {
        console.error('Error saving consultation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
