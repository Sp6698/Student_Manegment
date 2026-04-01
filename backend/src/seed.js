require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

const hash = (pw) => bcrypt.hash(pw, 12);

async function seed() {
  console.log('Seeding database...\n');

  // Verify connection
  const { data: subjects, error: subErr } = await supabase
    .from('subjects').select('id, name').order('id');
  if (subErr) { console.error('DB connection failed:', subErr.message); process.exit(1); }
  console.log(`DB connected. Subjects: ${subjects.map((s) => s.name).join(', ')}\n`);

  // Skip if already seeded
  const { data: existing } = await supabase
    .from('users').select('id').eq('email', 'itadmin@school.com').single();
  if (existing) { console.log('Already seeded. Skipping.'); return; }

  // 1. SUPER_ADMIN — IT Department
  const { data: sa } = await supabase
    .from('users')
    .insert([{ name: 'IT Admin', email: 'itadmin@school.com', password: await hash('itadmin123'), role: 'SUPER_ADMIN' }])
    .select('id').single();
  console.log('Created SUPER_ADMIN (IT Dept): itadmin@school.com / itadmin123');

  // 2. ADMIN — Principal
  const { data: principal } = await supabase
    .from('users')
    .insert([{ name: 'Principal Sarah', email: 'principal@school.com', password: await hash('principal123'), role: 'ADMIN', created_by: sa.id }])
    .select('id').single();
  console.log('Created ADMIN (Principal): principal@school.com / principal123');

  // 3. TEACHERs
  const teacherData = [
    { name: 'Mr. John Math',    email: 'john.math@school.com' },
    { name: 'Ms. Lisa Science', email: 'lisa.science@school.com' },
    { name: 'Mr. Tom English',  email: 'tom.english@school.com' },
  ];

  const teacherIds = [];
  for (const t of teacherData) {
    const { data: user } = await supabase
      .from('users')
      .insert([{ name: t.name, email: t.email, password: await hash('teacher123'), role: 'TEACHER', created_by: principal.id }])
      .select('id').single();
    const { data: teacher } = await supabase
      .from('teachers')
      .insert([{ user_id: user.id }])
      .select('id').single();
    teacherIds.push(teacher.id);
    console.log(`Created TEACHER: ${t.email} / teacher123`);
  }

  // 4. STUDENTs + assign 3 per teacher + seed marks
  const studentData = [
    { name: 'Alice Johnson', email: 'alice@school.com',  age: 16 },
    { name: 'Bob Smith',     email: 'bob@school.com',    age: 17 },
    { name: 'Carol White',   email: 'carol@school.com',  age: 15 },
    { name: 'David Brown',   email: 'david@school.com',  age: 16 },
    { name: 'Eva Martinez',  email: 'eva@school.com',    age: 17 },
    { name: 'Frank Lee',     email: 'frank@school.com',  age: 16 },
    { name: 'Grace Kim',     email: 'grace@school.com',  age: 15 },
    { name: 'Henry Wilson',  email: 'henry@school.com',  age: 17 },
    { name: 'Isla Davis',    email: 'isla@school.com',   age: 16 },
  ];

  const studentIds = [];
  for (const s of studentData) {
    const { data: user } = await supabase
      .from('users')
      .insert([{ name: s.name, email: s.email, password: await hash('student123'), role: 'STUDENT', created_by: principal.id }])
      .select('id').single();
    const { data: student } = await supabase
      .from('students')
      .insert([{ user_id: user.id, age: s.age }])
      .select('id').single();
    studentIds.push(student.id);
    console.log(`Created STUDENT: ${s.email} / student123`);
  }

  // Assign exactly 3 students per teacher (non-overlapping groups)
  // Teacher 0 → students 0,1,2 | Teacher 1 → students 3,4,5 | Teacher 2 → students 6,7,8
  for (let t = 0; t < teacherIds.length; t++) {
    const chunk = studentIds.slice(t * 3, t * 3 + 3);
    for (const sid of chunk) {
      await supabase.from('teacher_students').insert([{ teacher_id: teacherIds[t], student_id: sid }]);
    }
    console.log(`Assigned students ${t * 3 + 1}–${t * 3 + 3} to teacher ${t + 1}`);

    // Seed marks for each assigned student
    for (const sid of chunk) {
      const markRows = subjects.map((sub) => ({
        student_id: sid,
        subject_id: sub.id,
        entered_by: teacherIds[t],
        score: 50 + Math.floor(Math.random() * 50),
        grade: 'B',
        remarks: 'Seeded',
      }));
      await supabase.from('marks').upsert(markRows, { onConflict: 'student_id,subject_id' });
    }
  }
  console.log('Seeded marks for all assigned students');

  console.log('\nSeed complete!\n');
  console.log('Login credentials:');
  console.log('  SUPER_ADMIN  itadmin@school.com          /  itadmin123');
  console.log('  ADMIN        principal@school.com        /  principal123');
  console.log('  TEACHER 1    john.math@school.com        /  teacher123');
  console.log('  TEACHER 2    lisa.science@school.com     /  teacher123');
  console.log('  TEACHER 3    tom.english@school.com      /  teacher123');
  console.log('  STUDENT 1    alice@school.com            /  student123');
  console.log('  STUDENT 2    bob@school.com              /  student123');
  console.log('  STUDENT 3    carol@school.com            /  student123');
  console.log('  (students 4–9 follow same pattern)');
}

seed();
