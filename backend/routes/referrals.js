const express = require('express');
const Referral = require('../models/Referral');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get user's referral code (create if doesn't exist)
router.get('/my-code', authMiddleware, async (req, res) => {
  try {
    // Check if user has booked parking (required to get referral code)
    const user = await User.findById(req.user._id);
    if (!user.hasBookedParking) {
      return res.status(400).json({ 
        message: 'You need to complete at least one parking booking to get a referral code' 
      });
    }

    // Check if user already has a referral code
    let referral = await Referral.findOne({ referrer: req.user._id });
    
    if (!referral) {
      // Create new referral code
      const referralCode = await Referral.generateReferralCode(req.user._id);
      referral = new Referral({
        referrer: req.user._id,
        referralCode: referralCode
      });
      await referral.save();
    }

    res.json({
      success: true,
      data: {
        referralCode: referral.referralCode,
        totalRewards: referral.totalRewards,
        totalReferrals: referral.totalReferrals,
        isActive: referral.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const referral = await Referral.findOne({ referrer: req.user._id })
      .populate('referredUsers.user', 'name email')
      .populate('referredUsers.booking', 'totalAmount createdAt');

    res.json({
      success: true,
      data: {
        userStats: user.referralStats,
        referralCode: referral ? referral.referralCode : null,
        referredUsers: referral ? referral.referredUsers : [],
        hasBookedParking: user.hasBookedParking
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate a referral code
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { referralCode } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const referral = await Referral.findOne({ 
      referralCode: referralCode.toUpperCase(), 
      isActive: true 
    }).populate('referrer', 'name email');

    if (!referral) {
      return res.status(404).json({ 
        message: 'Invalid referral code',
        valid: false 
      });
    }

    // Check if user is trying to use their own referral code
    if (referral.referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot use your own referral code',
        valid: false 
      });
    }

    // Check if user has already been referred by this code
    if (referral.hasUserBeenReferred(req.user._id)) {
      return res.status(400).json({ 
        message: 'You have already used this referral code',
        valid: false 
      });
    }

    res.json({
      message: 'Valid referral code! You will get 5% discount.',
      valid: true,
      data: {
        referralCode: referral.referralCode,
        referrerName: referral.referrer.name,
        discountPercentage: 5
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topReferrers = await Referral.find({ isActive: true })
      .populate('referrer', 'name')
      .sort({ totalReferrals: -1, totalRewards: -1 })
      .limit(10);

    const leaderboard = topReferrers.map((referral, index) => ({
      rank: index + 1,
      name: referral.referrer.name,
      totalReferrals: referral.totalReferrals,
      totalRewards: referral.totalRewards,
      referralCode: referral.referralCode
    }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all referral data
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // Simple admin check (you can implement proper admin roles)
    const user = await User.findById(req.user._id);
    if (user.email !== 'admin@example.com') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const referrals = await Referral.find()
      .populate('referrer', 'name email')
      .populate('referredUsers.user', 'name email')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.reduce((sum, ref) => sum + ref.totalReferrals, 0);
    const totalRewards = referrals.reduce((sum, ref) => sum + ref.totalRewards, 0);

    res.json({
      success: true,
      data: {
        referrals,
        summary: {
          totalReferralCodes: referrals.length,
          totalReferrals,
          totalRewards: Math.round(totalRewards * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;