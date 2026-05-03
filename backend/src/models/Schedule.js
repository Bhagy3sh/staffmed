const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    time: { type: String, required: true, trim: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);

const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
    },
    date: {
      type: Date,
      required: [true, 'Schedule date is required'],
    },
    slots: {
      type: [timeSlotSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one time slot is required',
      },
    },
    isAvailable: { type: Boolean, default: true },
    notes: { type: String, maxlength: [300, 'Notes too long'], trim: true },
  },
  { timestamps: true }
);

// One schedule per doctor per day
scheduleSchema.index({ doctor: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
