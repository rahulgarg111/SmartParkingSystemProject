const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { bookingId, paymentMethod, metadata } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({ message: 'Booking ID and payment method are required' });
    }

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot process payment for cancelled booking' });
    }

    const existingPayment = await Payment.findOne({ 
      booking: bookingId, 
      paymentStatus: { $in: ['completed', 'processing'] }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this booking' });
    }

    let paymentStatus = 'processing';
    let gatewayResponse = {};

    try {
      gatewayResponse = await simulatePaymentGateway(paymentMethod, booking.totalAmount, metadata);
      paymentStatus = gatewayResponse.success ? 'completed' : 'failed';
    } catch (error) {
      paymentStatus = 'failed';
      gatewayResponse = { error: error.message };
    }

    const payment = new Payment({
      booking: bookingId,
      user: req.user._id,
      amount: booking.totalAmount,
      paymentMethod,
      paymentStatus,
      paymentGatewayResponse: gatewayResponse,
      metadata: metadata || {},
    });

    await payment.save();

    if (paymentStatus === 'completed') {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await booking.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('booking')
      .populate('user', 'name email');

    res.status(201).json({
      message: paymentStatus === 'completed' ? 'Payment processed successfully' : 'Payment failed',
      payment: populatedPayment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
      .populate('booking')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const payment = await Payment.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('booking');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed payments' });
    }

    if (payment.paymentStatus === 'refunded') {
      return res.status(400).json({ message: 'Payment is already refunded' });
    }

    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed payment amount' });
    }

    try {
      const refundResponse = await simulateRefundGateway(payment.transactionId, refundAmount, reason);
      
      if (refundResponse.success) {
        await payment.processRefund(refundAmount, reason || 'User requested refund');
        
        const booking = await Booking.findById(payment.booking._id);
        booking.paymentStatus = 'refunded';
        booking.status = 'cancelled';
        await booking.save();

        res.json({
          message: 'Refund processed successfully',
          refundAmount,
          refundResponse,
        });
      } else {
        res.status(400).json({ 
          message: 'Refund failed', 
          error: refundResponse.error 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Refund processing failed', 
        error: error.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/history/:bookingId', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.bookingId, 
      user: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const payments = await Payment.find({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });

    res.json({ 
      bookingId: req.params.bookingId,
      payments 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

async function simulatePaymentGateway(paymentMethod, amount, metadata = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1;
      resolve({
        success,
        transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        amount,
        paymentMethod,
        gateway: 'SimulatedGateway',
        timestamp: new Date().toISOString(),
        metadata,
        ...(success ? {} : { error: 'Payment declined by bank' })
      });
    }, 1000);
  });
}

async function simulateRefundGateway(transactionId, amount, reason) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05;
      resolve({
        success,
        refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        originalTransactionId: transactionId,
        amount,
        reason,
        gateway: 'SimulatedGateway',
        timestamp: new Date().toISOString(),
        ...(success ? {} : { error: 'Refund processing failed' })
      });
    }, 1000);
  });
}

module.exports = router;