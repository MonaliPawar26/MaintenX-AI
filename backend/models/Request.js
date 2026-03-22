'use strict';
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String },
  note:      { type: String }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  subject: {
    type: String, required: [true, 'Subject is required'], trim: true, maxlength: [300, 'Subject too long']
  },
  description:  { type: String, trim: true, maxlength: 5000 },
  type: {
    type: String, required: true,
    enum: ['Corrective', 'Preventive', 'Emergency', 'Inspection', 'Calibration', 'Upgrade']
  },
  priority: {
    type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium', index: true
  },
  status: {
    type: String, enum: ['New', 'In Progress', 'On Hold', 'Repaired', 'Scrap'], default: 'New', index: true
  },

  // Equipment (denormalised)
  equipmentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
  equipmentName: { type: String },

  // Team / Technician (denormalised)
  teamId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName:       { type: String },
  technicianId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String },

  // Scheduling
  scheduledDate:  { type: Date, index: true },
  estimatedHours: { type: Number, default: 1, min: 0 },
  actualHours:    { type: Number, min: 0 },
  completedDate:  { type: Date },

  // AI metadata
  aiGenerated:      { type: Boolean, default: false },
  aiExtractedIssue: { type: String },
  aiPriority:       { type: String },
  aiConfidence:     { type: Number },
  aiAssigned:       { type: Boolean, default: false },

  // Cost tracking
  partsCost:  { type: Number, default: 0, min: 0 },
  laborCost:  { type: Number, default: 0, min: 0 },
  totalCost:  { type: Number, default: 0, min: 0 },

  statusHistory: [statusHistorySchema],
  attachments:   [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  overdue:       { type: Boolean, default: false, index: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-compute overdue flag and totalCost before save
requestSchema.pre('save', function (next) {
  if (this.scheduledDate && !['Repaired', 'Scrap'].includes(this.status)) {
    this.overdue = new Date() > new Date(this.scheduledDate);
  } else {
    this.overdue = false;
  }
  this.totalCost = (this.partsCost || 0) + (this.laborCost || 0);
  next();
});

// Push to statusHistory on status update via findOneAndUpdate
requestSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const newStatus = (update.$set && update.$set.status) || update.status;
  if (newStatus) {
    if (!update.$push) update.$push = {};
    update.$push.statusHistory = { status: newStatus, changedAt: new Date() };
    if (['Repaired', 'Scrap'].includes(newStatus) && !update.completedDate) {
      if (!update.$set) update.$set = {};
      update.$set.completedDate = new Date();
      update.$set.overdue = false;
    }
  }
  next();
});

requestSchema.index({ status: 1, priority: 1 });
requestSchema.index({ scheduledDate: 1, overdue: 1 });
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
