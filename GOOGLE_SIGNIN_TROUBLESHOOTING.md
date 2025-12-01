# Google Sign-In Troubleshooting Guide

## Issue: `auth/internal-error` when clicking "Log in with Google"

If you've enabled Google Sign-In in Firebase Console but still getting `auth/internal-error`, follow these steps:

---

## Step 1: Configure OAuth Consent Screen

The most common cause is missing OAuth Consent Screen configuration in Google Cloud Console.

### Actions:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Select your Firebase project** (same project ID)
3. **Navigate to**: APIs & Services > OAuth consent screen
4. **Configure the consent screen**:
   - **User Type**: External (or Internal if using Google Workspace)
   - **App name**: Emergencize (or your app name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - Click **Save and Continue**
5. **Scopes** (Step 2):
   - Click **Add or Remove Scopes**
   - Add: `.../auth/userinfo.email`
   - Add: `.../auth/userinfo.profile`
   - Click **Save and Continue**
6. **Test users** (if using External):
   - Add your email address for testing
   - Click **Save and Continue**
7. **Click "Back to Dashboard"**

---

## Step 2: Verify Authorized Domains in Firebase

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**
3. **Navigate to**: Authentication > Sign-in method > Authorized domains
4. **Ensure these are listed**:
   - `localhost` (for local development)
   - Your production domain (if deployed)

---

## Step 3: Check Browser Settings

### Allow Popups:
1. Click the popup blocker icon in browser address bar
2. Allow popups for `localhost:3000`

### Enable Third-Party Cookies:
- **Chrome**: Settings > Privacy and security > Third-party cookies > "Allow third-party cookies"
- **Firefox**: Settings > Privacy & Security > Enhanced Tracking Protection > "Standard"
- **Safari**: Preferences > Privacy > Uncheck "Prevent cross-site tracking"

---

## Step 4: Verify Firebase Configuration

Check your `.env.local` file has the correct `authDomain`:

```bash
# Should match your Firebase project
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

The domain must be exactly: `[project-id].firebaseapp.com`

---

## Step 5: Test the Fix

1. **Restart your development server**:
   ```bash
   # Kill the current server (Ctrl+C)
   npm run dev
   ```

2. **Open in a fresh incognito/private window**:
   - Chrome: Ctrl+Shift+N / Cmd+Shift+N
   - Firefox: Ctrl+Shift+P / Cmd+Shift+P

3. **Clear browser cache and try again**

4. **Check browser console** (F12) for detailed error messages

---

## Common Error Messages

### `auth/internal-error`
- **Cause**: OAuth Consent Screen not configured
- **Fix**: Complete Step 1 above

### `auth/popup-blocked`
- **Cause**: Browser blocking the Google Sign-In popup
- **Fix**: Allow popups for your domain

### `auth/unauthorized-domain`
- **Cause**: Domain not authorized in Firebase
- **Fix**: Add domain to Firebase authorized domains

### `auth/operation-not-allowed`
- **Cause**: Google provider not enabled in Firebase
- **Fix**: Enable Google in Firebase Console > Authentication > Sign-in method

---

## Verification Checklist

- [ ] Google Sign-In enabled in Firebase Console
- [ ] OAuth Consent Screen configured in Google Cloud Console
- [ ] Scopes added (email, profile)
- [ ] Test user email added (if using External user type)
- [ ] `localhost` in Firebase authorized domains
- [ ] Popups allowed for localhost:3000
- [ ] Third-party cookies enabled
- [ ] `.env.local` has correct `authDomain`
- [ ] Development server restarted

---

## Still Not Working?

1. **Check browser console** (F12) for detailed error logs
2. **Try a different browser** to rule out browser-specific issues
3. **Verify Google Cloud project** matches your Firebase project
4. **Check Firebase project status** in Firebase Console dashboard

## Additional Resources

- [Firebase Google Sign-In Documentation](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Cloud OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)
