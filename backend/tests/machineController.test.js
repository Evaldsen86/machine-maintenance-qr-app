const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Machine = require('../models/Machine');
const {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  addTask,
  addMaintenance,
  updateOilInfo
} = require('../controllers/machineController');

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

describe('Machine Controller', () => {
  const mockMachine = {
    name: 'Test Machine',
    model: 'Test Model',
    serialNumber: 'TEST123',
    specifications: ['Spec 1', 'Spec 2'],
    purchaseDate: new Date(),
    location: 'Test Location'
  };

  const mockTask = {
    title: 'Test Task',
    description: 'Test Description',
    dueDate: new Date(),
    assignedTo: 'Test User'
  };

  const mockMaintenance = {
    date: new Date(),
    description: 'Test Maintenance',
    technician: 'Test Technician',
    parts: ['Part 1', 'Part 2'],
    cost: 1000
  };

  const mockOilInfo = {
    type: 'engine',
    quantity: 5,
    lastChanged: new Date(),
    nextChange: new Date()
  };

  describe('getMachines', () => {
    it('should return all machines', async () => {
      await Machine.create(mockMachine);
      const req = {};
      const res = {
        json: jest.fn()
      };
      await getMachines(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMachine', () => {
    it('should return a machine by id', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id }
      };
      const res = {
        json: jest.fn()
      };
      await getMachine(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 if machine not found', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId() }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      await getMachine(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createMachine', () => {
    it('should create a new machine', async () => {
      const req = {
        body: mockMachine
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      await createMachine(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateMachine', () => {
    it('should update a machine', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id },
        body: { name: 'Updated Machine' }
      };
      const res = {
        json: jest.fn()
      };
      await updateMachine(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteMachine', () => {
    it('should delete a machine', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id }
      };
      const res = {
        json: jest.fn()
      };
      await deleteMachine(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('addTask', () => {
    it('should add a task to a machine', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id },
        body: mockTask
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      await addTask(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('addMaintenance', () => {
    it('should add a maintenance record to a machine', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id },
        body: mockMaintenance
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      await addMaintenance(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateOilInfo', () => {
    it('should update oil information for a machine', async () => {
      const machine = await Machine.create(mockMachine);
      const req = {
        params: { id: machine._id },
        body: mockOilInfo
      };
      const res = {
        json: jest.fn()
      };
      await updateOilInfo(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });
}); 