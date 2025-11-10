#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * Run this to verify your Firebase environment variables are properly set
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Firebase Configuration...\n');

// Load .env.local file
const envPath = path.join(__dirname, '.env.local');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log(`📄 Found .env.local file with ${Object.keys(envVars).length} variables\n`);
} else {
  console.log('⚠️  No .env.local file found in project root!\n');
}

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let allPresent = true;
let hasValues = true;

requiredVars.forEach(varName => {
  const value = envVars[varName] || process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  } else if (value.includes('your-') || value.includes('123456')) {
    console.log(`⚠️  ${varName}: PLACEHOLDER VALUE (needs to be replaced)`);
    hasValues = false;
  } else {
    // Show first 20 chars to verify it's set without exposing the full key
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (!allPresent) {
  console.log('❌ PROBLEM: Missing environment variables\n');
  console.log('SOLUTION:');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add all required NEXT_PUBLIC_FIREBASE_* variables');
  console.log('3. Get values from Firebase Console → Project Settings → Your Apps');
  console.log('\nExample .env.local:');
  console.log('─'.repeat(60));
  requiredVars.forEach(v => console.log(`${v}=your-value-here`));
  console.log('─'.repeat(60));
  process.exit(1);
} else if (!hasValues) {
  console.log('⚠️  WARNING: Some variables have placeholder values\n');
  console.log('SOLUTION:');
  console.log('Replace placeholder values with actual Firebase config from:');
  console.log('Firebase Console → Project Settings → Your Apps\n');
  process.exit(1);
} else {
  console.log('✅ All Firebase environment variables are properly set!\n');
  console.log('If you\'re still getting errors:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Check Firebase Console that Email/Password auth is enabled');
  console.log('3. Verify API key is valid in Firebase Console\n');
  process.exit(0);
}

