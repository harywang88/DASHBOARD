require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gps-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB error:', err));

// Location Schema
const locationSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        required: false
    },
    provider: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expire: 7776000 // TTL 90 hari
    }
});

const Location = mongoose.model('Location', locationSchema);

// Routes

// Update lokasi dari Android
app.post('/api/location/update', async (req, res) => {
    try {
        const { latitude, longitude, accuracy, provider, timestamp, deviceId } = req.body;
        
        // Gunakan deviceId dari request atau generate dari MAC address (bisa di-implement di Android)
        const id = deviceId || req.headers['x-device-id'] || 'unknown-device';

        const location = new Location({
            deviceId: id,
            latitude,
            longitude,
            accuracy,
            provider,
            timestamp: new Date(timestamp)
        });

        await location.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating location',
            error: error.message
        });
    }
});

// Get latest location untuk device tertentu
app.get('/api/location/latest/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        const location = await Location.findOne({ deviceId })
            .sort({ timestamp: -1 })
            .exec();

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching location',
            error: error.message
        });
    }
});

// Get location history untuk device tertentu
app.get('/api/location/history/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const days = parseInt(req.query.days) || 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const locations = await Location.find({
            deviceId,
            timestamp: { $gte: startDate }
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();

        res.json({
            success: true,
            count: locations.length,
            data: locations
        });
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching location history',
            error: error.message
        });
    }
});

// Get semua devices yang aktif
app.get('/api/devices/active', async (req, res) => {
    try {
        // Ambil devices yang memiliki location dalam 1 jam terakhir
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const devices = await Location.aggregate([
            {
                $match: {
                    timestamp: { $gte: oneHourAgo }
                }
            },
            {
                $group: {
                    _id: '$deviceId',
                    lastLocation: { $first: '$$ROOT' },
                    updateCount: { $sum: 1 }
                }
            },
            {
                $sort: { 'lastLocation.timestamp': -1 }
            }
        ]);

        res.json({
            success: true,
            count: devices.length,
            data: devices
        });
    } catch (error) {
        console.error('Error fetching active devices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active devices',
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'GPS Tracking Backend is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`GPS Tracking Backend running on http://localhost:${PORT}`);
});

module.exports = app;
