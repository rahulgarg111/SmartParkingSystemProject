const express = require('express');
const ParkingSpace = require('../models/ParkingSpace');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Real-time location and availability update endpoint
router.post('/update-availability', authMiddleware, async (req, res) => {
  try {
    const { parkingSpaceId, availableSpots, coordinates } = req.body;

    if (!parkingSpaceId) {
      return res.status(400).json({ message: 'Parking space ID is required' });
    }

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    // Check if the user is the owner of the parking space
    if (parkingSpace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this parking space' });
    }

    // Update available spots if provided
    if (typeof availableSpots === 'number') {
      if (availableSpots < 0 || availableSpots > parkingSpace.capacity) {
        return res.status(400).json({ 
          message: `Available spots must be between 0 and ${parkingSpace.capacity}` 
        });
      }
      parkingSpace.availableSpots = availableSpots;
      parkingSpace.isAvailable = availableSpots > 0;
    }

    // Update coordinates if provided
    if (coordinates && coordinates.lat && coordinates.lng) {
      parkingSpace.location.coordinates.lat = coordinates.lat;
      parkingSpace.location.coordinates.lng = coordinates.lng;
    }

    parkingSpace.updatedAt = new Date();
    await parkingSpace.save();

    res.json({
      message: 'Location and availability updated successfully',
      parkingSpace: {
        id: parkingSpace._id,
        name: parkingSpace.name,
        availableSpots: parkingSpace.availableSpots,
        capacity: parkingSpace.capacity,
        isAvailable: parkingSpace.isAvailable,
        location: parkingSpace.location,
        updatedAt: parkingSpace.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simulate real-time availability changes
router.post('/simulate-updates', async (req, res) => {
  try {
    const { duration = 30 } = req.body; // Duration in seconds, default 30 seconds
    
    if (duration > 300) { // Max 5 minutes
      return res.status(400).json({ message: 'Duration cannot exceed 300 seconds' });
    }

    const parkingSpaces = await ParkingSpace.find({ isAvailable: true });
    
    if (parkingSpaces.length === 0) {
      return res.status(400).json({ message: 'No parking spaces available for simulation' });
    }

    let simulationActive = true;
    const startTime = Date.now();

    const simulate = async () => {
      if (!simulationActive || (Date.now() - startTime) > (duration * 1000)) {
        return;
      }

      try {
        // Randomly select a parking space
        const randomSpace = parkingSpaces[Math.floor(Math.random() * parkingSpaces.length)];
        const currentSpace = await ParkingSpace.findById(randomSpace._id);
        
        if (!currentSpace) return;

        // Simulate availability changes
        const change = Math.floor(Math.random() * 5) - 2; // Random change between -2 and +2
        let newAvailableSpots = currentSpace.availableSpots + change;
        
        // Ensure it stays within bounds
        newAvailableSpots = Math.max(0, Math.min(newAvailableSpots, currentSpace.capacity));
        
        currentSpace.availableSpots = newAvailableSpots;
        currentSpace.isAvailable = newAvailableSpots > 0;
        
        await currentSpace.save();
        
        console.log(`Simulation: ${currentSpace.name} updated to ${newAvailableSpots} spots`);
        
        // Schedule next update
        setTimeout(simulate, Math.random() * 5000 + 2000); // Random interval 2-7 seconds
      } catch (error) {
        console.error('Simulation error:', error);
      }
    };

    // Start simulation
    simulate();

    // Stop simulation after duration
    setTimeout(() => {
      simulationActive = false;
    }, duration * 1000);

    res.json({
      message: `Real-time simulation started for ${duration} seconds`,
      duration,
      affectedSpaces: parkingSpaces.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get real-time updates for a specific parking space
router.get('/status/:parkingSpaceId', async (req, res) => {
  try {
    const { parkingSpaceId } = req.params;
    
    const parkingSpace = await ParkingSpace.findById(parkingSpaceId)
      .populate('owner', 'name email');
    
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    res.json({
      success: true,
      data: {
        id: parkingSpace._id,
        name: parkingSpace.name,
        availableSpots: parkingSpace.availableSpots,
        capacity: parkingSpace.capacity,
        isAvailable: parkingSpace.isAvailable,
        location: parkingSpace.location,
        pricePerHour: parkingSpace.pricePerHour,
        lastUpdated: parkingSpace.updatedAt,
        owner: parkingSpace.owner
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk update multiple parking spaces (for simulation)
router.post('/bulk-update', authMiddleware, async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    const results = [];
    
    for (const update of updates) {
      const { parkingSpaceId, availableSpots, coordinates } = update;
      
      try {
        const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
        
        if (!parkingSpace) {
          results.push({ 
            parkingSpaceId, 
            success: false, 
            error: 'Parking space not found' 
          });
          continue;
        }

        // Check ownership
        if (parkingSpace.owner.toString() !== req.user._id.toString()) {
          results.push({ 
            parkingSpaceId, 
            success: false, 
            error: 'Not authorized' 
          });
          continue;
        }

        // Update fields
        if (typeof availableSpots === 'number') {
          parkingSpace.availableSpots = Math.max(0, Math.min(availableSpots, parkingSpace.capacity));
          parkingSpace.isAvailable = parkingSpace.availableSpots > 0;
        }

        if (coordinates && coordinates.lat && coordinates.lng) {
          parkingSpace.location.coordinates = coordinates;
        }

        await parkingSpace.save();
        
        results.push({ 
          parkingSpaceId, 
          success: true, 
          availableSpots: parkingSpace.availableSpots 
        });
      } catch (error) {
        results.push({ 
          parkingSpaceId, 
          success: false, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Bulk update completed',
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;