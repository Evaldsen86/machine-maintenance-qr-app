# How to Run Locally - Step by Step Guide

## 🚨 Important: Your App Runs on Port 8081, NOT 5173!

Your `vite.config.ts` is configured to use port **8081**, not the default 5173.

## ✅ Step-by-Step Instructions

### Step 1: Open Terminal in Project Root
Make sure you're in: `C:\Users\admin\OneDrive\Desktop\machine-history-qr-main\machine-history-qr-main`

### Step 2: Start the Development Server
```bash
npm run dev
```

### Step 3: Wait for Server to Start
You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8081/
  ➜  Network: use --host to expose
```

### Step 4: Open in Browser
**Open:** `http://localhost:8081` (NOT 5173!)

---

## 🔍 Troubleshooting

### Problem: Blank Page / Nothing Shows

#### Check 1: Is the server running?
Look at your terminal - you should see:
- "VITE ready" message
- A URL like `http://localhost:8081`

#### Check 2: Open Browser Console
1. Press `F12` in your browser
2. Go to the "Console" tab
3. Look for any red error messages

Common errors you might see:

**Error: "Missing required environment variables"**
- Solution: Make sure `.env` file exists in root directory
- Check it has: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Error: "Invalid Supabase URL"**
- Solution: Check your Supabase credentials in `.env` are correct

**Error: "Failed to fetch" or CORS errors**
- Solution: Check your Supabase project is active and URL is correct

#### Check 3: Check Network Tab
1. Press `F12` → "Network" tab
2. Refresh the page
3. Look for failed requests (red entries)
4. Check if `main.tsx` or other files are loading

#### Check 4: Try Different Browser
Sometimes browser cache causes issues:
- Try incognito/private mode
- Or try a different browser (Chrome, Firefox, Edge)

---

## 🛠️ Common Fixes

### Fix 1: Restart the Dev Server
1. Stop the server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Wait for "ready" message
4. Try `http://localhost:8081` again

### Fix 2: Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Clear cached images and files
3. Refresh the page

### Fix 3: Check Port Availability
If port 8081 is busy, you can:
- Kill the process using port 8081
- Or change port in `vite.config.ts`:
  ```ts
  server: {
    port: 5173,  // Change to any available port
  }
  ```

### Fix 4: Verify Environment Variables
Run this in PowerShell to check:
```powershell
Get-Content .env
```

Should show:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📋 Quick Checklist

- [ ] Terminal shows "VITE ready" message
- [ ] Using correct URL: `http://localhost:8081`
- [ ] `.env` file exists with Supabase credentials
- [ ] Browser console shows no red errors
- [ ] Network tab shows files loading successfully

---

## 🆘 Still Not Working?

1. **Check terminal output** - Copy any error messages
2. **Check browser console** - Press F12, look for errors
3. **Verify Supabase connection** - Your Supabase project should be active
4. **Try building instead**: `npm run build` then `npm run preview`

---

## 📝 Expected Behavior

When working correctly, you should see:
- A login page with "Maskine QR System" title
- Two tabs: "Log ind" (Login) and "Scan QR"
- A truck icon at the top
- No console errors

If you see this, everything is working! 🎉

