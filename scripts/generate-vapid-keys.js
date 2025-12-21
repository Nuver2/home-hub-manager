#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push Notifications
 * 
 * Install web-push first: npm install -g web-push
 * Then run: node scripts/generate-vapid-keys.js
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('🔑 Generating VAPID keys for Web Push Notifications...\n');
  
  // Try to generate keys using npx (works even if not globally installed)
  let output;
  try {
    output = execSync('npx -y web-push generate-vapid-keys', { encoding: 'utf-8' });
  } catch (error) {
    // Fallback: try without npx (if globally installed)
    try {
      output = execSync('web-push generate-vapid-keys', { encoding: 'utf-8' });
    } catch (fallbackError) {
      console.error('❌ Error: Could not run web-push.');
      console.error('\n📦 Try installing it:');
      console.error('   npm install -g web-push');
      console.error('\nOr run directly:');
      console.error('   npx web-push generate-vapid-keys\n');
      process.exit(1);
    }
  }
  const lines = output.trim().split('\n');
  
  let publicKey = '';
  let privateKey = '';
  
  // Parse keys - they can be on the same line or next line after the label
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('Public Key:')) {
      // Check if key is on same line
      const parts = line.split('Public Key:');
      if (parts.length > 1 && parts[1].trim()) {
        publicKey = parts[1].trim();
      } else {
        // Key is on next line
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine && !nextLine.includes('Key') && !nextLine.includes('=')) {
          publicKey = nextLine;
        }
      }
    }
    
    if (line.includes('Private Key:')) {
      // Check if key is on same line
      const parts = line.split('Private Key:');
      if (parts.length > 1 && parts[1].trim()) {
        privateKey = parts[1].trim();
      } else {
        // Key is on next line
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine && !nextLine.includes('Key') && !nextLine.includes('=')) {
          privateKey = nextLine;
        }
      }
    }
  }
  
  // Fallback: look for base64-like strings if parsing failed
  if (!publicKey || !privateKey) {
    const keyCandidates = lines
      .map(line => line.trim())
      .filter(line => {
        return line && 
               !line.includes('=') && 
               !line.includes('Key') &&
               !line.includes('-'.repeat(10)) && // Skip separator lines
               line.length > 20 &&
               /^[A-Za-z0-9_-]+$/.test(line);
      });
    
    if (keyCandidates.length >= 2) {
      publicKey = publicKey || keyCandidates[0];
      privateKey = privateKey || keyCandidates[1];
    }
  }

  if (!publicKey || !privateKey) {
    console.error('❌ Failed to parse VAPID keys from output');
    console.log('Raw output:', output);
    process.exit(1);
  }

  console.log('✅ VAPID keys generated!\n');
  console.log('📋 Add these to your .env file:\n');
  console.log(`VITE_VAPID_PUBLIC_KEY="${publicKey}"`);
  console.log(`SUPABASE_VAPID_PRIVATE_KEY="${privateKey}"\n`);
  console.log('⚠️  Keep the private key SECRET! Never commit it to git.\n');

  // Try to update .env file
  try {
    const envPath = join(__dirname, '..', '.env');
    let envContent = '';
    
    try {
      envContent = readFileSync(envPath, 'utf-8');
    } catch {
      // .env doesn't exist, that's okay
    }

    // Check if keys already exist
    if (envContent.includes('VITE_VAPID_PUBLIC_KEY')) {
      console.log('⚠️  VAPID keys already exist in .env file.');
      console.log('   Please update them manually with the keys above.\n');
    } else {
      // Append to .env
      const newLines = [
        '',
        '# VAPID Keys for Web Push Notifications',
        `VITE_VAPID_PUBLIC_KEY="${publicKey}"`,
        `SUPABASE_VAPID_PRIVATE_KEY="${privateKey}"`,
      ];
      
      writeFileSync(envPath, envContent + '\n' + newLines.join('\n') + '\n', 'utf-8');
      console.log('✅ Keys added to .env file!\n');
    }
  } catch (error) {
    console.log('⚠️  Could not automatically update .env file.');
    console.log('   Please add the keys manually.\n');
  }

} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  process.exit(1);
}

