const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundReason: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  next();
});

paymentSchema.methods.processRefund = function(amount, reason) {
  this.refundAmount = amount;
  this.refundReason = reason;
  this.paymentStatus = 'refunded';
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);