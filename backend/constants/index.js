// Machine status
exports.MACHINE_STATUS = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};

// Task status
exports.TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

// Maintenance types
exports.MAINTENANCE_TYPES = {
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  EMERGENCY: 'emergency'
};

// Oil types
exports.OIL_TYPES = {
  HYDRAULIC: 'hydraulic',
  ENGINE: 'engine',
  GEAR: 'gear',
  TRANSMISSION: 'transmission'
};

// File types
exports.FILE_TYPES = {
  PDF: 'application/pdf',
  IMAGE: 'image/*',
  DOCUMENT: 'application/msword',
  SPREADSHEET: 'application/vnd.ms-excel'
};

// Error messages
exports.ERROR_MESSAGES = {
  MACHINE_NOT_FOUND: 'Machine not found',
  INVALID_ID: 'Invalid ID format',
  VALIDATION_ERROR: 'Validation Error',
  SERVER_ERROR: 'Internal Server Error'
};

// Success messages
exports.SUCCESS_MESSAGES = {
  MACHINE_CREATED: 'Machine created successfully',
  MACHINE_UPDATED: 'Machine updated successfully',
  MACHINE_DELETED: 'Machine deleted successfully',
  TASK_ADDED: 'Task added successfully',
  MAINTENANCE_ADDED: 'Maintenance record added successfully',
  OIL_INFO_UPDATED: 'Oil information updated successfully'
}; 