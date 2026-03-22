'use strict';
const express   = require('express');
const axios     = require('axios');
const Equipment = require('../models/Equipment');
const Request   = require('../models/Request');
const User      = require('../models/User');
const logger    = require('../config/logger');

const router     = express.Router();
const AI_URL     = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT) || 5000;

// ─── POST /api/ai/predict ─────────────────────────────────────
router.post('/predict', async (req, res) => {
  try {
    const { equipmentId, usage_hours, past_failures, age_months, last_maintenance_days } = req.body;
    let features = { usage_hours, past_failures, age_months, last_maintenance_days };

    if (equipmentId) {
      const eq = await Equipment.findById(equipmentId);
      if (eq) {
        features = {
          usage_hours: eq.usageHours, past_failures: eq.totalFailures,
          age_months: eq.installationAge || 0,
          last_maintenance_days: eq.lastMaintenanceDate
            ? Math.floor((Date.now() - new Date(eq.lastMaintenanceDate)) / 86400000) : 90
        };
      }
    }

    let prediction;
    try {
      const { data } = await axios.post(`${AI_URL()}/predict`, features, { timeout: AI_TIMEOUT });
      prediction = data;
    } catch {
      prediction = heuristicPredict(features);
    }

    if (equipmentId) {
      await Equipment.findByIdAndUpdate(equipmentId, {
        'aiRisk.level': prediction.risk_level, 'aiRisk.score': prediction.risk_score,
        'aiRisk.failureDays': prediction.estimated_failure_days,
        'aiRisk.confidence': prediction.confidence, 'aiRisk.lastUpdated': new Date()
      });
    }

    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/predict-all ─────────────────────────────────
router.post('/predict-all', async (req, res) => {
  try {
    const equipment = await Equipment.find({ status: 'active' });
    const results = await Promise.allSettled(equipment.map(async eq => {
      const features = {
        usage_hours: eq.usageHours, past_failures: eq.totalFailures,
        age_months: eq.installationAge || 0,
        last_maintenance_days: eq.lastMaintenanceDate
          ? Math.floor((Date.now() - new Date(eq.lastMaintenanceDate)) / 86400000) : 90
      };
      let pred;
      try {
        const { data } = await axios.post(`${AI_URL()}/predict`, features, { timeout: 3000 });
        pred = data;
      } catch { pred = heuristicPredict(features); }
      await Equipment.findByIdAndUpdate(eq._id, {
        'aiRisk.level': pred.risk_level, 'aiRisk.score': pred.risk_score,
        'aiRisk.failureDays': pred.estimated_failure_days,
        'aiRisk.confidence': pred.confidence, 'aiRisk.lastUpdated': new Date()
      });
      return { equipment: eq.name, id: eq._id, ...pred };
    }));
    const data = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    res.json({ success: true, data, updated: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    let parsed;
    try {
      const { data } = await axios.post(`${AI_URL()}/chat`, { message }, { timeout: AI_TIMEOUT });
      parsed = data;
    } catch { parsed = nlpFallback(message); }

    // Find matching equipment
    let equipment = null;
    if (parsed.equipment_hint) {
      equipment = await Equipment.findOne({
        name: { $regex: parsed.equipment_hint.split(' ')[0], $options: 'i' }, status: 'active'
      });
    }

    // Auto-create request
    let createdRequest = null;
    if (equipment) {
      createdRequest = await Request.create({
        subject: parsed.issue || message,
        type: 'Corrective', priority: parsed.priority || 'Medium', status: 'New',
        equipmentId: equipment._id, equipmentName: equipment.name,
        teamName: equipment.teamName, technicianName: equipment.technicianName,
        aiGenerated: true, aiExtractedIssue: parsed.issue,
        aiConfidence: parsed.confidence,
        statusHistory: [{ status: 'New', changedAt: new Date(), note: 'Created by AI chatbot' }]
      });
      await Equipment.findByIdAndUpdate(equipment._id, { $inc: { totalFailures: 1 } });
    }

    res.json({
      success: true,
      data: {
        parsed, equipment: equipment ? { id: equipment._id, name: equipment.name } : null,
        request: createdRequest,
        message: createdRequest
          ? `✅ Ticket #MX-${createdRequest._id.toString().slice(-6).toUpperCase()} created for ${equipment.name}`
          : '⚠️ Could not identify equipment. Please name the equipment explicitly.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/ai/insights ─────────────────────────────────────
router.get('/insights', async (req, res) => {
  try {
    const [equipment, requests] = await Promise.all([Equipment.find({ status: 'active' }), Request.find()]);
    const insights = buildInsights(equipment, requests);
    try {
      const { data } = await axios.post(`${AI_URL()}/insights`,
        { equipment_count: equipment.length, request_count: requests.length }, { timeout: 3000 });
      insights.push(...(data.insights || []));
    } catch {}
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/assign ──────────────────────────────────────
router.post('/assign', async (req, res) => {
  try {
    const { equipmentId, priority } = req.body;
    const eq = await Equipment.findById(equipmentId);
    if (!eq) return res.status(404).json({ error: 'Equipment not found' });
    const techs = await User.find({
      teamName: eq.teamName, availability: { $in: ['available', 'busy'] }, isActive: true
    }).sort({ 'metrics.firstTimeFixRate': -1, currentLoad: 1 });
    const best = techs[0];
    res.json({
      success: true,
      data: {
        technician: best || null,
        reason: best ? `Selected: ${(best.metrics.firstTimeFixRate * 100).toFixed(0)}% fix rate, ${best.currentLoad} active tasks` : 'No available technicians found'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────
function heuristicPredict({ usage_hours = 0, past_failures = 0, age_months = 0, last_maintenance_days = 30 }) {
  const score = Math.round(Math.min(100,
    (usage_hours / 5000) * 40 + past_failures * 6 + (age_months / 60) * 12 + (last_maintenance_days / 120) * 12
  ));
  const risk_level = score > 65 ? 'high' : score > 35 ? 'medium' : 'low';
  const estimated_failure_days = risk_level === 'high' ? Math.max(2, 15 - past_failures * 2) : risk_level === 'medium' ? 20 : 60;
  return { risk_level, risk_score: score, estimated_failure_days, confidence: 72 + Math.floor(Math.random() * 20), model: 'heuristic' };
}

function nlpFallback(message) {
  const m = message.toLowerCase();
  const eqMap = { printer: 'Printer', cnc: 'CNC Machine', server: 'Server Rack', conveyor: 'Conveyor Belt', ac: 'Office AC', electrical: 'Electrical Panel' };
  let equipment_hint = null;
  for (const [k, v] of Object.entries(eqMap)) { if (m.includes(k)) { equipment_hint = v; break; } }
  const priority = /urgent|critical|not working|broken|down|fail|crash|emergency/.test(m) ? 'High' : /minor|slight|slow/.test(m) ? 'Low' : 'Medium';
  return { issue: message, equipment_hint, priority, confidence: equipment_hint ? 85 : 60, model: 'heuristic-nlp' };
}

function buildInsights(equipment, requests) {
  const insights = [];
  const corrective = requests.filter(r => r.type === 'Corrective');
  const avg = corrective.length / Math.max(equipment.length, 1);
  equipment.forEach(eq => {
    const rate = requests.filter(r => r.equipmentName === eq.name).length / Math.max(avg, 0.1);
    if (rate > 1.5) insights.push({ type: 'warning', icon: '📉', text: `${eq.name} has ${Math.round((rate - 1) * 100)}% higher failure rate than fleet average. Consider scheduled deep inspection.`, badge: 'CRITICAL' });
  });
  const overdue = requests.filter(r => r.overdue);
  if (overdue.length) insights.push({ type: 'danger', icon: '⏰', text: `${overdue.length} overdue maintenance task${overdue.length > 1 ? 's' : ''} require immediate scheduling to maintain compliance.`, badge: 'URGENT' });
  const highRisk = equipment.filter(e => e.aiRisk?.level === 'high');
  if (highRisk.length) insights.push({ type: 'warning', icon: '🔴', text: `${highRisk.length} asset${highRisk.length > 1 ? 's' : ''} in HIGH risk zone: ${highRisk.map(e => e.name).join(', ')}. Immediate action recommended.`, badge: 'ACTION' });
  return insights;
}

module.exports = router;
