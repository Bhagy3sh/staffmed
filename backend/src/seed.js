require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('./models/User');
const Schedule = require('./models/Schedule');
const Appointment = require('./models/Appointment');

const sampleDoctors = [
  { firstName: 'Maria', lastName: 'Santos', email: 'dr.santos@staffmed.ph', specialty: 'Internal Medicine', department: 'Internal Medicine', licenseNo: 'PRC-100001' },
  { firstName: 'Jose', lastName: 'Reyes', email: 'dr.reyes@staffmed.ph', specialty: 'Pediatrics', department: 'Pediatrics', licenseNo: 'PRC-100002' },
  { firstName: 'Ana', lastName: 'Villanueva', email: 'dr.villanueva@staffmed.ph', specialty: 'OB-GYN', department: 'OB-GYN', licenseNo: 'PRC-100003' },
  { firstName: 'Carlos', lastName: 'Mendoza', email: 'dr.mendoza@staffmed.ph', specialty: 'General Surgery', department: 'Surgery', licenseNo: 'PRC-100004' },
  { firstName: 'Elena', lastName: 'Cruz', email: 'dr.cruz@staffmed.ph', specialty: 'Cardiology', department: 'Cardiology', licenseNo: 'PRC-100005' },
];

// Each doctor works different days of the week (0=Sun, 1=Mon ... 6=Sat)
// Santos: Mon/Tue/Wed/Thu/Fri (full week, but fewer slots some days)
// Reyes:  Mon/Wed/Fri only
// Villanueva: Tue/Thu/Fri
// Mendoza: Mon/Tue/Wed (surgery days, heavy)
// Cruz: Mon/Wed/Fri (cardiology clinic days)
const doctorWorkDays = [
  [1, 2, 3, 4, 5],   // Santos – every weekday
  [1, 3, 5],         // Reyes – Mon/Wed/Fri
  [2, 4, 5],         // Villanueva – Tue/Thu/Fri
  [1, 2, 3],         // Mendoza – Mon/Tue/Wed
  [1, 3, 5],         // Cruz – Mon/Wed/Fri
];

// Slot configs per doctor — different hours/day
const doctorSlotSets = [
  ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM'], // Santos
  ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'],  // Reyes – fewer slots (pediatrics)
  ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],  // Villanueva
  ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'], // Mendoza – surgery, early
  ['9:00 AM', '9:30 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'], // Cruz
];

// How booked each slot is by "day of week" — realistic variation
// Returns fraction of slots to pre-book (simulate past/existing bookings)
function bookedFraction(docIdx, dow, dayOfMonth) {
  // Use deterministic pseudo-random based on inputs
  const seed = (docIdx * 7 + dow * 13 + dayOfMonth * 3) % 100;
  if (seed < 20) return 1.0;   // fully booked
  if (seed < 40) return 0.75;  // mostly booked (limited)
  if (seed < 65) return 0.5;   // half booked
  if (seed < 80) return 0.25;  // few booked
  return 0;                     // completely open
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Wipe old schedules so varied data is fresh ────────────────────────────
  const deletedSchedules = await Schedule.deleteMany({});
  console.log(`  Wiped ${deletedSchedules.deletedCount} old schedules`);

  // ── Doctors ──────────────────────────────────────────────────────────────
  const doctors = [];
  for (const docData of sampleDoctors) {
    let doc = await User.findOne({ email: docData.email });
    if (!doc) {
      doc = await User.create({
        ...docData,
        password: 'Doctor@1234',
        role: 'doctor',
        isActive: true,
      });
      console.log(`  Created: Dr. ${doc.firstName} ${doc.lastName}`);
    } else {
      console.log(`  Exists:  Dr. ${doc.firstName} ${doc.lastName}`);
    }
    doctors.push(doc);
  }

  // ── Schedules (current month + next month) ───────────────────────────────
  const now = new Date();
  const months = [
    { year: now.getFullYear(), month: now.getMonth() },
    {
      year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      month: now.getMonth() === 11 ? 0 : now.getMonth() + 1,
    },
  ];

  for (let di = 0; di < doctors.length; di++) {
    const doctor = doctors[di];
    const workDays = doctorWorkDays[di];
    const slotTimes = doctorSlotSets[di];
    let created = 0;
    let skipped = 0;

    for (const { year, month } of months) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dow = date.getUTCDay();

        // Skip weekends and non-work-days for this doctor
        if (!workDays.includes(dow)) continue;

        const exists = await Schedule.findOne({ doctor: doctor._id, date });
        if (exists) { skipped++; continue; }

        // Determine how many slots are pre-booked
        const fraction = bookedFraction(di, dow, day);
        const numToBook = Math.floor(slotTimes.length * fraction);

        const slots = slotTimes.map((time, si) => ({
          time,
          isBooked: si < numToBook,
          bookedBy: null, // simplified — real bookings have a patient ref
        }));

        await Schedule.create({
          doctor: doctor._id,
          date,
          slots,
          isAvailable: numToBook < slotTimes.length,
        });
        created++;
      }
    }
    console.log(`  Schedules for Dr. ${doctor.lastName}: +${created} days created, ${skipped} already existed`);
  }

  // ── Test Patient ─────────────────────────────────────────────────────────
  let patient = await User.findOne({ role: 'patient' });
  if (!patient) {
    patient = await User.create({
      firstName: 'Bubby',
      lastName: 'Test',
      email: 'patient@staffmed.ph',
      password: 'Patient@1234',
      role: 'patient',
      demographics: {
        birthday: new Date('1995-08-20'),
        address: '456 Rizal Ave, Quezon City',
        philhealthNo: '12-987654321-0',
        contactNo: '+63-917-555-1234',
        emergencyContactName: 'Ana Test',
        emergencyContactNo: '+63-917-555-5678',
      },
    });
    console.log('  Created test patient: patient@staffmed.ph / Patient@1234');
  } else {
    console.log(`  Patient found: ${patient.email}`);
  }

  // ── Sample Appointments ──────────────────────────────────────────────────
  const existingAppts = await Appointment.countDocuments({ patient: patient._id });
  if (existingAppts === 0) {
    const [doc0, doc1, doc2] = doctors;

    // Upcoming — next weekday
    const nextWeekday = new Date();
    nextWeekday.setDate(nextWeekday.getDate() + 1);
    while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
      nextWeekday.setDate(nextWeekday.getDate() + 1);
    }
    const upcoming = new Date(Date.UTC(nextWeekday.getFullYear(), nextWeekday.getMonth(), nextWeekday.getDate()));

    await Appointment.create({
      patient: patient._id,
      physician: doc0._id,
      date: upcoming,
      time: '10:00 AM',
      department: doc0.department,
      chiefComplaint: 'General checkup and blood pressure monitoring',
      status: 'upcoming',
    });

    // Completed — April 15
    await Appointment.create({
      patient: patient._id,
      physician: doc1._id,
      date: new Date(Date.UTC(2026, 3, 15)),
      time: '2:00 PM',
      department: doc1.department,
      chiefComplaint: 'Fever and cough lasting more than 3 days',
      status: 'completed',
    });

    // Follow-up — April 22
    await Appointment.create({
      patient: patient._id,
      physician: doc1._id,
      date: new Date(Date.UTC(2026, 3, 22)),
      time: '2:00 PM',
      department: doc1.department,
      chiefComplaint: 'Follow-up after antibiotics course',
      status: 'follow-up',
    });

    // Cancelled — April 5
    await Appointment.create({
      patient: patient._id,
      physician: doc2._id,
      date: new Date(Date.UTC(2026, 3, 5)),
      time: '11:00 AM',
      department: doc2.department,
      chiefComplaint: 'Routine blood test follow-up',
      status: 'cancelled',
      cancelReason: 'Had a scheduling conflict',
      cancelledAt: new Date(),
    });

    console.log('  Created 4 sample appointments');
  } else {
    console.log(`  Appointments already exist (${existingAppts}) — skipping`);
  }

  console.log('\n✅ Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
