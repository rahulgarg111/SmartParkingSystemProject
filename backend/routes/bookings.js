const express = require('express');
const Booking = require('../models/Booking');
const ParkingSpace = require('../models/ParkingSpace');
const User = require('../models/User');
const Referral = require('../models/Referral');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { parkingSpaceId, startTime, endTime, vehicleNumber, notes, referralCode } = req.body;

    if (!parkingSpaceId || !startTime || !endTime || !vehicleNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    if (parkingSpace.availableSpots <= 0) {
      return res.status(400).json({ message: 'No available spots' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    const existingBooking = await Booking.findOne({
      parkingSpace: parkingSpaceId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Parking space is already booked for this time slot' });
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60));
    let originalAmount = duration * parkingSpace.pricePerHour;
    let totalAmount = originalAmount;
    let discountAmount = 0;
    let surchargeAmount = 0;
    let referralInfo = null;
    let referrerReferral = null;
    
    // Check for peak hour surcharge (8 AM - 10 AM)
    const startHour = start.getHours();
    const isPeakHour = startHour >= 8 && startHour < 10;
    
    if (isPeakHour) {
      surchargeAmount = Math.round(originalAmount * 0.10 * 100) / 100; // 10% surcharge
      totalAmount = originalAmount + surchargeAmount;
    }

    // Handle referral code if provided
    if (referralCode) {
      referrerReferral = await Referral.findOne({ 
        referralCode: referralCode.toUpperCase(), 
        isActive: true 
      });
      
      if (referrerReferral) {
        // Check if this user hasn't been referred by this code before
        if (!referrerReferral.hasUserBeenReferred(req.user._id)) {
          // Apply 5% discount to the new user (based on total amount including surcharge)
          const amountForDiscount = originalAmount + surchargeAmount;
          discountAmount = Math.round(amountForDiscount * 0.05 * 100) / 100; // Round to 2 decimals
          totalAmount = amountForDiscount - discountAmount;
          
          referralInfo = {
            referralCode: referralCode.toUpperCase(),
            referrer: referrerReferral.referrer,
            discountAmount: discountAmount
          };
        }
      }
    }

    const booking = new Booking({
      user: req.user._id,
      parkingSpace: parkingSpaceId,
      startTime: start,
      endTime: end,
      duration,
      totalAmount,
      vehicleNumber,
      notes: notes || '',
      referralInfo: referralInfo,
      surchargeInfo: {
        isPeakHour: isPeakHour,
        surchargeAmount: surchargeAmount,
        surchargePercentage: isPeakHour ? 10 : 0
      }
    });

    await booking.save();

    // Handle referral rewards and user updates
    if (referralInfo && referrerReferral) {
      // Add this user to the referrer's referral list
      await referrerReferral.addReferredUser(req.user._id, booking._id, discountAmount);
      
      // Update referrer's rewards (they also get 5% of the original amount)
      const referrerReward = Math.round(originalAmount * 0.05 * 100) / 100;
      const referrer = await User.findById(referrerReferral.referrer);
      referrer.referralStats.totalRewards += referrerReward;
      referrer.referralStats.totalReferrals += 1;
      await referrer.save();
      
      // Update new user's savings
      const newUser = await User.findById(req.user._id);
      newUser.referralStats.totalSavings += discountAmount;
      await newUser.save();
    }

    // Mark user as having booked parking (to enable referral code generation)
    if (!req.user.hasBookedParking) {
      await User.findByIdAndUpdate(req.user._id, { hasBookedParking: true });
    }

    parkingSpace.availableSpots -= 1;
    await parkingSpace.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('parkingSpace', 'name location pricePerHour');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSpace', 'name location pricePerHour')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
      .populate('user', 'name email')
      .populate('parkingSpace', 'name location pricePerHour');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { startTime, endTime, vehicleNumber, notes } = req.body;
    
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot modify completed or cancelled booking' });
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      if (start < new Date()) {
        return res.status(400).json({ message: 'Start time cannot be in the past' });
      }

      const existingBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        parkingSpace: booking.parkingSpace,
        status: { $in: ['confirmed', 'active'] },
        $or: [
          { startTime: { $lt: end, $gte: start } },
          { endTime: { $gt: start, $lte: end } },
          { startTime: { $lte: start }, endTime: { $gte: end } }
        ]
      });

      if (existingBooking) {
        return res.status(400).json({ message: 'Parking space is already booked for this time slot' });
      }

      booking.startTime = start;
      booking.endTime = end;
      
      const duration = Math.ceil((end - start) / (1000 * 60 * 60));
      const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
      booking.duration = duration;
      booking.totalAmount = duration * parkingSpace.pricePerHour;
    }

    if (vehicleNumber) booking.vehicleNumber = vehicleNumber;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('parkingSpace', 'name location pricePerHour');

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    parkingSpace.availableSpots += 1;
    await parkingSpace.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('parkingSpace', 'name location pricePerHour');

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;