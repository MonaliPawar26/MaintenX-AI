'use strict';
const request = require('supertest');
const app     = require('../server');

describe('Equipment API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/equipment returns array', async () => {
    const res = await request(app).get('/api/equipment');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/equipment with risk filter', async () => {
    const res = await request(app).get('/api/equipment?risk=high');
    expect(res.status).toBe(200);
  });
});
