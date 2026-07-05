// Admin-Seed: löscht admin@example.com falls vorhanden, erstellt ihn neu als admin
// Aufruf: node scripts/seed-admin.mjs
// Erfordert SUPABASE_API_URL und SUPABASE_SECRET_KEY in backend/.env

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', 'backend', '.env') });

const SUPABASE_URL = process.env.SUPABASE_API_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_API_URL oder SUPABASE_SECRET_KEY fehlt in backend/.env');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedAdmin() {
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_EMAIL);

  if (findErr) {
    console.error('Fehler beim Suchen:', findErr.message);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log(`Lösche existierenden User ${ADMIN_EMAIL}...`);
    const { error: delErr } = await supabase
      .from('users')
      .delete()
      .eq('email', ADMIN_EMAIL);
    if (delErr) {
      console.error('Fehler beim Löschen:', delErr.message);
      process.exit(1);
    }
    console.log('Gelöscht.');
  }

  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  const { data, error } = await supabase.from('users').insert({
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    display_name: 'Admin',
    role: 'admin',
  }).select('id, email, role');

  if (error) {
    console.error('Fehler beim Erstellen:', error.message);
    process.exit(1);
  }

  console.log('Admin erstellt:', data[0]);
}

seedAdmin();
