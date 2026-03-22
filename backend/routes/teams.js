'use strict';
const express = require('express');
const Team    = require('../models/Team');
const User    = require('../models/User');

const router = express.Router();

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('members', 'name email role availability metrics currentLoad avatar')
      .populate('leadId', 'name email');
    res.json({ success: true, data: teams });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role availability metrics currentLoad')
      .populate('leadId', 'name email');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/teams
router.post('/', async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/teams/:id
router.put('/:id', async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
