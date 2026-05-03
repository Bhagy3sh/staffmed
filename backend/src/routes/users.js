const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/users/profile ───────────────────────────────────────────────────

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// ─── PUT /api/users/profile ───────────────────────────────────────────────────

const profileValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2–50 chars'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2–50 chars'),
  body('demographics.birthday').optional().isISO8601().withMessage('Invalid birthday date'),
  body('demographics.address').optional().trim().isLength({ max: 200 }).withMessage('Address too long'),
  body('demographics.philhealthNo')
    .optional()
    .trim()
    .matches(/^[0-9\-]{0,20}$/)
    .withMessage('Invalid PhilHealth number'),
  body('demographics.contactNo')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage('Contact number must be 7–15 digits'),
  body('demographics.emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name too long'),
  body('demographics.emergencyContactNo')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage('Emergency contact number must be 7–15 digits'),
];

router.put('/profile', profileValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, demographics, specialty, department } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    // Only patients can edit demographics
    if (demographics !== undefined) {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: 'Only patients can update demographics' });
      }
      const existingUser = await User.findById(req.user._id);
      updates.demographics = { ...(existingUser.demographics || {}), ...demographics };
    }

    // Medical staff can update specialty/department
    if (['doctor', 'nurse'].includes(req.user.role)) {
      if (specialty) updates.specialty = specialty;
      if (department) updates.department = department;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// ─── PUT /api/users/change-password ──────────────────────────────────────────

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter')
    .matches(/\d/).withMessage('New password must contain a number')
    .matches(/[!@#$%^&*()_+\-=[\]{}|;',./:<>?]/).withMessage('New password must contain a special character'),
];

router.put('/change-password', passwordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// ─── GET /api/users (admin only) ─────────────────────────────────────────────

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// ─── PATCH /api/users/:id/deactivate (admin only) ────────────────────────────

router.patch('/:id/deactivate', authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/users/:id/role (admin only) ──────────────────────────────────

router.patch('/:id/role', authorize('admin'), async (req, res) => {
  const valid = ['patient', 'doctor', 'nurse', 'admin', 'it'];
  const { role } = req.body;
  if (!valid.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/users/:id/activate (admin only) ──────────────────────────────

router.patch('/:id/activate', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User activated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/users/debug-role (dev only) ──────────────────────────────────

router.patch('/debug-role', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Only available in development' });
  }
  const { role } = req.body;
  const valid = ['patient', 'doctor', 'nurse', 'admin', 'it'];
  if (!valid.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  try {
    const updates = { role, needsOnboarding: false };
    if (role === 'doctor' || role === 'nurse') {
      updates.specialty = updates.specialty || 'General Medicine';
      updates.department = updates.department || 'General';
      updates.licenseNo = updates.licenseNo || 'DEBUG-001';
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
