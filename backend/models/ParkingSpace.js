const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      }
    }
  },
  capacity: {
    type: Number,
    required: true,
  },
  availableSpots: {
    type: Number,
    required: true,
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

parkingSpaceSchema.virtual('availabilityStatus').get(function() {
  return this.availableSpots > 0 ? 'Available' : 'Full';
});

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema);