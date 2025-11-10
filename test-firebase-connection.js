#!/usr/bin/env node

/**
 * Firebase Connection Tester
 * Tests if the Firebase API key is actually valid
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('\n🔥 Testing Firebase Connection...\n');

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
}

const apiKey = envVars['NEXT_PUBLIC_FIREBASE_API_KEY'];
const projectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const authDomain = envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'];

if (!apiKey || !projectId) {
  console.log('❌ Missing API key or project ID in .env.local');
  process.exit(1);
}

console.log(`📋 Project ID: ${projectId}`);
console.log(`📋 Auth Domain: ${authDomain}`);
console.log(`📋 API Key: ${apiKey.substring(0, 20)}...\n`);

// Test 1: Check if API key format is correct
console.log('Test 1: Checking API key format...');
if (!apiKey.startsWith('AIzaSy')) {
  console.log('❌ Invalid API key format. Firebase API keys start with "AIzaSy"');
  process.exit(1);
}
console.log('✅ API key format is correct\n');

// Test 2: Try to verify API key with Firebase
console.log('Test 2: Testing API key validity with Firebase...');

const testUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
const postData = JSON.stringify({
  returnSecureToken: true
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(testUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 400) {
      try {
        const response = JSON.parse(data);
        if (response.error && response.error.message === 'API_KEY_INVALID') {
          console.log('❌ API KEY IS INVALID in Firebase Console!');
          console.log('\n🔧 Solutions:');
          console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
          console.log('2. Select your project');
          console.log('3. Go to Project Settings (gear icon) → General');
          console.log('4. Scroll to "Your apps" section');
          console.log('5. Copy the CORRECT apiKey value');
          console.log('6. Update your .env.local file\n');
        } else if (response.error && response.error.message.includes('API key not valid')) {
          console.log('❌ API key exists but is not valid for this project');
          console.log('\n🔧 Possible issues:');
          console.log('1. API key restrictions are too strict');
          console.log('2. Wrong API key for this project');
          console.log('3. Go to Google Cloud Console → APIs & Services → Credentials');
          console.log('4. Check if "Browser key" has restrictions that block localhost\n');
        } else {
          console.log('✅ API key is VALID and working!');
          console.log('⚠️  The error might be something else. Error:', response.error.message);
          console.log('\n🔧 Next steps:');
          console.log('1. Make sure you RESTARTED your dev server after fixing .env.local');
          console.log('2. Clear browser cache and try again');
          console.log('3. Try in incognito/private mode\n');
        }
      } catch (e) {
        console.log('⚠️  Unexpected response:', data);
      }
    } else if (res.statusCode === 200) {
      console.log('✅ API key is VALID and working perfectly!');
      console.log('\n🔧 If you\'re still seeing errors in your app:');
      console.log('1. RESTART your dev server: Stop it (Ctrl+C) and run "npm run dev" again');
      console.log('2. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)');
      console.log('3. Try in incognito/private browsing mode');
      console.log('4. Check browser console for the exact error message\n');
    } else {
      console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Network error:', e.message);
  console.log('Make sure you have internet connection');
});

req.write(postData);
req.end();

