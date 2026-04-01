# Interview Guide — EduManage School Management System

---

## ⚡ First-Time Setup (Step by Step)

### Step 1 — Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `edumanage` (or anything)
   - **Database Password**: set a strong password (save it)
   - **Region**: choose closest to you
4. Click **"Create new project"** — wait ~2 minutes for it to provision

---

### Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `schema.sql` from this project root
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)

You should see: `Success. No rows returned`

This creates these tables:
- `users` — all accounts (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)
- `students` — student profiles
- `teachers` — teacher profiles
- `teacher_students` — which teacher has which students
- `subjects` — Math, Science, English, History, Computer Science
- `marks` — student marks per subject

---

### Step 3 — Run the Soft Delete Migration

1. Still in **SQL Editor**, click **"New query"**
2. Open `migration_001_soft_delete.sql` from this project root
3. Copy and paste into SQL Editor
4. Click **"Run"**

This adds `deleted_at` columns for soft delete support.

---

### Step 4 — Get Your Supabase Credentials

Go to **Project Settings** → **API** (left sidebar):

| Key | Where to find it |
|-----|-----------------|
| `SUPABASE_URL` | "Project URL" — looks like `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | "service_role" key under "Project API keys" |

Go to **Project Settings** → **JWT Keys**:

| Key | Where to find it |
|-----|-----------------|
| `JWT_SECRET` | Click the 3-dot menu on **"Legacy HS256 (Shared Secret)"** → Reveal → Copy |

> ⚠️ Use the **Legacy HS256** key, NOT the ECC (P-256) key. The HS256 key works directly with `jsonwebtoken`.

---

### Step 5 — Configure Backend Environment

Create `backend/.env` with your credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...your-service-role-key
JWT_SECRET=your-legacy-hs256-secret-from-supabase
JWT_EXPIRES_IN=1d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

---

### Step 6 — Install & Run Backend

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
[INFO] Server running on http://0.0.0.0:5000
[INFO] Environment: development
```

---

### Step 7 — Seed the Database

```bash
cd backend
npm run seed
```

Expected output:
```
Seeding database...

DB connected. Subjects: Mathematics, Science, English, History, Computer Science

Created SUPER_ADMIN (IT Dept): itadmin@school.com
Created ADMIN (Principal): principal@school.com
Created TEACHER: john.math@school.com / teacher123
Created TEACHER: lisa.science@school.com / teacher123
Created TEACHER: tom.english@school.com / teacher123
Created STUDENT: alice@school.com / student123
...

Seed complete!

Login credentials:
  SUPER_ADMIN  itadmin@school.com          /  itadmin123
  ADMIN        principal@school.com        /  principal123
  TEACHER 1    john.math@school.com        /  teacher123
  TEACHER 2    lisa.science@school.com     /  teacher123
  TEACHER 3    tom.english@school.com      /  teacher123
  STUDENT 1    alice@school.com            /  student123
```

If you see `DB connection failed` — check your `.env` credentials and make sure the Supabase project is not paused.

---

### Step 8 — Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### Step 8 (alt) — Run Everything on One Port

```bash
# Build the React app
cd frontend
npm run build

# Start backend (serves both API + frontend)
cd ../backend
npm run dev
```

Open `http://localhost:5000` — the backend serves the built React app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) — DB only, no Supabase Auth |
| Authentication | Custom JWT (jsonwebtoken + bcryptjs) |
| Frontend | React.js + Vite + Tailwind CSS + MUI |
| Alerts | SweetAlert2 |

---

## Architecture

```
backend/src/
├── config/         supabase.js          — Supabase client (DB only)
├── controllers/    authController       — Login, /me
│                   superAdminController — Create/list admins
│                   adminController      — Create/manage teachers & students
│                   userController       — Teacher & student actions
│                   studentController    — Student list for admin view
├── middleware/     authMiddleware        — JWT verification
│                   roleMiddleware        — Role-based access
│                   errorHandler          — Global error handler
├── routes/         auth, superAdmin, admin, user, students, subjects
├── services/       authService          — Login logic
│                   userService          — User CRUD
│                   marksService         — Marks + teacher-student assignments
├── utils/          jwt.js               — Sign/verify token
│                   validators.js        — Joi input validation
│                   response.js          — Consistent API responses
│                   logger.js            — Winston logging
├── app.js          Express setup + route mounting + static file serving
└── server.js       HTTP listener + graceful shutdown
```

---

## Authentication — How It Works

### No Supabase Auth — 100% Custom JWT

```
POST /api/auth/login
  Body: { email, password }

  Step 1: Joi validates the input
  Step 2: Query users table by email
  Step 3: bcrypt.compare(password, stored_hash)
  Step 4: jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '1d' })
  Step 5: Return { token, user: { id, name, email, role } }
```

### Password Hashing

```js
// On user creation
const hashed = await bcrypt.hash(password, 12);  // 12 salt rounds

// On login
const isMatch = await bcrypt.compare(plainPassword, hashedFromDB);
```

### JWT Secret — Supabase HS256 Key

```js
// utils/jwt.js
const getSecret = () => Buffer.from(process.env.JWT_SECRET.trim(), 'base64');

const signToken = (payload) =>
  jwt.sign(payload, getSecret(), { algorithm: 'HS256', expiresIn: '1d' });

const verifyToken = (token) =>
  jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
```

The Supabase JWT secret is base64-encoded — we decode it to a Buffer before use.

---

## JWT Middleware — authMiddleware.js

```js
const authMiddleware = async (req, res, next) => {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'No token provided', 401);

  // 2. Verify signature + expiry
  let decoded;
  try { decoded = verifyToken(token); }
  catch { return error(res, 'Invalid or expired token', 401); }

  // 3. Fetch fresh user from DB (catches deactivated/deleted accounts)
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, role, is_active, deleted_at')
    .eq('id', decoded.id)
    .is('deleted_at', null)
    .single();

  if (!user) return error(res, 'User not found', 401);
  if (!user.is_active) return error(res, 'Account is deactivated', 403);

  req.user = user;
  next();
};
```

**Why fetch from DB on every request?** If an admin deactivates a user after they logged in, the token is still valid. Fetching from DB ensures real-time account status.

---

## Role Middleware — roleMiddleware.js

```js
const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, `Access denied. Required: ${roles.join(' or ')}`, 403);
  }
  next();
};

// Usage in routes:
router.use(authMiddleware, allowRoles('SUPER_ADMIN'));
router.post('/create-user', authMiddleware, allowRoles('ADMIN', 'SUPER_ADMIN'), createUser);
```

---

## All API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |

```json
POST /api/auth/login
{ "email": "itadmin@school.com", "password": "itadmin123" }

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "name": "IT Admin", "email": "...", "role": "SUPER_ADMIN" }
  }
}
```

### Super Admin — `/api/super-admin` (SUPER_ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/super-admin/create-admin` | Create a Principal |
| GET | `/api/super-admin/admins?page=1&limit=10` | List Principals |

### Admin — `/api/admin` (ADMIN or SUPER_ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/create-user` | Create Teacher or Student |
| GET | `/api/admin/users?role=TEACHER&page=1&limit=10&search=` | List users |
| PUT | `/api/admin/user/:id` | Update user |
| DELETE | `/api/admin/user/:id` | Soft delete user |

```json
POST /api/admin/create-user
{
  "name": "Alice",
  "email": "alice@school.com",
  "password": "pass123",
  "role": "STUDENT",
  "age": 16,
  "teacher_id": "uuid-of-teacher"  // optional — assigns student to teacher
}
```

### Teacher — `/api/teacher/*` (TEACHER only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/students?page=1&limit=10&search=` | My students + marks |
| GET | `/api/teacher/unassigned-students` | Students not yet assigned |
| POST | `/api/teacher/assign-student` | Assign existing student |
| DELETE | `/api/teacher/unassign-student/:studentId` | Remove from class |
| POST | `/api/teacher/create-student` | Create new student + auto-assign |
| POST | `/api/teacher/marks` | Add/update a mark (upsert) |
| DELETE | `/api/teacher/marks/:markId` | Soft delete a mark |
| GET | `/api/teacher/marks?page=1&limit=10&search=` | All marks entered |

### Student — `/api/student/*` (STUDENT only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/marks?page=1&limit=20` | Own marks + summary |

### Shared

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | Any | Own full profile |
| GET | `/api/subjects` | Any | All subjects |

---

## Pagination

All list endpoints return:

```json
{
  "success": true,
  "data": {
    "data": [ ...items ],
    "meta": {
      "total": 25,
      "page": 2,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

Query params: `?page=1&limit=10&search=alice`

---

## Soft Delete

Deleting a user sets `deleted_at` — record stays in DB for audit trail.

```js
// Soft delete
await supabase.from('users')
  .update({ is_active: false, deleted_at: new Date() })
  .eq('id', id);

// All queries filter it out
.is('deleted_at', null)
```

---

## Role-Based Access Summary

| Role | Who | Can Do |
|------|-----|--------|
| `SUPER_ADMIN` | IT Department | Create Principals, view all admins |
| `ADMIN` | Principal | Create Teachers & Students, manage all users |
| `TEACHER` | Teacher | Manage own students, enter/edit/delete marks |
| `STUDENT` | Student | View own marks only (read-only) |

**Important:** Role checks happen in backend middleware — the frontend only hides/shows UI elements, but the API rejects unauthorized requests regardless.

---

## Frontend JWT Flow

```js
// After login — store token
localStorage.setItem('token', token);

// Axios interceptor — attach to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — redirect to login if token expires
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

On app load, `AuthContext` calls `GET /api/auth/me` to restore the session — refreshing the page doesn't log you out.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| IT Admin (SUPER_ADMIN) | itadmin@school.com | itadmin123 |
| Principal (ADMIN) | principal@school.com | principal123 |
| Teacher 1 | john.math@school.com | teacher123 |
| Teacher 2 | lisa.science@school.com | teacher123 |
| Teacher 3 | tom.english@school.com | teacher123 |
| Student | alice@school.com | student123 |
| Student | bob@school.com | student123 |
| Student | carol@school.com | student123 |

**Teacher assignments (seeded):**
- John Math → Alice, Bob, Carol
- Lisa Science → David, Eva, Frank
- Tom English → Grace, Henry, Isla

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `TypeError: fetch failed` | Supabase project paused | Go to supabase.com → Restore project |
| `Invalid email or password` | Wrong credentials or DB empty | Run `npm run seed` |
| `JWT_SECRET` error | Wrong key format | Use Legacy HS256 key from Supabase JWT settings |
| `500 on /assets/*.js` | Frontend not built | Run `cd frontend && npm run build` |
| `422 Validation failed` | Missing/wrong request fields | Check request body matches schema |
| `403 Access denied` | Wrong role for endpoint | Login with correct role account |
