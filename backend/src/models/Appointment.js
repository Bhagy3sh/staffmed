const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    physician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Physician is required'],
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    time: {
      type: String,
      required: [true, 'Appointment time is required'],
      trim: true,
    },
    department: { type: String, trim: true },
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
      trim: true,
      maxlength: [500, 'Chief complaint cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: { values: ['upcoming', 'completed', 'cancelled', 'follow-up'], message: 'Invalid status' },
      default: 'upcoming',
    },
    verifiedByNurse: { type: Boolean, default: false },
    nurseNotes: { type: String, maxlength: [500, 'Notes too long'], trim: true },
    cancelledAt: { type: Date },
    cancelReason: { type: String, maxlength: [300, 'Reason too long'], trim: true },
  },
  { timestamps: true }
);

// Prevent double-booking: same physician, date, time, both upcoming
appointmentSchema.index({ physician: 1, date: 1, time: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
