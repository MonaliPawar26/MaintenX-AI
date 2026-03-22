'use strict';
const express    = require('express');
const { body, query } = require('express-validator');
const validate   = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const Equipment  = require('../models/Equipment');
const Request    = require('../models/Request');
const axios      = require('axios');
const logger     = require('../config/logger');

const router   = express.Router();
const AI_URL   = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT) || 5000;

// ─── GET /api/equipment ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { dept, status, risk, search, teamId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (dept)   filter.department       = dept;
    if (status) filter.status           = status;
    if (risk)   filter['aiRisk.level']  = risk;
    if (teamId) filter.teamId           = teamId;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } }
    ];

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Equipment.find(filter).sort({ 'aiRisk.score': -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Equipment.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/equipment/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const eq = await Equipment.findById(req.params.id).populate('teamId', 'name color');
    if (!eq) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ success: true, data: eq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/equipment ──────────────────────────────────────
router.post('/',
  body('name').trim().notEmpty().withMessage('Name required'),
  body('department').notEmpty().withMessage('Department required'),
  body('location').trim().notEmpty().withMessage('Location required'),
  validate,
  async (req, res) => {
    try {
      const { name, serialNumber, department, location, teamId, teamName, technicianId, technicianName, usageHours, notes, manufacturer, model } = req.body;
      const serial = serialNumber || `SN-${department.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const equipment = await Equipment.create({
        name, serialNumber: serial, department, location,
        teamId, teamName, technicianId, technicianName,
        usageHours: usageHours || 0, notes, manufacturer, model,
        createdBy: req.user?.userId
      });
      // Async: kick off initial AI prediction
      triggerPrediction(equipment._id, equipment).catch(() => {});
      res.status(201).json({ success: true, data: equipment });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: 'Serial number already exists.' });
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── PUT /api/equipment/:id ───────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(
      req.params.id, { ...req.body }, { new: true, runValidators: true }
    );
    if (!eq) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: eq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/equipment/:id ─────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!eq) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: eq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/equipment/:id ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!eq) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, message: 'Equipment deactivated', data: eq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/equipment/:id/history ──────────────────────────
router.get('/:id/history', async (req, res) => {
  try {
    const requests = await Request.find({ equipmentId: req.params.id })
      .sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/equipment/:id/predict ─────────────────────────
router.post('/:id/predict', async (req, res) => {
  try {
    const eq = await Equipment.findById(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Not found' });
    const prediction = await getPrediction(eq);
    eq.aiRisk = { ...prediction, lastUpdated: new Date() };
    await eq.save();
    res.json({ success: true, data: prediction, equipment: eq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────
async function getPrediction(eq) {
  const features = {
    usage_hours: eq.usageHours, past_failures: eq.totalFailures,
    age_months: eq.installationAge || 0,
    last_maintenance_days: eq.lastMaintenanceDate
      ? Math.floor((Date.now() - new Date(eq.lastMaintenanceDate)) / 86400000) : 90
  };
  try {
    const { data } = await axios.post(`${AI_URL()}/predict`, features, { timeout: AI_TIMEOUT });
    return { level: data.risk_level, score: data.risk_score, failureDays: data.estimated_failure_days, confidence: data.confidence };
  } catch {
    return heuristicPredict(features);
  }
}

function heuristicPredict({ usage_hours = 0, past_failures = 0, age_months = 0, last_maintenance_days = 30 }) {
  const score = Math.round(Math.min(100,
    (usage_hours / 5000) * 40 + past_failures * 6 + (age_months / 60) * 12 + (last_maintenance_days / 120) * 12
  ));
  const level       = score > 65 ? 'high' : score > 35 ? 'medium' : 'low';
  const failureDays = level === 'high' ? Math.max(2, 15 - past_failures * 2) : level === 'medium' ? 20 : 60;
  return { level, score, failureDays, confidence: 72 + Math.floor(Math.random() * 20) };
}

async function triggerPrediction(id, eq) {
  const pred = await getPrediction(eq);
  await Equipment.findByIdAndUpdate(id, { aiRisk: { ...pred, lastUpdated: new Date() } });
}

module.exports = router;
