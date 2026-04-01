const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Single admin client — used for all DB operations only (no Supabase Auth)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
