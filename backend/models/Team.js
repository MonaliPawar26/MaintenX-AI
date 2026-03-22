'use strict';
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  department:  { type: String, enum: ['IT', 'Production', 'Maintenance', 'Electrical', 'Mechanical', 'Facilities', 'HVAC', 'Safety'] },
  description: { type: String },
  color:       { type: String, default: '#00d4ff' },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  leadId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:    { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

teamSchema.virtual('memberCount').get(function () { return this.members.length; });

module.exports = mongoose.model('Team', teamSchema);
