# EduManage — School Management System

A full-stack school management platform built with **Node.js + Express**, **React.js**, and **Supabase (PostgreSQL)**. Features role-based access control, JWT authentication, teacher-student assignment, marks management, and a modern responsive UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) — DB only, no Supabase Auth |
| Authentication | Custom JWT (jsonwebtoken + bcryptjs) |
| Frontend | React.js + Vite + Tailwind CSS + MUI |
| Alerts | SweetAlert2 |
| HTTP Client | Axios |

---

## Project Structure

```
Student_connect/
├── backend/
│   ├── src/
│   │   ├── config/         supabase.js
│   │   ├── controllers/    auth, superAdmin, admin, user, student
│   │   ├── middleware/     authMiddleware, roleMiddleware, errorHandler
│   │   ├── routes/         auth, superAdmin, admin, user, students, subjects
│   │   ├── services/       authService, userService, marksService
│   │   ├── utils/          jwt, validators, response, logger
│   │   ├── app.js
│   │   ├── server.js
│   │   └── seed.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     Navbar, MainLayout, StatCard, Pagination, GradeBadge
│   │   ├── context/        AuthContext
│   │   ├── pages/
│   │   │   ├── LoginPage
│   │   │   ├── SuperAdminDashboard
│   │   │   ├── AdminDashboard
│   │   │   ├── teacher/    TeacherHomePage, TeacherStudentsPage, TeacherMarksPage
│   │   │   └── student/    StudentDashboard, StudentMarksPage
│   │   └── services/       api.js
│   └── package.json
├── schema.sql              ← Run this first in Supabase SQL Editor
├── migration_001_soft_delete.sql
├── postman_collection.json
└── INTERVIEW_GUIDE.md
```

---

## Roles

| Role | Person | Access |
|------|--------|--------|
| `SUPER_ADMIN` | IT Department | Creates Principals |
| `ADMIN` | Principal | Creates Teachers & Students |
| `TEACHER` | Teacher | Manages own students & marks |
| `STUDENT` | Student | Views own report card |

---

## Quick Start

### Step 1 — Supabase Database Setup

> See detailed instructions in [INTERVIEW_GUIDE.md](./INTERVIEW_GUIDE.md)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `schema.sql`
3. Run `migration_001_soft_delete.sql` in SQL Editor as well

### Step 2 — Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-supabase-legacy-hs256-secret
JWT_EXPIRES_IN=1d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

```bash
npm run seed    # creates all demo users + marks
npm run dev     # starts API on http://localhost:5000
```

### Step 3 — Frontend (development)

```bash
cd frontend
npm install
npm run dev     # starts on http://localhost:5173
```

### Step 3 (alt) — Run everything on port 5000

```bash
cd frontend && npm run build
cd ../backend && npm run dev
# Open http://localhost:5000
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| IT Admin | itadmin@school.com | itadmin123 |
| Principal | principal@school.com | principal123 |
| Teacher 1 | john.math@school.com | teacher123 |
| Teacher 2 | lisa.science@school.com | teacher123 |
| Teacher 3 | tom.english@school.com | teacher123 |
| Student | alice@school.com | student123 |

---

## API Overview

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Any | Current user |
| POST | `/api/super-admin/create-admin` | SUPER_ADMIN | Create principal |
| GET | `/api/super-admin/admins` | SUPER_ADMIN | List principals |
| POST | `/api/admin/create-user` | ADMIN | Create teacher/student |
| GET | `/api/admin/users` | ADMIN | List users (paginated) |
| GET | `/api/teacher/students` | TEACHER | My students + marks |
| POST | `/api/teacher/marks` | TEACHER | Add/update mark |
| GET | `/api/student/marks` | STUDENT | My report card |

---

## Deployment

### Build for production

```bash
cd frontend && npm run build
cd ../backend
NODE_ENV=production npm start
```

The backend serves the built React app from `frontend/dist/` on the same port.

### Environment variables for hosting

```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
CLIENT_URL=https://yourdomain.com
```
