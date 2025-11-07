const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartparking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

const authRoutes = require('./routes/auth');
const parkingSpaceRoutes = require('./routes/parkingSpaces');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const locationUpdateRoutes = require('./routes/locationUpdates');
const referralRoutes = require('./routes/referrals');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/parking-spaces', parkingSpaceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/location-updates', locationUpdateRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;