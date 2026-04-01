require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function debug() {
  const testEmail = 'itadmin@school.com';
  const testPassword = 'itadmin123';

  console.log('=== DEBUG LOGIN ===\n');

  // Step 1: Check if users table exists and has rows
  const { data: count, error: countErr } = await supabase
    .from('users')
    .select('id, email, role', { count: 'exact' });

  if (countErr) {
    console.error('ERROR fetching users table:', countErr.message);
    console.error('Code:', countErr.code);
    console.error('Hint:', countErr.hint);
    console.log('\n=> Likely cause: RLS is blocking reads. Run this in Supabase SQL Editor:');
    console.log('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    return;
  }

  console.log(`Users in DB: ${count?.length ?? 0}`);
  if (count?.length) {
    console.log('Emails found:', count.map((u) => `${u.email} (${u.role})`).join(', '));
  } else {
    console.log('\n=> Table is empty. Run: npm run seed');
    return;
  }

  // Step 2: Fetch specific user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, password, role, is_active')
    .eq('email', testEmail)
    .single();

  if (userErr || !user) {
    console.error(`\nERROR: Could not find user with email "${testEmail}"`);
    console.error(userErr?.message);
    return;
  }

  console.log(`\nFound user: ${user.name} | role: ${user.role} | active: ${user.is_active}`);
  console.log(`Password hash starts with: ${user.password?.substring(0, 10)}...`);

  // Step 3: Test bcrypt compare
  const isMatch = await bcrypt.compare(testPassword, user.password);
  console.log(`\nbcrypt.compare("${testPassword}", hash) => ${isMatch}`);

  if (!isMatch) {
    console.log('\n=> Password mismatch. The hash in DB does not match the password.');
    console.log('   This can happen if the seed ran but bcrypt hashing failed silently.');
    console.log('   Fix: Re-run schema.sql to wipe data, then npm run seed again.');
  } else {
    console.log('\n=> Login should work. Check JWT_SECRET in .env is set correctly.');
    const { signToken } = require('./utils/jwt');
    try {
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      console.log('JWT signed successfully. Token starts with:', token.substring(0, 20) + '...');
    } catch (e) {
      console.error('JWT signing failed:', e.message);
      console.log('=> Check JWT_SECRET in .env');
    }
  }
}

debug();
