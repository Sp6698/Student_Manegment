const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const login = async (email, password) => {
  // Step 1: Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password, role, is_active')
    .eq('email', email)
    .single();

  if (error) {
    logger.error(`DB lookup error for ${email}: ${error.message} (code: ${error.code})`);
    throw new Error('Invalid email or password');
  }
  if (!user) {
    logger.error(`No user found for email: ${email}`);
    throw new Error('Invalid email or password');
  }

  logger.info(`User found: ${user.email} | role: ${user.role} | active: ${user.is_active}`);

  // Step 2: Check active
  if (!user.is_active) throw new Error('Account is deactivated');

  // Step 3: bcrypt compare
  const isMatch = await bcrypt.compare(password, user.password);
  logger.info(`bcrypt compare result for ${email}: ${isMatch}`);

  if (!isMatch) throw new Error('Invalid email or password');

  // Step 4: Sign token
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  logger.info(`Token signed for ${user.email}`);

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

module.exports = { login };
