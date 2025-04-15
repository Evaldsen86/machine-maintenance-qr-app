const express = require('express');
const router = express.Router();
const {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  addTask,
  addMaintenance,
  updateOilInfo,
  generateQRCode,
  validateQRCode
} = require('../controllers/machineController');
const {
  validateMachine,
  validateTask,
  validateMaintenance,
  validateOilInfo
} = require('../middleware/validateMachine');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');
const Machine = require('../models/Machine');

// Get all machines
router.get('/', getMachines);

// Get one machine
router.get('/:id', getMachine);

// Create machine
router.post('/', validateMachine, createMachine);

// Update machine
router.patch('/:id', validateMachine, updateMachine);

// Delete machine
router.delete('/:id', deleteMachine);

// Add task to machine
router.post('/:id/tasks', validateTask, addTask);

// Add maintenance record
router.post('/:id/maintenance', validateMaintenance, addMaintenance);

// Update oil information
router.post('/:id/oil', validateOilInfo, updateOilInfo);

// Generate QR code for machine
router.get('/:id/qr', generateQRCode);

// Validate QR code
router.post('/validate-qr', validateQRCode);

/**
 * POST /api/machines/validate-qr
 * Validates a QR code and returns the associated machine
 */
router.post('/validate-qr', async (req, res) => {
  try {
    const { machineData } = req.body;

    if (!machineData || !machineData.id) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_QR_CODE 
      });
    }

    const machine = await Machine.findById(machineData.id);
    
    if (!machine) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.MACHINE_NOT_FOUND 
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.QR_CODE_VALID,
      machine
    });
  } catch (error) {
    console.error('QR validation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
});

module.exports = router; 