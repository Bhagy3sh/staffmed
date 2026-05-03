const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const demographicsSchema = new mongoose.Schema(
  {
    birthday: { type: Date, default: null },
    address: { type: String, trim: true, maxlength: [200, 'Address too long'], default: '' },
    philhealthNo: { type: String, trim: true, maxlength: [20, 'PhilHealth number too long'], default: '' },
    contactNo: { type: String, trim: true, default: '' },
    emergencyContactName: { type: String, trim: true, maxlength: [100, 'Name too long'], default: '' },
    emergencyContactNo: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['patient', 'doctor', 'nurse', 'admin', 'it'],
        message: 'Role must be one of: patient, doctor, nurse, admin, it',
      },
      required: [true, 'Role is required'],
    },
    // Patient-specific
    demographics: { type: demographicsSchema, default: null },
    // Doctor / Nurse specific
    specialty: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    licenseNo: { type: String, trim: true, maxlength: 50 },
    // IT specific
    employeeId: { type: String, trim: true, maxlength: 50 },
    isActive: { type: Boolean, default: true },
    needsOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Virtual full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
