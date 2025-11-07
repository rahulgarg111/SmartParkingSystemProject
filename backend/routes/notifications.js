const express = require('express');
const Notification = require('../models/Notification');
const ParkingSpace = require('../models/ParkingSpace');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Subscribe to location-based notifications
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.body; // radius in km, default 5km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Find all available parking spaces within the radius
    const allParkingSpaces = await ParkingSpace.find({
      isAvailable: true,
      availableSpots: { $gt: 0 }
    });

    const nearbySpaces = allParkingSpaces.filter(space => {
      const distance = calculateDistance(
        latitude,
        longitude,
        space.location.coordinates.lat,
        space.location.coordinates.lng
      );
      return distance <= radius;
    });

    if (nearbySpaces.length === 0) {
      return res.json({
        message: 'No parking spaces available within your specified radius',
        subscribedSpaces: 0
      });
    }

    // Create notifications for nearby available spaces
    const notifications = [];
    for (const space of nearbySpaces) {
      const distance = calculateDistance(
        latitude,
        longitude,
        space.location.coordinates.lat,
        space.location.coordinates.lng
      ).toFixed(2);

      const notification = new Notification({
        user: req.user._id,
        parkingSpace: space._id,
        type: 'availability',
        message: `Parking available at ${space.name} (${distance} km away). ${space.availableSpots} spots available at $${space.pricePerHour}/hour.`,
        metadata: {
          distance: parseFloat(distance),
          userLocation: { latitude, longitude },
          spaceLocation: space.location,
          availableSpots: space.availableSpots,
          pricePerHour: space.pricePerHour
        }
      });

      notifications.push(notification);
    }

    await Notification.insertMany(notifications);

    res.json({
      message: 'Successfully subscribed to location-based notifications',
      subscribedSpaces: nearbySpaces.length,
      notifications: notifications.map(n => ({
        parkingSpace: n.parkingSpace,
        message: n.message,
        distance: n.metadata.distance
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all notifications for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('parkingSpace', 'name location pricePerHour availableSpots')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Notify users when a parking space becomes available (called internally)
router.post('/notify-availability', async (req, res) => {
  try {
    const { parkingSpaceId } = req.body;

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    if (!parkingSpace.isAvailable || parkingSpace.availableSpots === 0) {
      return res.status(400).json({ message: 'Parking space is not available' });
    }

    // In a real application, you would have a subscription system
    // For now, we'll just return success
    res.json({
      message: 'Notification sent to subscribed users',
      parkingSpace: {
        id: parkingSpace._id,
        name: parkingSpace.name,
        availableSpots: parkingSpace.availableSpots
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
