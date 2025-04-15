const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  specifications: {
    type: [String],
    default: []
  },
  oilInfo: {
    type: {
      lastChange: Date,
      nextChange: Date,
      type: String,
      quantity: Number
    },
    default: {}
  },
  tasks: [{
    title: String,
    description: String,
    dueDate: Date,
    assignedTo: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  maintenance: [{
    date: Date,
    description: String,
    technician: String,
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
machineSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine; 