const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

describe('Machine Model', () => {
  const validMachine = {
    name: 'Test Machine',
    model: 'Test Model',
    serialNumber: 'TEST123',
    specifications: ['Spec 1', 'Spec 2'],
    purchaseDate: new Date(),
    location: 'Test Location',
    status: 'operational'
  };

  it('should create a valid machine', async () => {
    const machine = await Machine.create(validMachine);
    expect(machine.name).toBe(validMachine.name);
    expect(machine.model).toBe(validMachine.model);
    expect(machine.serialNumber).toBe(validMachine.serialNumber);
    expect(machine.specifications).toEqual(validMachine.specifications);
    expect(machine.status).toBe(validMachine.status);
  });

  it('should require name field', async () => {
    const machineWithoutName = { ...validMachine };
    delete machineWithoutName.name;
    await expect(Machine.create(machineWithoutName)).rejects.toThrow();
  });

  it('should require model field', async () => {
    const machineWithoutModel = { ...validMachine };
    delete machineWithoutModel.model;
    await expect(Machine.create(machineWithoutModel)).rejects.toThrow();
  });

  it('should require serialNumber field', async () => {
    const machineWithoutSerial = { ...validMachine };
    delete machineWithoutSerial.serialNumber;
    await expect(Machine.create(machineWithoutSerial)).rejects.toThrow();
  });

  it('should set default status to operational', async () => {
    const machineWithoutStatus = { ...validMachine };
    delete machineWithoutStatus.status;
    const machine = await Machine.create(machineWithoutStatus);
    expect(machine.status).toBe('operational');
  });

  it('should validate status enum values', async () => {
    const machineWithInvalidStatus = {
      ...validMachine,
      status: 'invalid-status'
    };
    await expect(Machine.create(machineWithInvalidStatus)).rejects.toThrow();
  });

  it('should update timestamps on save', async () => {
    const machine = await Machine.create(validMachine);
    const originalUpdatedAt = machine.updatedAt;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    machine.name = 'Updated Name';
    await machine.save();
    
    expect(machine.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it('should handle tasks array', async () => {
    const machineWithTask = {
      ...validMachine,
      tasks: [{
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date(),
        assignedTo: 'Test User'
      }]
    };
    const machine = await Machine.create(machineWithTask);
    expect(machine.tasks).toHaveLength(1);
    expect(machine.tasks[0].title).toBe('Test Task');
  });

  it('should handle maintenance history array', async () => {
    const machineWithMaintenance = {
      ...validMachine,
      maintenanceHistory: [{
        date: new Date(),
        description: 'Test Maintenance',
        technician: 'Test Technician',
        parts: ['Part 1'],
        cost: 1000
      }]
    };
    const machine = await Machine.create(machineWithMaintenance);
    expect(machine.maintenanceHistory).toHaveLength(1);
    expect(machine.maintenanceHistory[0].description).toBe('Test Maintenance');
  });

  it('should handle oil information', async () => {
    const machineWithOilInfo = {
      ...validMachine,
      oilInformation: {
        type: 'engine',
        quantity: 5,
        lastChanged: new Date(),
        nextChange: new Date()
      }
    };
    const machine = await Machine.create(machineWithOilInfo);
    expect(machine.oilInformation.type).toBe('engine');
    expect(machine.oilInformation.quantity).toBe(5);
  });
}); 