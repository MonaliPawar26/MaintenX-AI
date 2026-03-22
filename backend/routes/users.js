'use strict';
const express = require('express');
const User    = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/users  — all users (managers/admins only in production)
router.get('/', async (req, res) => {
  try {
    const { role, teamId, availability } = req.query;
    const filter = { isActive: true };
    if (role)         filter.role         = role;
    if (teamId)       filter.teamId       = teamId;
    if (availability) filter.availability = availability;
    const users = await User.find(filter)
      .select('-password')
      .sort({ 'metrics.firstTimeFixRate': -1, currentLoad: 1 });
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/available — best available technicians for assignment
router.get('/available', async (req, res) => {
  try {
    const users = await User.find({ availability: { $in: ['available', 'busy'] }, isActive: true })
      .select('-password')
      .sort({ 'metrics.firstTimeFixRate': -1, currentLoad: 1 });
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/:id — update profile
router.put('/:id', async (req, res) => {
  try {
    const { password, googleId, ...safeFields } = req.body; // strip sensitive fields
    const user = await User.findByIdAndUpdate(req.params.id, { $set: safeFields }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/users/:id/availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { availability } = req.body;
    const valid = ['available', 'busy', 'on_leave', 'offline'];
    if (!valid.includes(availability))
      return res.status(400).json({ error: `availability must be one of: ${valid.join(', ')}` });
    const user = await User.findByIdAndUpdate(req.params.id, { availability }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
