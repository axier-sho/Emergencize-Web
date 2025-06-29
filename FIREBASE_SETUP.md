# Firebase Database Rules Setup Guide

## 🔥 How to Apply These Rules

### **1. Firestore Security Rules**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `emergencize-web` project
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Rules"** tab
5. **Copy the content** from `firestore.rules` file
6. **Paste it** into the rules editor
7. Click **"Publish"**

### **2. Realtime Database Rules**

1. In Firebase Console, click **"Realtime Database"**
2. Click **"Rules"** tab
3. **Copy the content** from `database.rules.json` file
4. **Paste it** into the rules editor
5. Click **"Publish"**

## 🔒 What These Rules Protect

### **User Data Security:**
- ✅ Users can only access their own profile data
- ✅ Users can only see public profiles of others
- ✅ Emergency contacts are private to each user

### **Emergency Alerts:**
- ✅ Users can create alerts with their own ID
- ✅ Users can only see alerts sent to them or by them
- ✅ Alert creators can update/delete their alerts
- ✅ Alert responses are linked to the original alert

### **Real-time Features:**
- ✅ Online presence is readable by all authenticated users
- ✅ Users can only update their own presence status
- ✅ Location sharing during emergencies is controlled

### **Chat System:**
- ✅ Users can only access chats they're part of
- ✅ Message creation requires chat membership
- ✅ Users can modify their own messages only

## 📋 Rule Categories Explained

### **1. User Management**
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```
- Users control their own data completely
- Public profiles can be read by others if marked public

### **2. Emergency Alerts**
```javascript
match /alerts/{alertId} {
  allow create: if request.auth.uid == request.resource.data.fromUserId;
  allow read: if request.auth.uid in [fromUserId, ...toUserIds];
}
```
- Prevents spoofing (can't create alerts as someone else)
- Privacy protection (only involved users see alerts)

### **3. Real-time Presence**
```javascript
match /presence/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}
```
- All authenticated users can see who's online
- Users can only update their own status

### **4. Location Data**
```javascript
match /locations/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}
```
- Emergency location sharing visible to all authenticated users
- Users control their own location data

## ⚠️ Development vs Production

### **Development (Current Rules):**
- ✅ Permissive for testing
- ✅ Detailed logging available
- ✅ Easy debugging

### **Production (Recommended Changes):**
```javascript
// Add rate limiting
allow write: if request.auth != null && 
  request.time > resource.data.lastWrite + duration.value(1, 's');

// Add data validation
allow create: if isValidData(request.resource.data);

// Add admin controls
allow write: if request.auth.token.admin == true;
```

## 🧪 Testing Your Rules

### **Test in Firebase Console:**
1. Go to Firestore > Rules
2. Click **"Rules playground"**
3. Test different scenarios:
   - ✅ Authenticated user accessing own data
   - ❌ Authenticated user accessing other's private data
   - ❌ Unauthenticated user accessing any data

### **Common Test Cases:**
```javascript
// Should ALLOW
auth.uid = "user123"
path = /users/user123
operation = read

// Should DENY
auth.uid = "user123"  
path = /users/user456
operation = write

// Should ALLOW
auth.uid = "user123"
path = /alerts/alert456
operation = create
data = { fromUserId: "user123", type: "help" }
```

## 🔧 Monitoring and Debugging

### **View Rule Violations:**
1. Go to Firestore > Usage tab
2. Check "Security rules evaluation"
3. Look for denied requests

### **Enable Debug Mode:**
```javascript
// Add to rules for debugging
allow read, write: if true; // REMOVE IN PRODUCTION!
```

## 📈 Performance Optimization

### **Index Requirements:**
These rules may require composite indexes:
- `alerts` collection: `[fromUserId, timestamp]`
- `alerts` collection: `[toUserIds, timestamp]`
- `presence` collection: `[isOnline, lastSeen]`

Firebase will prompt you to create these automatically when needed.

---

**Important:** Always test rules thoroughly before deploying to production!