'use strict';
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Equipment name is required'], trim: true, maxlength: [200, 'Name too long']
  },
  serialNumber: {
    type: String, required: [true, 'Serial number is required'], unique: true, trim: true, uppercase: true
  },
  department: {
    type: String, required: true,
    enum: ['IT', 'Production', 'Maintenance', 'Electrical', 'Mechanical', 'Facilities', 'HVAC', 'Safety']
  },
  location:       { type: String, required: true, trim: true },
  manufacturer:   { type: String, trim: true },
  model:          { type: String, trim: true },
  purchaseDate:   { type: Date },
  warrantyExpiry: { type: Date },
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance', 'decommissioned'],
    default: 'active',
    index: true
  },

  // Team / Technician (denormalised for fast reads)
  teamId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName:       { type: String },
  technicianId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String },

  // Operating Data (updated by IoT / manual input)
  usageHours:          { type: Number, default: 0, min: 0 },
  totalFailures:       { type: Number, default: 0, min: 0 },
  installationAge:     { type: Number, default: 0, min: 0 }, // months
  lastMaintenanceDate: { type: Date },
  nextScheduledMaint:  { type: Date },

  // AI Risk Score (updated by Python AI service)
  aiRisk: {
    level:       { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    score:       { type: Number, default: 0, min: 0, max: 100 },
    failureDays: { type: Number, default: 90 },
    confidence:  { type: Number, default: 70, min: 0, max: 100 },
    recommendation: { type: String },
    lastUpdated: { type: Date, default: Date.now }
  },

  // IoT / Sensor telemetry (latest reading)
  telemetry: {
    temperature:  { type: Number },
    vibration:    { type: Number },
    pressure:     { type: Number },
    humidity:     { type: Number },
    rpm:          { type: Number },
    lastReading:  { type: Date }
  },

  tags:          [String],
  notes:         { type: String, maxlength: 2000 },
  imageUrl:      { type: String },
  documents:     [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: count of maintenance requests
equipmentSchema.virtual('requestCount', {
  ref:        'Request',
  localField: '_id',
  foreignField: 'equipmentId',
  count:      true
});

equipmentSchema.index({ department: 1, status: 1 });
equipmentSchema.index({ 'aiRisk.level': 1 });
equipmentSchema.index({ serialNumber: 1 });
equipmentSchema.index({ teamId: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
