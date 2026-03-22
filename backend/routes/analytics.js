'use strict';
const express   = require('express');
const Equipment = require('../models/Equipment');
const Request   = require('../models/Request');
const User      = require('../models/User');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const [totalEquipment, activeRequests, overdueRequests, aiAlerts, completedThisMonth, totalUsers] = await Promise.all([
      Equipment.countDocuments({ status: 'active' }),
      Request.countDocuments({ status: { $in: ['New', 'In Progress'] } }),
      Request.countDocuments({ overdue: true }),
      Equipment.countDocuments({ 'aiRisk.level': 'high' }),
      Request.countDocuments({ status: 'Repaired', completedDate: { $gte: new Date(new Date().setDate(1)) } }),
      User.countDocuments({ isActive: true })
    ]);
    res.json({ success: true, data: { totalEquipment, activeRequests, overdueRequests, aiAlerts, completedThisMonth, totalUsers } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/by-team
router.get('/by-team', async (req, res) => {
  try {
    const data = await Request.aggregate([
      { $group: { _id: '$teamName', count: { $sum: 1 }, overdue: { $sum: { $cond: ['$overdue', 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Repaired'] }, 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/by-equipment
router.get('/by-equipment', async (req, res) => {
  try {
    const data = await Request.aggregate([
      { $group: { _id: '$equipmentName', count: { $sum: 1 }, corrective: { $sum: { $cond: [{ $eq: ['$type', 'Corrective'] }, 1, 0] } } } },
      { $sort: { count: -1 } }, { $limit: 10 }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/trend
router.get('/trend', async (req, res) => {
  try {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const data = await Request.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/risk-distribution
router.get('/risk-distribution', async (req, res) => {
  try {
    const data = await Equipment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$aiRisk.level', count: { $sum: 1 }, avgScore: { $avg: '$aiRisk.score' } } }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/kanban-stats
router.get('/kanban-stats', async (req, res) => {
  try {
    const data = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/mttr  (Mean Time To Repair)
router.get('/mttr', async (req, res) => {
  try {
    const data = await Request.aggregate([
      { $match: { status: 'Repaired', completedDate: { $exists: true } } },
      { $project: { resolutionMs: { $subtract: ['$completedDate', '$createdAt'] }, teamName: 1, type: 1 } },
      { $group: { _id: '$teamName', avgMs: { $avg: '$resolutionMs' }, count: { $sum: 1 } } },
      { $project: { team: '$_id', avgHours: { $divide: ['$avgMs', 3600000] }, count: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
