-- ============================================================
-- Drop existing tables (clean slate)
-- ============================================================
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS teacher_students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- Users table (custom auth — NO Supabase Auth)
-- ============================================================
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   TEXT NOT NULL,           -- bcrypt hashed
  role       VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
               CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT')),
  is_active  BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Students table (profile for STUDENT role)
-- ============================================================
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  age             INTEGER NOT NULL CHECK (age > 0 AND age < 120),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Teachers table (profile for TEACHER role)
-- ============================================================
CREATE TABLE teachers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Subjects lookup table
-- ============================================================
CREATE TABLE subjects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  code        VARCHAR(20)  UNIQUE NOT NULL,
  description TEXT
);

-- ============================================================
-- Teacher-Student assignments
-- ============================================================
CREATE TABLE teacher_students (
  id         SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

CREATE INDEX idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX idx_teacher_students_student ON teacher_students(student_id);

-- ============================================================
-- Marks table (teachers enter marks for students)
-- ============================================================
CREATE TABLE marks (
  id          SERIAL PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  entered_by  UUID REFERENCES teachers(id),   -- which teacher entered this
  score       NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  grade       VARCHAR(2),
  remarks     TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);

-- ============================================================
-- Seed subjects
-- ============================================================
INSERT INTO subjects (name, code, description) VALUES
  ('Mathematics',       'MATH101', 'Basic Mathematics'),
  ('Science',           'SCI101',  'General Science'),
  ('English',           'ENG101',  'English Language'),
  ('History',           'HIST101', 'World History'),
  ('Computer Science',  'CS101',   'Introduction to Programming');
