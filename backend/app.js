require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const machineRoutes = require('./routes/machines');
app.use('/api/machines', machineRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;

