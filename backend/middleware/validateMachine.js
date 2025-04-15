const validateMachine = (req, res, next) => {
  const { name, model, serialNumber } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Machine name is required' });
  }

  if (!model) {
    return res.status(400).json({ message: 'Machine model is required' });
  }

  if (!serialNumber) {
    return res.status(400).json({ message: 'Serial number is required' });
  }

  next();
};

const validateTask = (req, res, next) => {
  const { title, description, dueDate, assignedTo } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  if (!description) {
    return res.status(400).json({ message: 'Task description is required' });
  }

  if (!dueDate) {
    return res.status(400).json({ message: 'Due date is required' });
  }

  if (!assignedTo) {
    return res.status(400).json({ message: 'Assigned user is required' });
  }

  next();
};

const validateMaintenance = (req, res, next) => {
  const { date, description, technician } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Maintenance date is required' });
  }

  if (!description) {
    return res.status(400).json({ message: 'Maintenance description is required' });
  }

  if (!technician) {
    return res.status(400).json({ message: 'Technician name is required' });
  }

  next();
};

const validateOilInfo = (req, res, next) => {
  const { type, quantity, lastChanged, nextChange } = req.body;

  if (!type) {
    return res.status(400).json({ message: 'Oil type is required' });
  }

  if (!quantity) {
    return res.status(400).json({ message: 'Oil quantity is required' });
  }

  if (!lastChanged) {
    return res.status(400).json({ message: 'Last change date is required' });
  }

  if (!nextChange) {
    return res.status(400).json({ message: 'Next change date is required' });
  }

  next();
};

module.exports = {
  validateMachine,
  validateTask,
  validateMaintenance,
  validateOilInfo
}; 