# Setup Instructions for KPK Local App

## Required Setup Steps

### 1. Install Additional Dependencies

```bash
# For document picker (CV upload)
npx expo install expo-document-picker

# Already installed:
# - expo-location (for maps)
# - react-native-maps (for maps)
```

### 2. Firebase Storage Setup

1. Go to Firebase Console → Storage
2. Enable Storage
3. Set up security rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cvs/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Firestore Indexes

Create composite indexes in Firebase Console:

1. **users collection:**
   - `role` (Ascending) + `applicationStatus` (Ascending)
   - `role` (Ascending) + `subjects` (Array contains)

2. **userLocations collection:**
   - `userId` (Ascending) + `timestamp` (Descending)

### 4. Create Admin User

In Firebase Console → Firestore:
1. Find or create a user document
2. Set `role: "admin"`

Or via code:
```javascript
await updateDoc(doc(db, "users", "admin_user_id"), {
  role: "admin"
});
```

### 5. Google Maps API Key (for Android)

1. Get API key from Google Cloud Console
2. Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY"
        }
      }
    }
  }
}
```

### 6. Location Permissions

Already configured in `app.json`. For iOS, you may need to add to `Info.plist` manually if issues occur.

## Testing Checklist

- [ ] Map loads and shows KPK region
- [ ] Location permission requested
- [ ] Tutor locations appear on map
- [ ] Parent can track student location
- [ ] Admin can access admin dashboard
- [ ] Admin can approve/reject tutors
- [ ] Tutor can upload CV
- [ ] Search works by name
- [ ] Search works by subject
- [ ] App performance is good (caching working)

## Performance Tips

1. **Enable Firestore Indexes** - Required for compound queries
2. **Clear Cache** - Use cacheService.clear() if needed
3. **Monitor Queries** - Check Firebase Console for slow queries
4. **Optimize Images** - Use expo-image for better performance

## Troubleshooting

### Map not showing
- Check Google Maps API key
- Verify location permissions
- Check internet connection

### Search not working
- Verify Firestore indexes are created
- Check console for query errors
- Try clearing cache

### Location tracking not working
- Verify location permissions granted
- Check if location is within KPK bounds
- Verify Firestore rules allow writes

### Admin access denied
- Verify user role is set to "admin" in Firestore
- Check authentication status
- Verify adminService.isAdmin() returns true

## Production Checklist

- [ ] All Firestore indexes created
- [ ] Firebase Storage rules configured
- [ ] Google Maps API key added
- [ ] Location permissions tested
- [ ] Admin user created
- [ ] Performance tested
- [ ] Security rules reviewed
- [ ] Error handling tested





