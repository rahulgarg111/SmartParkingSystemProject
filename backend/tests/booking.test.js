const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Booking = require('../models/Booking');
const ParkingSpace = require('../models/ParkingSpace');
const User = require('../models/User');

const JWT_SECRET = 'shhhhh';

describe('Booking API', () => {
  let testUser, testSpace, authToken;

  beforeAll(async () => {
    const testDb = 'mongodb://localhost:27017/smartparking_test';
    await mongoose.connect(testDb);
  });

  beforeEach(async () => {
    await Booking.deleteMany({});
    await ParkingSpace.deleteMany({});
    await User.deleteMany({});
    
    testUser = new User({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123'
    });
    await testUser.save();

    authToken = jwt.sign({ userId: testUser._id }, JWT_SECRET, { expiresIn: '24h' });

    testSpace = new ParkingSpace({
      name: 'Test Parking',
      location: {
        address: '123 Test St',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      capacity: 50,
      availableSpots: 25,
      pricePerHour: 5,
      isAvailable: true,
      owner: testUser._id
    });
    await testSpace.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/bookings', () => {
    test('should create a new booking', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 3);

      const bookingData = {
        parkingSpaceId: testSpace._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleNumber: 'ABC-123',
        notes: 'Test booking'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.booking.vehicleNumber).toBe('ABC-123');
      expect(response.body.booking.duration).toBe(2);
      expect(response.body.booking.totalAmount).toBe(10);
    });

    test('should not create booking without authentication', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 3);

      const bookingData = {
        parkingSpaceId: testSpace._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleNumber: 'ABC-123'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });

    test('should not create booking with past start time', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 1);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 1);

      const bookingData = {
        parkingSpaceId: testSpace._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleNumber: 'ABC-123'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe('Start time cannot be in the past');
    });

    test('should not create booking when no spots available', async () => {
      testSpace.availableSpots = 0;
      await testSpace.save();

      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 3);

      const bookingData = {
        parkingSpaceId: testSpace._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleNumber: 'ABC-123'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe('No available spots');
    });
  });

  describe('GET /api/bookings', () => {
    test('should get user bookings', async () => {
      const booking = new Booking({
        user: testUser._id,
        parkingSpace: testSpace._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 2,
        totalAmount: 10,
        vehicleNumber: 'ABC-123'
      });
      await booking.save();

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0].vehicleNumber).toBe('ABC-123');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    test('should cancel a booking', async () => {
      const booking = new Booking({
        user: testUser._id,
        parkingSpace: testSpace._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 2,
        totalAmount: 10,
        vehicleNumber: 'ABC-123',
        status: 'pending'
      });
      await booking.save();

      const response = await request(app)
        .delete(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Booking cancelled successfully');
      
      const cancelledBooking = await Booking.findById(booking._id);
      expect(cancelledBooking.status).toBe('cancelled');
    });
  });
});