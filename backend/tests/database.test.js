const mongoose = require('mongoose');
const connectDB = require('../config/database');

jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to MongoDB successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mongoose.connect.mockResolvedValueOnce({
      connection: {
        host: 'localhost'
      }
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
    expect(consoleSpy).toHaveBeenCalledWith('MongoDB Connected: localhost');
    consoleSpy.mockRestore();
  });

  it('should handle connection error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    const error = new Error('Connection failed');
    mongoose.connect.mockRejectedValueOnce(error);

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith('Error: Connection failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should use correct MongoDB URI from environment variables', async () => {
    process.env.MONGODB_URI = 'mongodb://test:27017/testdb';
    mongoose.connect.mockResolvedValueOnce({
      connection: {
        host: 'test'
      }
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://test:27017/testdb',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
  });
}); 