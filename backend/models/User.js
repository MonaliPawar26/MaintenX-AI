'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // hashed, optional if Google OAuth only
  avatar:   { type: String },
  googleId: { type: String, index: true },

  role: {
    type: String, enum: ['admin', 'manager', 'technician', 'viewer'], default: 'technician', index: true
  },

  // Team
  teamId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName: { type: String },

  // Professional profile
  department:   { type: String },
  jobTitle:     { type: String },
  phone:        { type: String },
  location:     { type: String },
  bio:          { type: String, maxlength: 1000 },
  skills:       [String],
  certifications: [{
    name:    String,
    issuer:  String,
    issuedAt: Date,
    expiresAt: Date
  }],

  // Performance metrics (updated by AI service)
  metrics: {
    firstTimeFixRate:    { type: Number, default: 0.85 },
    avgResolutionHours:  { type: Number, default: 4 },
    tasksCompleted:      { type: Number, default: 0 },
    tasksPending:        { type: Number, default: 0 },
    rating:              { type: Number, default: 4.0 }
  },

  availability: {
    type: String, enum: ['available', 'busy', 'on_leave', 'offline'], default: 'available'
  },
  currentLoad:   { type: Number, default: 0 }, // active task count
  preferences:   { type: mongoose.Schema.Types.Mixed, default: {} },

  lastLogin:     { type: Date },
  loginCount:    { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true, index: true },
  emailVerified: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, obj) => { delete obj.password; return obj; } } });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('fullName').get(function () { return this.name; });

userSchema.index({ email: 1 });
userSchema.index({ teamId: 1 });

module.exports = mongoose.model('User', userSchema);
