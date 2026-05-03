const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/physicians ─────────────────────────────────────────────────────
// All active doctors, supports ?search=&specialty=

router.get('/', async (req, res) => {
  try {
    const { search, specialty } = req.query;
    const query = { role: 'doctor', isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }

    const physicians = await User.find(query)
      .select('firstName lastName specialty department')
      .sort({ lastName: 1 });

    res.json(physicians);
  } catch (error) {
    console.error('Get physicians error:', error);
    res.status(500).json({ message: 'Server error fetching physicians' });
  }
});

// ─── GET /api/physicians/:id ─────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const physician = await User.findOne({ _id: req.params.id, role: 'doctor', isActive: true }).select(
      'firstName lastName specialty department'
    );
    if (!physician) return res.status(404).json({ message: 'Physician not found' });
    res.json(physician);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching physician' });
  }
});

module.exports = router;
