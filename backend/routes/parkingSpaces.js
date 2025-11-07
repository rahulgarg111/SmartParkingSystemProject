const express = require('express');
const ParkingSpace = require('../models/ParkingSpace');
const router = express.Router();

// Get all parking spaces
router.get('/', async (req, res) => {
  try {
    const parkingSpaces = await ParkingSpace.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: parkingSpaces,
      count: parkingSpaces.length,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get available parking spaces only
router.get('/available', async (req, res) => {
  try {
    const availableSpaces = await ParkingSpace.find({ 
      isAvailable: true, 
      availableSpots: { $gt: 0 } 
    })
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: availableSpaces,
      count: availableSpaces.length,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get parking space by ID
router.get('/:id', async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id)
      .populate('owner', 'name email');

    if (!parkingSpace) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking space not found' 
      });
    }

    res.json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;