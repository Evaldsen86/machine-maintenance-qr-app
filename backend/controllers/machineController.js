const Machine = require('../models/Machine');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');
const { formatDate, calculateTaskProgress } = require('../utils/helpers');
const QRCode = require('qrcode');

// Get all machines
exports.getMachines = async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// Get one machine
exports.getMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    res.json(machine);
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// Create machine
exports.createMachine = async (req, res) => {
  const machine = new Machine({
    ...req.body,
    createdAt: formatDate(new Date()),
    updatedAt: formatDate(new Date())
  });
  try {
    const newMachine = await machine.save();
    res.status(201).json({
      message: SUCCESS_MESSAGES.MACHINE_CREATED,
      machine: newMachine
    });
  } catch (err) {
    res.status(400).json({ message: ERROR_MESSAGES.VALIDATION_ERROR });
  }
};

// Update machine
exports.updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    Object.assign(machine, {
      ...req.body,
      updatedAt: formatDate(new Date())
    });
    const updatedMachine = await machine.save();
    res.json({
      message: SUCCESS_MESSAGES.MACHINE_UPDATED,
      machine: updatedMachine
    });
  } catch (err) {
    res.status(400).json({ message: ERROR_MESSAGES.VALIDATION_ERROR });
  }
};

// Delete machine
exports.deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    await machine.remove();
    res.json({ message: SUCCESS_MESSAGES.MACHINE_DELETED });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// Add task to machine
exports.addTask = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    const task = {
      ...req.body,
      createdAt: formatDate(new Date())
    };
    machine.tasks.push(task);
    const updatedMachine = await machine.save();
    res.status(201).json({
      message: SUCCESS_MESSAGES.TASK_ADDED,
      machine: updatedMachine
    });
  } catch (err) {
    res.status(400).json({ message: ERROR_MESSAGES.VALIDATION_ERROR });
  }
};

// Add maintenance record
exports.addMaintenance = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    const maintenance = {
      ...req.body,
      date: formatDate(req.body.date)
    };
    machine.maintenanceHistory.push(maintenance);
    const updatedMachine = await machine.save();
    res.status(201).json({
      message: SUCCESS_MESSAGES.MAINTENANCE_ADDED,
      machine: updatedMachine
    });
  } catch (err) {
    res.status(400).json({ message: ERROR_MESSAGES.VALIDATION_ERROR });
  }
};

// Update oil information
exports.updateOilInfo = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }
    machine.oilInformation = {
      ...req.body,
      lastChanged: formatDate(req.body.lastChanged),
      nextChange: formatDate(req.body.nextChange)
    };
    const updatedMachine = await machine.save();
    res.json({
      message: SUCCESS_MESSAGES.OIL_INFO_UPDATED,
      machine: updatedMachine
    });
  } catch (err) {
    res.status(400).json({ message: ERROR_MESSAGES.VALIDATION_ERROR });
  }
};

// Generate QR code for machine
exports.generateQRCode = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }

    const machineData = {
      id: machine._id,
      name: machine.name,
      model: machine.model,
      serialNumber: machine.serialNumber
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(machineData), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });

    res.json({
      message: SUCCESS_MESSAGES.QR_CODE_GENERATED,
      qrCode: qrCodeDataUrl,
      machineData
    });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// Validate QR code
exports.validateQRCode = async (req, res) => {
  try {
    const { machineData } = req.body;
    if (!machineData || !machineData.id) {
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_QR_CODE });
    }

    const machine = await Machine.findById(machineData.id);
    if (!machine) {
      return res.status(404).json({ message: ERROR_MESSAGES.MACHINE_NOT_FOUND });
    }

    // Verify that the scanned data matches the machine
    if (machine.name !== machineData.name || 
        machine.model !== machineData.model || 
        machine.serialNumber !== machineData.serialNumber) {
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_QR_CODE });
    }

    res.json({
      message: SUCCESS_MESSAGES.QR_CODE_VALID,
      machine
    });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
}; 