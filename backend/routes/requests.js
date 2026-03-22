'use strict';
const express   = require('express');
const { body }  = require('express-validator');
const validate  = require('../middleware/validate');
const Request   = require('../models/Request');
const Equipment = require('../models/Equipment');

const router = express.Router();

// ─── GET /api/requests ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, priority, team, equipment, overdue, type, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status)    filter.status        = { $in: status.split(',') };
    if (priority)  filter.priority      = priority;
    if (type)      filter.type          = type;
    if (team)      filter.teamName      = { $regex: team,      $options: 'i' };
    if (equipment) filter.equipmentName = { $regex: equipment, $options: 'i' };
    if (overdue === 'true') filter.overdue = true;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Request.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('equipmentId', 'name serialNumber department aiRisk'),
      Request.countDocuments(filter)
    ]);
    res.json({ success: true, data, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/requests/kanban ─────────────────────────────────
router.get('/kanban', async (req, res) => {
  try {
    const all = await Request.find().sort({ priority: 1, createdAt: -1 })
      .populate('equipmentId', 'name serialNumber aiRisk');
    const board = { 'New': [], 'In Progress': [], 'On Hold': [], 'Repaired': [], 'Scrap': [] };
    all.forEach(r => (board[r.status] || (board[r.status] = [])).push(r));
    res.json({ success: true, data: board });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/requests/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const r = await Request.findById(req.params.id)
      .populate('equipmentId', 'name serialNumber department location');
    if (!r) return res.status(404).json({ error: 'Request not found' });
    res.json({ success: true, data: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/requests ──────────────────────────────────────
router.post('/',
  body('subject').trim().notEmpty().withMessage('Subject required'),
  body('type').notEmpty().withMessage('Type required'),
  body('equipmentId').notEmpty().withMessage('Equipment ID required'),
  validate,
  async (req, res) => {
    try {
      const { subject, description, type, priority, status, equipmentId, equipmentName,
              teamId, teamName, technicianId, technicianName, scheduledDate, estimatedHours,
              aiGenerated, aiExtractedIssue, aiConfidence } = req.body;

      let eqName = equipmentName;
      if (!eqName) {
        const eq = await Equipment.findById(equipmentId);
        eqName = eq?.name || 'Unknown';
        if (type === 'Corrective') {
          await Equipment.findByIdAndUpdate(equipmentId, { $inc: { totalFailures: 1 } });
        }
      }

      const request = await Request.create({
        subject, description, type, priority: priority || 'Medium',
        status: status || 'New', equipmentId, equipmentName: eqName,
        teamId, teamName, technicianId, technicianName,
        scheduledDate, estimatedHours,
        aiGenerated: !!aiGenerated, aiExtractedIssue, aiConfidence,
        statusHistory: [{ status: status || 'New', changedAt: new Date(), note: aiGenerated ? 'Created by AI chatbot' : 'Created' }],
        createdBy: req.user?.userId
      });
      res.status(201).json({ success: true, data: request });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── PUT /api/requests/:id ────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!request) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/requests/:id/status ──────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, changedBy, note } = req.body;
    const valid = ['New', 'In Progress', 'On Hold', 'Repaired', 'Scrap'];
    if (!valid.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });

    const update = {
      $set: { status },
      $push: { statusHistory: { status, changedAt: new Date(), changedBy: changedBy || req.user?.name || 'User', note } }
    };
    if (['Repaired', 'Scrap'].includes(status)) {
      update.$set.completedDate = new Date();
      update.$set.overdue = false;
    }
    const request = await Request.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!request) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/requests/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
