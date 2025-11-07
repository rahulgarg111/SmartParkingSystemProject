const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parkingSpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  referralInfo: {
    referralCode: {
      type: String,
      uppercase: true,
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    discountAmount: {
      type: Number,
      default: 0,
    }
  },
  surchargeInfo: {
    isPeakHour: {
      type: Boolean,
      default: false,
    },
    surchargeAmount: {
      type: Number,
      default: 0,
    },
    surchargePercentage: {
      type: Number,
      default: 0,
    }
  }
}, {
  timestamps: true,
});

bookingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.ceil((this.endTime - this.startTime) / (1000 * 60 * 60));
  }
  next();
});

bookingSchema.methods.calculateTotalAmount = function(pricePerHour) {
  return this.duration * pricePerHour;
};

module.exports = mongoose.model('Booking', bookingSchema);