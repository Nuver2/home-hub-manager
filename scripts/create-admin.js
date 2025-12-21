#!/usr/bin/env node

/**
 * Script to create the first admin (parent) account
 * Usage: node scripts/create-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('🏠 Home Hub Manager - Create Admin Account\n');
  console.log('This script will create the first admin (parent) account.\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.VITE_SUPBASE_URL || env.VITE_SUPBASE_URL;
  const supabaseServiceKey = process.env.SUPBASE_SERVICE_ROLE_KEY || env.SUPBASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: VITE_SUPBASE_URL not found in environment variables');
    console.error('Please set it in your .env file or export it before running this script.');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Error: SUPBASE_SERVICE_ROLE_KEY not found in environment variables');
    console.error('\n📝 To fix this:');
    console.error('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.error('2. Select your project');
    console.error('3. Go to: Settings → API');
    console.error('4. Find the "service_role" key (it\'s a secret key, different from the anon key)');
    console.error('5. Add it to your .env file:');
    console.error('   SUPBASE_SERVICE_ROLE_KEY="your-service-role-key-here"');
    console.error('\n⚠️  Keep this key secret! Never commit it to git.\n');
    process.exit(1);
  }

  // Get admin details
  const email = await question('Email: ');
  const password = await question('Password (min 8 chars, must include uppercase, lowercase, number): ');
  const name = await question('Full Name: ');
  const username = await question('Username: ');

  // Validate password
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  if (!/[A-Z]/.test(password)) {
    console.error('❌ Password must contain at least one uppercase letter');
    process.exit(1);
  }

  if (!/[a-z]/.test(password)) {
    console.error('❌ Password must contain at least one lowercase letter');
    process.exit(1);
  }

  if (!/[0-9]/.test(password)) {
    console.error('❌ Password must contain at least one number');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('\n⏳ Creating admin account...\n');

  try {
    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created');

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s/g, '_'),
        status: 'active',
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      process.exit(1);
    }

    console.log('✅ Profile created');

    // Create role (parent = admin)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'parent',
      });

    if (roleError) {
      console.error('❌ Error creating role:', roleError.message);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      process.exit(1);
    }

    console.log('✅ Admin role assigned\n');
    console.log('🎉 Admin account created successfully!');
    console.log(`\nYou can now log in with:`);
    console.log(`   Email: ${email.trim().toLowerCase()}`);
    console.log(`   Password: [the password you entered]\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();

