const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  referredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    referredAt: {
      type: Date,
      default: Date.now,
    }
  }],
  totalRewards: {
    type: Number,
    default: 0,
  },
  totalReferrals: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Generate a unique referral code
referralSchema.statics.generateReferralCode = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Create code from user's name and random characters
  const namePrefix = user.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  let referralCode = namePrefix + randomSuffix;
  
  // Ensure uniqueness
  let existingReferral = await this.findOne({ referralCode });
  let counter = 1;
  
  while (existingReferral) {
    referralCode = namePrefix + randomSuffix + counter;
    existingReferral = await this.findOne({ referralCode });
    counter++;
  }
  
  return referralCode;
};

// Add a referred user to the referral
referralSchema.methods.addReferredUser = function(userId, bookingId, discountAmount) {
  this.referredUsers.push({
    user: userId,
    booking: bookingId,
    discountAmount: discountAmount
  });
  
  this.totalReferrals += 1;
  this.totalRewards += discountAmount;
  
  return this.save();
};

// Check if user has already been referred by this code
referralSchema.methods.hasUserBeenReferred = function(userId) {
  return this.referredUsers.some(ref => ref.user.toString() === userId.toString());
};

module.exports = mongoose.model('Referral', referralSchema);