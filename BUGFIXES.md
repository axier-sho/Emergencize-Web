# Bug Fixes & Changes Log

This document tracks bug fixes and changes made to the Emergencize-Web application.

---

## [2024-11-21] Removed Email/Password Authentication - Implemented Google OAuth Only

### Change Description
Replaced the traditional email/password authentication system with Google OAuth authentication as the sole sign-in method. Users can now only authenticate using their Google accounts, streamlining the login process and removing the need for password management and SMS verification during signup.

### Rationale
- Simplifies user onboarding by eliminating password creation and management
- Reduces friction in the authentication flow
- Leverages Google's robust security infrastructure
- Removes the complexity of SMS verification for new signups
- Provides better user experience with one-click authentication

### Implementation Details
**Authentication Hook (`/src/hooks/useAuth.ts`)**:
- Added `GoogleAuthProvider` and `signInWithPopup` imports from Firebase Auth
- Implemented new `loginWithGoogle()` method that:
  - Triggers Google OAuth popup
  - Automatically creates user profile in Firestore if it doesn't exist
  - Handles errors appropriately
- Kept existing email/password methods for backward compatibility but marked as deprecated
- Exported `loginWithGoogle` method for use in components

**Authentication Modal (`/src/components/AuthModal.tsx`)**:
- Removed all email, password, name, and phone number input fields
- Removed SMS verification flow and country code selector
- Removed signup/login mode switching
- Simplified to single Google sign-in button with branding
- Kept Terms of Service acceptance checkbox
- Removed `initialMode` and `lockMode` props from interface
- Added Google logo SVG and "Continue with Google" button

**Landing Pages (`/src/app/page.tsx` and `/src/app/about/page.tsx`)**:
- Removed `authMode` and `lockAuthMode` state variables
- Simplified all "Sign In" and "Get Started" buttons to open the same modal
- Updated `AuthModal` component usage to remove deprecated props

### User Impact
- **New users**: Can now sign up instantly with Google account (no password or SMS verification needed)
- **Existing users with email/password**: Will need to sign in with Google account instead
- **Security**: Enhanced security by using Google's OAuth infrastructure
- **Privacy**: User data is managed through Google's secure authentication system

### Files Modified
- `/src/hooks/useAuth.ts` - Added Google OAuth method
- `/src/components/AuthModal.tsx` - Complete redesign for Google-only auth
- `/src/app/page.tsx` - Simplified modal state management
- `/src/app/about/page.tsx` - Simplified modal state management

---

## [2024-11-21] Friend Request Email Lookup Failure

### Bug Description
When users tried to send a friend request by entering a friend's email address, the system would incorrectly report "User not found" even when the email address was completely correct. This prevented users from adding contacts through the friend request system.

### Root Cause
The `findUserByEmail` function in `/src/lib/database.ts` had a case-sensitivity issue in its fallback query. The function performed two queries:

1. **Primary query**: Searched for users by `normalizedEmail` field (lowercase, trimmed)
2. **Fallback query**: Searched for users by `email` field

The fallback query was using the original, unnormalized email parameter instead of the normalized version. Since Firestore queries are case-sensitive, if a user entered `test@example.com` but the database stored `Test@Example.com`, the fallback query would fail to find the user.

### Fix Applied
Changed line 167 in `/src/lib/database.ts`:
- **Before**: `where('email', '==', email)`
- **After**: `where('email', '==', normalized)`

This ensures both the primary and fallback queries use the normalized (lowercase, trimmed) email for case-insensitive matching.

### Files Modified
- `/src/lib/database.ts` (Line 167)

---
