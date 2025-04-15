const {
  validateMachine,
  validateTask,
  validateMaintenance,
  validateOilInfo
} = require('../middleware/validateMachine');

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateMachine', () => {
    it('should pass validation for valid machine data', () => {
      req.body = {
        name: 'Test Machine',
        model: 'Test Model',
        serialNumber: 'TEST123'
      };
      validateMachine(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail validation for missing name', () => {
      req.body = {
        model: 'Test Model',
        serialNumber: 'TEST123'
      };
      validateMachine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing model', () => {
      req.body = {
        name: 'Test Machine',
        serialNumber: 'TEST123'
      };
      validateMachine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing serial number', () => {
      req.body = {
        name: 'Test Machine',
        model: 'Test Model'
      };
      validateMachine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateTask', () => {
    it('should pass validation for valid task data', () => {
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date(),
        assignedTo: 'Test User'
      };
      validateTask(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail validation for missing title', () => {
      req.body = {
        description: 'Test Description',
        dueDate: new Date(),
        assignedTo: 'Test User'
      };
      validateTask(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing description', () => {
      req.body = {
        title: 'Test Task',
        dueDate: new Date(),
        assignedTo: 'Test User'
      };
      validateTask(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing due date', () => {
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        assignedTo: 'Test User'
      };
      validateTask(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing assigned user', () => {
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date()
      };
      validateTask(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateMaintenance', () => {
    it('should pass validation for valid maintenance data', () => {
      req.body = {
        date: new Date(),
        description: 'Test Maintenance',
        technician: 'Test Technician'
      };
      validateMaintenance(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail validation for missing date', () => {
      req.body = {
        description: 'Test Maintenance',
        technician: 'Test Technician'
      };
      validateMaintenance(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing description', () => {
      req.body = {
        date: new Date(),
        technician: 'Test Technician'
      };
      validateMaintenance(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing technician', () => {
      req.body = {
        date: new Date(),
        description: 'Test Maintenance'
      };
      validateMaintenance(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateOilInfo', () => {
    it('should pass validation for valid oil info data', () => {
      req.body = {
        type: 'engine',
        quantity: 5,
        lastChanged: new Date(),
        nextChange: new Date()
      };
      validateOilInfo(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail validation for missing type', () => {
      req.body = {
        quantity: 5,
        lastChanged: new Date(),
        nextChange: new Date()
      };
      validateOilInfo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing quantity', () => {
      req.body = {
        type: 'engine',
        lastChanged: new Date(),
        nextChange: new Date()
      };
      validateOilInfo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing last changed date', () => {
      req.body = {
        type: 'engine',
        quantity: 5,
        nextChange: new Date()
      };
      validateOilInfo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation for missing next change date', () => {
      req.body = {
        type: 'engine',
        quantity: 5,
        lastChanged: new Date()
      };
      validateOilInfo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
}); 