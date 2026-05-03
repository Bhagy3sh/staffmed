const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUserFields = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  specialty: user.specialty,
  department: user.department,
  licenseNo: user.licenseNo,
  employeeId: user.employeeId,
  demographics: user.demographics,
  isActive: user.isActive,
  needsOnboarding: user.needsOnboarding,
  createdAt: user.createdAt,
});

// ─── Validation rules ────────────────────────────────────────────────────────

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2–50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2–50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Last name contains invalid characters'),

  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{}|;',./:<>?]/).withMessage('Password must contain at least one special character'),

  body('role')
    .isIn(['patient', 'doctor', 'nurse', 'admin', 'it'])
    .withMessage('Role must be one of: patient, doctor, nurse, admin, it'),

  body('specialty')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('Specialty is required for medical staff')
    .trim().isLength({ max: 100 }),

  body('department')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('Department is required for medical staff')
    .trim().isLength({ max: 100 }),

  body('licenseNo')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('License number is required for medical staff')
    .trim().isLength({ max: 50 }),
];

const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, role, specialty, department, licenseNo, employeeId } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const userData = { firstName, lastName, email, password, role };

    if (['doctor', 'nurse'].includes(role)) {
      userData.specialty = specialty;
      userData.department = department;
      userData.licenseNo = licenseNo;
    }

    if (role === 'it') {
      userData.employeeId = employeeId || '';
    }

    if (role === 'patient') {
      userData.demographics = {
        birthday: null,
        address: '',
        philhealthNo: '',
        contactNo: '',
        emergencyContactName: '',
        emergencyContactNo: '',
      };
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({ token, user: safeUserFields(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: safeUserFields(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(safeUserFields(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/auth/google ────────────────────────────────────────────────────
// Verify Google ID token, find or create patient user, return JWT

router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    if (!email) return res.status(400).json({ message: 'No email returned from Google' });

    // Find existing user or create a new patient account
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
      }
    } else {
      // New Google user — create with placeholder role, prompt onboarding
      user = await User.create({
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        email: email.toLowerCase(),
        password: `google_${googleId}_${Date.now()}`,
        role: 'patient',
        needsOnboarding: true,
      });
    }

    const token = generateToken(user._id);
    res.json({ token, user: safeUserFields(user) });
  } catch (error) {
    console.error('Google auth error:', error);
    if (error.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid Google token. Please try again.' });
    }
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// ─── POST /api/auth/complete-onboarding ──────────────────────────────────────
// Called after Google sign-in to set role and role-specific fields

router.post('/complete-onboarding', protect, [
  body('role')
    .isIn(['patient', 'doctor', 'nurse', 'admin', 'it'])
    .withMessage('Role must be one of: patient, doctor, nurse, admin, it'),
  body('specialty')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('Specialty is required for medical staff').trim().isLength({ max: 100 }),
  body('department')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('Department is required for medical staff').trim().isLength({ max: 100 }),
  body('licenseNo')
    .if(body('role').isIn(['doctor', 'nurse']))
    .notEmpty().withMessage('License number is required for medical staff').trim().isLength({ max: 50 }),
  body('employeeId')
    .if(body('role').equals('it'))
    .optional().trim().isLength({ max: 50 }),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.needsOnboarding) return res.status(400).json({ message: 'Onboarding already completed' });

    const { role, specialty, department, licenseNo, employeeId } = req.body;

    user.role = role;
    user.needsOnboarding = false;

    if (['doctor', 'nurse'].includes(role)) {
      user.specialty = specialty;
      user.department = department;
      user.licenseNo = licenseNo;
    } else {
      user.specialty = undefined;
      user.department = undefined;
      user.licenseNo = undefined;
    }

    if (role === 'it') {
      user.employeeId = employeeId || '';
    } else {
      user.employeeId = undefined;
    }

    await user.save();
    res.json(safeUserFields(user));
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
});

module.exports = router;
