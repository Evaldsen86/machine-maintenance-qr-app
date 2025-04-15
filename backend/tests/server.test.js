const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Server Configuration', () => {
  it('should respond to GET /api/machines', async () => {
    const response = await request(app).get('/api/machines');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should handle CORS', async () => {
    const response = await request(app)
      .get('/api/machines')
      .set('Origin', 'http://localhost:3000');
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('should parse JSON body', async () => {
    const machineData = {
      name: 'Test Machine',
      model: 'Test Model',
      serialNumber: 'TEST123'
    };
    const response = await request(app)
      .post('/api/machines')
      .send(machineData)
      .set('Content-Type', 'application/json');
    expect(response.status).toBe(201);
  });

  it('should handle validation errors', async () => {
    const invalidData = {
      name: 'Test Machine'
      // Missing required fields
    };
    const response = await request(app)
      .post('/api/machines')
      .send(invalidData)
      .set('Content-Type', 'application/json');
    expect(response.status).toBe(400);
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });

  it('should handle server errors', async () => {
    // Simulate a server error by passing an invalid ID
    const response = await request(app).get('/api/machines/invalid-id');
    expect(response.status).toBe(500);
  });

  it('should use morgan for logging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await request(app).get('/api/machines');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
}); 