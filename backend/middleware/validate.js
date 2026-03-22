'use strict';
const { validationResult } = require('express-validator');

/**
 * Express-validator error handler middleware.
 * Place after validation chain rules in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error:  'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

module.exports = validate;
