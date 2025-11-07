const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const ParkingSpace = require('../models/ParkingSpace');
const User = require('../models/User');

describe('Parking Space API', () => {
  let testUser;

  beforeAll(async () => {
    const testDb = 'mongodb://localhost:27017/smartparking_test';
    await mongoose.connect(testDb);
  });

  beforeEach(async () => {
    await ParkingSpace.deleteMany({});
    await User.deleteMany({});
    
    testUser = new User({
      name: 'Test Owner',
      email: 'owner@test.com',
      password: 'password123'
    });
    await testUser.save();

    const sampleSpaces = [
      {
        name: 'Test Parking 1',
        location: {
          address: '123 Test St',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        capacity: 50,
        availableSpots: 25,
        pricePerHour: 5,
        isAvailable: true,
        owner: testUser._id
      },
      {
        name: 'Test Parking 2',
        location: {
          address: '456 Test Ave',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        capacity: 30,
        availableSpots: 0,
        pricePerHour: 8,
        isAvailable: false,
        owner: testUser._id
      }
    ];

    await ParkingSpace.insertMany(sampleSpaces);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/parking-spaces', () => {
    test('should get all parking spaces', async () => {
      const response = await request(app)
        .get('/api/parking-spaces')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });

  describe('GET /api/parking-spaces/available', () => {
    test('should get only available parking spaces', async () => {
      const response = await request(app)
        .get('/api/parking-spaces/available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Parking 1');
      expect(response.body.data[0].isAvailable).toBe(true);
      expect(response.body.data[0].availableSpots).toBeGreaterThan(0);
    });
  });

  describe('GET /api/parking-spaces/:id', () => {
    test('should get parking space by ID', async () => {
      const spaces = await ParkingSpace.find();
      const spaceId = spaces[0]._id;

      const response = await request(app)
        .get(`/api/parking-spaces/${spaceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(spaceId.toString());
      expect(response.body.data.name).toBe('Test Parking 1');
    });

    test('should return 404 for non-existent parking space', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/parking-spaces/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Parking space not found');
    });
  });
});