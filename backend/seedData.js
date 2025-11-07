const mongoose = require('mongoose');
const ParkingSpace = require('./models/ParkingSpace');
const User = require('./models/User');

const seedParkingSpaces = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartparking');
    
    // Create a sample owner user if doesn't exist
    let owner = await User.findOne({ email: 'owner@example.com' });
    if (!owner) {
      owner = new User({
        name: 'Parking Owner',
        email: 'owner@example.com',
        password: 'password123'
      });
      await owner.save();
    }

    // Clear existing parking spaces
    await ParkingSpace.deleteMany({});

    const sampleSpaces = [
      {
        name: 'Downtown Mall Parking',
        location: {
          address: '123 Main St, Downtown',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        capacity: 50,
        availableSpots: 35,
        pricePerHour: 5,
        isAvailable: true,
        owner: owner._id
      },
      {
        name: 'City Center Garage',
        location: {
          address: '456 Center Ave, City',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        capacity: 100,
        availableSpots: 80,
        pricePerHour: 8,
        isAvailable: true,
        owner: owner._id
      },
      {
        name: 'Airport Terminal Parking',
        location: {
          address: '789 Airport Rd, Terminal 1',
          coordinates: { lat: 40.6413, lng: -73.7781 }
        },
        capacity: 200,
        availableSpots: 0,
        pricePerHour: 12,
        isAvailable: false,
        owner: owner._id
      },
      {
        name: 'Business District Lot',
        location: {
          address: '321 Business Blvd, District',
          coordinates: { lat: 40.7505, lng: -73.9934 }
        },
        capacity: 75,
        availableSpots: 60,
        pricePerHour: 6,
        isAvailable: true,
        owner: owner._id
      },
      {
        name: 'Shopping Center Plaza',
        location: {
          address: '555 Shopping Center Dr, Westside',
          coordinates: { lat: 40.7282, lng: -74.0776 }
        },
        capacity: 80,
        availableSpots: 22,
        pricePerHour: 4,
        isAvailable: true,
        owner: owner._id
      },
      {
        name: 'University Campus Parking',
        location: {
          address: '789 University Ave, Campus',
          coordinates: { lat: 40.7831, lng: -73.9712 }
        },
        capacity: 150,
        availableSpots: 95,
        pricePerHour: 3,
        isAvailable: true,
        owner: owner._id
      },
      {
        name: 'Stadium Event Parking',
        location: {
          address: '101 Stadium Way, Sports District',
          coordinates: { lat: 40.8176, lng: -73.9782 }
        },
        capacity: 300,
        availableSpots: 0,
        pricePerHour: 15,
        isAvailable: false,
        owner: owner._id
      },
      {
        name: 'Medical Center Parking',
        location: {
          address: '234 Health Blvd, Medical District',
          coordinates: { lat: 40.7614, lng: -73.9776 }
        },
        capacity: 120,
        availableSpots: 45,
        pricePerHour: 7,
        isAvailable: true,
        owner: owner._id
      }
    ];

    await ParkingSpace.insertMany(sampleSpaces);
    console.log('Sample parking spaces created successfully!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
};

seedParkingSpaces();