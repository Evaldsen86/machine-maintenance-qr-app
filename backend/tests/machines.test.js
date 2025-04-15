const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Machine = require('../models/Machine');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Machine.deleteMany({});
});

describe('Machine Routes', () => {
  const validMachine = {
    name: 'Test Machine',
    model: 'Test Model',
    serialNumber: 'TEST123',
    specifications: ['Spec 1', 'Spec 2'],
    purchaseDate: new Date(),
    location: 'Test Location',
    status: 'operational'
  };

  describe('GET /api/machines', () => {
    it('should return all machines', async () => {
      await Machine.create(validMachine);
      const response = await request(app).get('/api/machines');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return empty array when no machines exist', async () => {
      const response = await request(app).get('/api/machines');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/machines/:id', () => {
    it('should return a machine by id', async () => {
      const machine = await Machine.create(validMachine);
      const response = await request(app).get(`/api/machines/${machine._id}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(validMachine.name);
    });

    it('should return 404 for non-existent machine', async () => {
      const response = await request(app).get(`/api/machines/${new mongoose.Types.ObjectId()}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/machines', () => {
    it('should create a new machine', async () => {
      const response = await request(app)
        .post('/api/machines')
        .send(validMachine);
      expect(response.status).toBe(201);
      expect(response.body.machine.name).toBe(validMachine.name);
    });

    it('should validate required fields', async () => {
      const invalidMachine = { name: 'Test Machine' };
      const response = await request(app)
        .post('/api/machines')
        .send(invalidMachine);
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/machines/:id', () => {
    it('should update a machine', async () => {
      const machine = await Machine.create(validMachine);
      const update = { name: 'Updated Machine' };
      const response = await request(app)
        .patch(`/api/machines/${machine._id}`)
        .send(update);
      expect(response.status).toBe(200);
      expect(response.body.machine.name).toBe(update.name);
    });

    it('should return 404 for non-existent machine', async () => {
      const response = await request(app)
        .patch(`/api/machines/${new mongoose.Types.ObjectId()}`)
        .send({ name: 'Updated Machine' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/machines/:id', () => {
    it('should delete a machine', async () => {
      const machine = await Machine.create(validMachine);
      const response = await request(app).delete(`/api/machines/${machine._id}`);
      expect(response.status).toBe(200);
      const deletedMachine = await Machine.findById(machine._id);
      expect(deletedMachine).toBeNull();
    });

    it('should return 404 for non-existent machine', async () => {
      const response = await request(app).delete(`/api/machines/${new mongoose.Types.ObjectId()}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/machines/:id/tasks', () => {
    it('should add a task to a machine', async () => {
      const machine = await Machine.create(validMachine);
      const task = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date(),
        assignedTo: 'Test User'
      };
      const response = await request(app)
        .post(`/api/machines/${machine._id}/tasks`)
        .send(task);
      expect(response.status).toBe(201);
      expect(response.body.machine.tasks).toHaveLength(1);
    });
  });

  describe('POST /api/machines/:id/maintenance', () => {
    it('should add a maintenance record to a machine', async () => {
      const machine = await Machine.create(validMachine);
      const maintenance = {
        date: new Date(),
        description: 'Test Maintenance',
        technician: 'Test Technician',
        parts: ['Part 1'],
        cost: 1000
      };
      const response = await request(app)
        .post(`/api/machines/${machine._id}/maintenance`)
        .send(maintenance);
      expect(response.status).toBe(201);
      expect(response.body.machine.maintenanceHistory).toHaveLength(1);
    });
  });

  describe('POST /api/machines/:id/oil', () => {
    it('should update oil information for a machine', async () => {
      const machine = await Machine.create(validMachine);
      const oilInfo = {
        type: 'engine',
        quantity: 5,
        lastChanged: new Date(),
        nextChange: new Date()
      };
      const response = await request(app)
        .post(`/api/machines/${machine._id}/oil`)
        .send(oilInfo);
      expect(response.status).toBe(200);
      expect(response.body.machine.oilInformation.type).toBe(oilInfo.type);
    });
  });
}); 