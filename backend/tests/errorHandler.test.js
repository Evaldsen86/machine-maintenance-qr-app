const errorHandler = require('../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should handle ValidationError', () => {
    const err = new Error('Validation Error');
    err.name = 'ValidationError';
    err.errors = {
      field1: { message: 'Error 1' },
      field2: { message: 'Error 2' }
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation Error',
      details: ['Error 1', 'Error 2']
    });
  });

  it('should handle CastError', () => {
    const err = new Error('Invalid ID');
    err.name = 'CastError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid ID format'
    });
  });

  it('should handle general errors in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Test error');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      error: 'Test error'
    });
  });

  it('should handle general errors in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Test error');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal Server Error'
    });
  });

  it('should log error stack', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const err = new Error('Test error');
    err.stack = 'Error stack trace';

    errorHandler(err, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('Error stack trace');
    consoleSpy.mockRestore();
  });
}); 