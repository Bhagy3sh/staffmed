require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const physicianRoutes = require('./routes/physicians');
const userRoutes = require('./routes/users');
const scheduleRoutes = require('./routes/schedules');

const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Schedule = require('./models/Schedule');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
    : []),
  // Vercel sets VERCEL_URL automatically for every deployment
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Return 503 on any data-path if Mongo is not yet connected
app.use('/api', (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/physicians', physicianRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState; // 1 = connected
    const [userCount, apptCount, schedCount] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Schedule.countDocuments(),
    ]);
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const apptByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const recentAppts = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('patient', 'firstName lastName')
      .populate('physician', 'firstName lastName specialty');

    res.json({
      status: 'ok',
      timestamp: new Date(),
      db: dbState === 1 ? 'connected' : 'disconnected',
      counts: { users: userCount, appointments: apptCount, schedules: schedCount },
      byRole: Object.fromEntries(byRole.map((r) => [r._id, r.count])),
      apptByStatus: Object.fromEntries(apptByStatus.map((r) => [r._id, r.count])),
      recentAppts,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`StaffMed API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
