// Format date to ISO string
exports.formatDate = (date) => {
  return new Date(date).toISOString();
};

// Calculate next maintenance date based on frequency
exports.calculateNextMaintenance = (lastMaintenance, frequency) => {
  const lastDate = new Date(lastMaintenance);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + frequency);
  return nextDate.toISOString();
};

// Format currency
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK'
  }).format(amount);
};

// Generate QR code data
exports.generateQRData = (machineId) => {
  return {
    type: 'machine',
    id: machineId,
    timestamp: new Date().toISOString()
  };
};

// Validate date format
exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Calculate task completion percentage
exports.calculateTaskProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.completed).length;
  return (completedTasks / tasks.length) * 100;
};

// Format file size
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 