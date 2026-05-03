# StaffMed — Pelican Hospital Management System

A full-stack web application for managing hospital appointments, physician schedules, and patient records. Built for **Pelican Hospital**, StaffMed supports multiple staff roles with role-specific dashboards and workflows.

---

## Features

### Patient
- Book appointments with available physicians by browsing a live calendar
- View, manage, and cancel upcoming appointments
- Community page and FAQ
- Profile with demographics and identity verification

### Doctor
- View today's and upcoming patient appointments
- Mark appointments as completed or follow-up
- Manage personal schedule

### Nurse
- View and verify patient appointments before consultations
- Upload and manage physician schedules (CSV)
- Identity verification flow per appointment

### Admin
- Manage all users (activate/deactivate, change roles)
- View all appointments across all physicians

### IT
- System dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, MUI |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, Google OAuth 2.0 |

---

## Project Structure

```
bubbys_website/
├── backend/                  # Express API
│   └── src/
│       ├── config/           # DB connection
│       ├── middleware/        # Auth (protect, authorize)
│       ├── models/           # Mongoose models (User, Appointment, Schedule)
│       ├── routes/           # REST API routes
│       │   ├── auth.js
│       │   ├── appointments.js
│       │   ├── physicians.js
│       │   ├── schedules.js
│       │   └── users.js
│       ├── seed.js           # Database seeder
│       └── index.js          # Entry point (port 5000)
│
└── frontend/                 # React SPA
    └── src/
        ├── components/
        │   ├── auth/         # Login, Register, Google Onboarding
        │   ├── common/       # Shared: Card, ThemeSwitch, FaceRecognition
        │   ├── doctor/       # DoctorView
        │   ├── nurse/        # NurseView
        │   ├── admin/        # AdminView
        │   ├── it/           # ITView
        │   ├── BookPage.jsx
        │   ├── ManagePage.jsx
        │   ├── ConfirmationPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── CommunityPage.jsx
        │   ├── AboutPage.jsx
        │   ├── FAQPage.jsx
        │   └── Navbar.jsx
        ├── context/          # AuthContext
        ├── services/         # Axios API wrappers
        └── App.jsx           # Router + route guards
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repository

```bash
git clone <repo-url>
cd bubbys_website
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/staffmed?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
```

Seed the database (optional):

```bash
npm run seed
```

Start the server:

```bash
npm start          # production
npm run dev        # development (nodemon)
```

API runs on `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.

---

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/physicians` | List all physicians |
| GET | `/api/appointments` | Get appointments (role-filtered) |
| POST | `/api/appointments` | Book appointment (patient) |
| PATCH | `/api/appointments/:id/cancel` | Cancel appointment |
| PATCH | `/api/appointments/:id/complete` | Mark completed (doctor) |
| PATCH | `/api/appointments/:id/verify` | Verify patient (nurse) |
| GET | `/api/schedules` | Get physician schedules |
| POST | `/api/schedules` | Create schedule (nurse/admin) |
| GET | `/api/users` | List all users (admin) |
| GET | `/api/health` | Health check |

---

## User Roles

| Role | Default Route |
|---|---|
| `patient` | `/book` |
| `doctor` | `/schedule` |
| `nurse` | `/appointments` |
| `admin` | `/users` |
| `it` | `/dashboard` |

---

## Notes

- All appointment dates are stored at **UTC midnight** to prevent timezone shifting.
- Schedules are uploaded per-physician and linked by date + time slot.
- The identity verification UI accesses the device camera live for display only — no images or frames are captured or stored.
- Google OAuth requires an authorized origin registered in Google Cloud Console.
