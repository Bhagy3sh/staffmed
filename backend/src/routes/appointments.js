const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

// ─── GET /api/appointments ────────────────────────────────────────────────────
// Patient → own appointments | Doctor → their scheduled | Nurse/Admin → all

router.get('/', async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.physician = req.user._id;
    } else if (!['nurse', 'admin', 'it'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view appointments' });
    }

    const validStatuses = ['upcoming', 'completed', 'cancelled', 'follow-up'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email demographics contactNo')
      .populate('physician', 'firstName lastName specialty department')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// ─── POST /api/appointments ───────────────────────────────────────────────────
// Book an appointment (patient only)

const bookValidation = [
  body('physicianId').isMongoId().withMessage('Valid physician ID is required'),
  body('date').isISO8601().withMessage('Valid date is required (ISO 8601)'),
  body('time').notEmpty().withMessage('Time slot is required').trim(),
  body('chiefComplaint')
    .trim()
    .notEmpty().withMessage('Chief complaint is required')
    .isLength({ min: 5, max: 500 }).withMessage('Chief complaint must be 5–500 characters'),
];

router.post('/', authorize('patient'), bookValidation, async (req, res) => {
  if (!validate(req, res)) return;

  const { physicianId, date, time, chiefComplaint } = req.body;
  // Parse date parts and build UTC midnight — avoids local-timezone shifting
  const [yr, mo, dy] = date.split('-').map(Number);
  const appointmentDate = new Date(Date.UTC(yr, mo - 1, dy));

  try {
    // Validate physician exists and is a doctor
    const physician = await User.findOne({ _id: physicianId, role: 'doctor', isActive: true });
    if (!physician) {
      return res.status(404).json({ message: 'Physician not found or no longer active' });
    }

    // Confirm schedule slot exists and is not booked
    const schedule = await Schedule.findOne({ doctor: physicianId, date: appointmentDate });
    if (!schedule) {
      return res.status(400).json({ message: 'The doctor has no schedule for this date' });
    }
    const slot = schedule.slots.find((s) => s.time === time);
    if (!slot) {
      return res.status(400).json({ message: 'Selected time slot does not exist on this schedule' });
    }
    if (slot.isBooked) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    // Prevent patient from double-booking same slot
    const patientConflict = await Appointment.findOne({
      patient: req.user._id,
      date: appointmentDate,
      time,
      status: 'upcoming',
    });
    if (patientConflict) {
      return res.status(409).json({ message: 'You already have an appointment at this date and time' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      physician: physicianId,
      date: appointmentDate,
      time,
      chiefComplaint,
      department: physician.department,
    });

    // Mark slot as booked
    await Schedule.findOneAndUpdate(
      { doctor: physicianId, date: appointmentDate, 'slots.time': time },
      { $set: { 'slots.$.isBooked': true, 'slots.$.bookedBy': req.user._id } }
    );

    const populated = await appointment.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'physician', select: 'firstName lastName specialty department' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error while booking appointment' });
  }
});

// ─── PATCH /api/appointments/:id/cancel ──────────────────────────────────────

router.patch(
  '/:id/cancel',
  [
    param('id').isMongoId().withMessage('Invalid appointment ID'),
    body('cancelReason').optional().trim().isLength({ max: 300 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      if (
        req.user.role === 'patient' &&
        appointment.patient.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }

      if (!['patient', 'admin', 'nurse'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to cancel appointments' });
      }

      if (appointment.status !== 'upcoming') {
        return res.status(400).json({ message: 'Only upcoming appointments can be cancelled' });
      }

      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
      appointment.cancelReason = req.body.cancelReason || '';
      await appointment.save();

      // Free the schedule slot
      await Schedule.findOneAndUpdate(
        { doctor: appointment.physician, date: appointment.date, 'slots.time': appointment.time },
        { $set: { 'slots.$.isBooked': false, 'slots.$.bookedBy': null } }
      );

      res.json(appointment);
    } catch (error) {
      console.error('Cancel error:', error);
      res.status(500).json({ message: 'Server error cancelling appointment' });
    }
  }
);

// ─── PATCH /api/appointments/:id/complete ────────────────────────────────────

router.patch('/:id/complete', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (
      req.user.role === 'doctor' &&
      appointment.physician.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'upcoming') {
      return res.status(400).json({ message: 'Only upcoming appointments can be completed' });
    }

    appointment.status = 'completed';
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/appointments/:id/followup ────────────────────────────────────

router.patch('/:id/followup', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (
      req.user.role === 'doctor' &&
      appointment.physician.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'follow-up';
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/appointments/:id/verify ──────────────────────────────────────
// Nurse verifies patient presence

router.patch(
  '/:id/verify',
  authorize('nurse', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid appointment ID'),
    body('nurseNotes').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      appointment.verifiedByNurse = true;
      appointment.nurseNotes = req.body.nurseNotes || '';
      await appointment.save();

      const populated = await appointment.populate([
        { path: 'patient', select: 'firstName lastName email' },
        { path: 'physician', select: 'firstName lastName specialty department' },
      ]);

      res.json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error verifying appointment' });
    }
  }
);

module.exports = router;
