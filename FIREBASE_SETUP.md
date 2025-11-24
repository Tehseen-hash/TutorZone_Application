# Firebase Setup Guide

## ⚠️ CRITICAL: Fixing "auth/configuration-not-found" Error

**This error means Email/Password authentication is NOT enabled in Firebase Console.**

You **MUST** enable it before login/registration will work!

---

## 🔧 Step-by-Step Solution:

### Step 1: Go to Firebase Console
1. Visit: **https://console.firebase.google.com/**
2. Sign in with your Google account
3. Select your project: **`secondapp-d20ec`**

### Step 2: Enable Email/Password Authentication (REQUIRED)

**This is the most important step!**

1. In the left sidebar, click on **"Authentication"**
   - If you see "Get started", click it first
   
2. Click on the **"Sign-in method"** tab at the top

3. Find **"Email/Password"** in the list of providers
   - It should be near the top of the list
   - Look for the email icon 📧

4. Click on **"Email/Password"** to open its settings

5. **Toggle the "Enable" switch to ON** (it should turn blue/green)

6. Click **"Save"** button at the bottom

7. You should see "Email/Password" now shows as **"Enabled"** ✅

### Step 3: Verify Configuration

Your `firebaseConfig.ts` should have these values:
- ✅ `apiKey`: `AIzaSyDG4z61DGOoSVFekLsf7T0_AlK2Fk2Y_WA`
- ✅ `authDomain`: `secondapp-d20ec.firebaseapp.com`
- ✅ `projectId`: `secondapp-d20ec`

### Step 4: Restart Your App

After enabling Email/Password:
1. **Stop your Expo/React Native app** (Ctrl+C in terminal)
2. **Restart it** with `npm start` or `expo start`
3. Try registering a new account
4. Try logging in

---

## 🐛 Common Issues:

### "Email/Password not enabled"
- **Solution**: Go back to Step 2 and make sure you clicked "Save" after enabling

### "Invalid API key"
- **Solution**: Double-check your `firebaseConfig.ts` matches your Firebase project

### "App not authorized"
- **Solution**: In Firebase Console → Authentication → Settings → Authorized domains
- Make sure `localhost` is listed (it should be by default)

### Still getting errors?
1. Check the browser/terminal console for detailed error messages
2. Verify you're using the correct Firebase project
3. Make sure you saved the Email/Password settings in Firebase Console

---

## ✅ Success Checklist:

- [ ] Opened Firebase Console
- [ ] Selected project `secondapp-d20ec`
- [ ] Went to Authentication → Sign-in method
- [ ] Enabled Email/Password (toggle is ON)
- [ ] Clicked "Save"
- [ ] Restarted the app
- [ ] Tried registering/login - it works!

---

## 📞 Need Help?

If you're still getting errors after following these steps:
1. Take a screenshot of your Firebase Console Authentication page
2. Check the terminal/console for the exact error message
3. Verify your Firebase project ID matches `secondapp-d20ec`

