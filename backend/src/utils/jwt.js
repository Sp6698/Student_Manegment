const jwt = require('jsonwebtoken');

// Trim any accidental whitespace/newlines from the env value
// then decode from base64 — Supabase JWT secret is base64-encoded
const getSecret = () => {
  const raw = (process.env.JWT_SECRET || '').trim();
  if (!raw) throw new Error('JWT_SECRET is not set in environment variables');
  return Buffer.from(raw, 'base64');
};

const signToken = (payload) =>
  jwt.sign(payload, getSecret(), {
    algorithm: 'HS256',
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d').trim(),
  });

const verifyToken = (token) =>
  jwt.verify(token, getSecret(), { algorithms: ['HS256'] });

module.exports = { signToken, verifyToken };
