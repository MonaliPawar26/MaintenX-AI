'use strict';
const express  = require('express');
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body }  = require('express-validator');
const validate  = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const User      = require('../models/User');
const logger    = require('../config/logger');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET  = process.env.JWT_SECRET  || 'maintenx_dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── POST /api/auth/google ─────────────────────────────────────
router.post('/google',
  body('credential').notEmpty().withMessage('Google credential required'),
  validate,
  async (req, res) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken:  req.body.credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      let user = await User.findOne({ email: payload.email });
      if (!user) {
        user = await User.create({
          name: payload.name, email: payload.email,
          avatar: payload.picture, googleId: payload.sub,
          emailVerified: payload.email_verified || false
        });
        logger.info(`New user created via Google OAuth: ${payload.email}`);
      } else {
        user.lastLogin  = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        user.avatar     = payload.picture;
        await user.save();
      }
      res.json({ success: true, token: signToken(user), user: user.toJSON() });
    } catch (err) {
      logger.error(`Google auth error: ${err.message}`);
      res.status(401).json({ error: 'Invalid Google credential.' });
    }
  }
);

// ─── POST /api/auth/register ──────────────────────────────────
router.post('/register',
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (await User.findOne({ email }))
        return res.status(409).json({ error: 'Email already registered.' });
      const user = await User.create({ name, email, password });
      res.status(201).json({ success: true, token: signToken(user), user: user.toJSON() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.password)
        return res.status(401).json({ error: 'Invalid credentials.' });
      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });
      user.lastLogin  = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
      res.json({ success: true, token: signToken(user), user: user.toJSON() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /api/auth/demo ──────────────────────────────────────
router.post('/demo', async (req, res) => {
  const { email } = req.body;
  const demoUser = {
    _id: 'demo-001',
    name:  email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Demo Admin',
    email: email || 'demo@maintenx.ai',
    role:  'admin',
    avatar: null
  };
  const token = jwt.sign(
    { userId: demoUser._id, email: demoUser.email, role: demoUser.role, name: demoUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ success: true, token, user: demoUser });
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, user: user || req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
