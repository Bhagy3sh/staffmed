const express = require('express');
const { body, validationResult } = require('express-validator');
const Schedule = require('../models/Schedule');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/schedules ───────────────────────────────────────────────────────
// Supports ?doctorId=&month=&year=

router.get('/', async (req, res) => {
  try {
    const { doctorId, month, year } = req.query;
    const query = {};

    if (doctorId) query.doctor = doctorId;

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
        return res.status(400).json({ message: 'Invalid month or year' });
      }
      // Use UTC boundaries so timezone of the server never shifts dates into wrong months
      query.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1)),
        $lte: new Date(Date.UTC(y, m, 0, 23, 59, 59)),
      };
    }

    const schedules = await Schedule.find(query)
      .populate('doctor', 'firstName lastName specialty department')
      .sort({ date: 1 });

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

// ─── POST /api/schedules ──────────────────────────────────────────────────────
// Doctor uploads a schedule for a date

const VALID_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$|^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i;

const scheduleValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('slots').isArray({ min: 1, max: 30 }).withMessage('Provide 1–30 time slots'),
  body('slots.*.time')
    .notEmpty().withMessage('Each slot must have a time')
    .trim()
    .matches(VALID_TIME_REGEX).withMessage('Invalid time format (use HH:MM or h:MM AM/PM)'),
  body('notes').optional().trim().isLength({ max: 300 }),
];

router.post('/', authorize('doctor'), scheduleValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, slots, notes } = req.body;

  // No duplicate times within the same submission
  const times = slots.map((s) => s.time.trim());
  if (new Set(times).size !== times.length) {
    return res.status(400).json({ message: 'Duplicate time slots are not allowed in a single schedule' });
  }

  // Parse date parts and build UTC midnight — avoids local-timezone shifting
  const [yr, mo, dy] = date.split('-').map(Number);
  const scheduleDate = new Date(Date.UTC(yr, mo - 1, dy));

  try {
    const schedule = await Schedule.findOneAndUpdate(
      { doctor: req.user._id, date: scheduleDate },
      {
        doctor: req.user._id,
        date: scheduleDate,
        slots: times.map((t) => ({ time: t, isBooked: false, bookedBy: null })),
        isAvailable: true,
        notes: notes || '',
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const populated = await schedule.populate('doctor', 'firstName lastName specialty department');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A schedule already exists for this date. It was updated.' });
    }
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error creating schedule' });
  }
});

// ─── DELETE /api/schedules/:id ────────────────────────────────────────────────

router.delete('/:id', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    if (req.user.role === 'doctor' && schedule.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own schedules' });
    }

    if (schedule.slots.some((s) => s.isBooked)) {
      return res
        .status(400)
        .json({ message: 'Cannot delete a schedule that has booked appointments. Cancel them first.' });
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting schedule' });
  }
});

module.exports = router;
