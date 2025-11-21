# Bug Fixes & Changes Log

This document tracks bug fixes and changes made to the Emergencize-Web application.

---

## [2025-11-21] Friend Request Email Lookup Failure

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
