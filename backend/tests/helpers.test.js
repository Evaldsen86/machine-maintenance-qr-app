const {
  formatDate,
  calculateNextMaintenance,
  formatCurrency,
  generateQRData,
  isValidDate,
  calculateTaskProgress,
  formatFileSize
} = require('../utils/helpers');

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2023-01-01');
      const formattedDate = formatDate(date);
      expect(formattedDate).toBe(date.toISOString());
    });
  });

  describe('calculateNextMaintenance', () => {
    it('should calculate next maintenance date', () => {
      const lastMaintenance = new Date('2023-01-01');
      const frequency = 3;
      const nextMaintenance = calculateNextMaintenance(lastMaintenance, frequency);
      const expectedDate = new Date('2023-04-01').toISOString();
      expect(nextMaintenance).toBe(expectedDate);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in DKK', () => {
      const amount = 1000;
      const formattedAmount = formatCurrency(amount);
      expect(formattedAmount).toBe('1.000,00 kr.');
    });

    it('should handle decimal amounts', () => {
      const amount = 1000.50;
      const formattedAmount = formatCurrency(amount);
      expect(formattedAmount).toBe('1.000,50 kr.');
    });
  });

  describe('generateQRData', () => {
    it('should generate QR code data', () => {
      const machineId = '123';
      const qrData = generateQRData(machineId);
      expect(qrData).toHaveProperty('type', 'machine');
      expect(qrData).toHaveProperty('id', machineId);
      expect(qrData).toHaveProperty('timestamp');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date', () => {
      const validDate = '2023-01-01';
      expect(isValidDate(validDate)).toBe(true);
    });

    it('should return false for invalid date', () => {
      const invalidDate = 'invalid-date';
      expect(isValidDate(invalidDate)).toBe(false);
    });
  });

  describe('calculateTaskProgress', () => {
    it('should calculate task completion percentage', () => {
      const tasks = [
        { completed: true },
        { completed: true },
        { completed: false },
        { completed: true }
      ];
      const progress = calculateTaskProgress(tasks);
      expect(progress).toBe(75);
    });

    it('should return 0 for empty tasks array', () => {
      const tasks = [];
      const progress = calculateTaskProgress(tasks);
      expect(progress).toBe(0);
    });

    it('should return 0 for undefined tasks', () => {
      const progress = calculateTaskProgress(undefined);
      expect(progress).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes to human readable size', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal sizes', () => {
      expect(formatFileSize(1500)).toBe('1.46 KB');
      expect(formatFileSize(1500000)).toBe('1.43 MB');
    });
  });
}); 