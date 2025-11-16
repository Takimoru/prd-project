# Troubleshooting: Admin Link Not Showing

If you've set your role to "admin" in the database but still don't see the admin link, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Look for these debug messages:
   - `Layout - Current user:` - Should show your user object
   - `Layout - User role:` - Should show `"admin"`
   - `Layout - Is admin?` - Should show `true`

## Step 2: Verify Role in Database

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to "Data" tab
4. Click on `users` table
5. Find your user by email
6. **Verify the `role` field is exactly `"admin"`** (with quotes, lowercase)

## Step 3: Clear Cache and Refresh

Try these in order:

### Option A: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Option B: Clear localStorage
1. Open browser console (F12)
2. Run this command:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Option C: Logout and Login Again
1. Click the logout button
2. Login again with Google OAuth
3. Check if admin link appears

### Option D: Use the Refresh Button
- Look for the 🔄 button next to your role badge (in development mode)
- Click it to refresh the page

## Step 4: Check Query Response

1. Open browser console (F12)
2. Look for: `AuthContext - Current user from query:`
3. Check if the user object has `role: "admin"`

If it shows `role: "student"`, the query is returning old data. Try:
- Logout and login again
- Clear localStorage (see Option B above)
- Wait a few seconds and refresh

## Step 5: Verify Email Match

Make sure the email in localStorage matches the email in the database:

1. In browser console, run:
   ```javascript
   console.log("Email in localStorage:", localStorage.getItem("userEmail"));
   ```
2. Compare with the email in Convex Dashboard
3. They must match exactly (case-sensitive)

## Step 6: Manual Database Check

If nothing works, manually verify in Convex Dashboard:

1. Go to Data → `users` table
2. Find your user
3. Check these fields:
   - `email`: Should match your Google email exactly
   - `role`: Should be exactly `"admin"` (not `"Admin"` or `"ADMIN"`)

## Step 7: Force Query Refresh

If the query is cached, you can force a refresh:

1. In browser console, run:
   ```javascript
   // Clear Convex query cache
   window.location.reload();
   ```

## Common Issues

### Issue: Role shows "student" in console
**Solution**: The database update didn't work. Re-run `setAdminByEmail` in Convex Dashboard.

### Issue: User is null or undefined
**Solution**: 
- Check if you're logged in
- Verify email in localStorage matches database
- Try logging out and back in

### Issue: Role is "admin" in database but "student" in app
**Solution**: 
- Clear localStorage
- Logout and login again
- Wait a few seconds for query to refresh

### Issue: Query returns old data
**Solution**: 
- Convex queries are reactive and should update automatically
- If not, try hard refresh (Ctrl+Shift+R)
- Or logout/login to force a new query

## Still Not Working?

If none of the above works:

1. **Double-check the database**:
   - Go to Convex Dashboard → Data → users
   - Find your user
   - Make sure `role` field is exactly: `"admin"` (lowercase, with quotes)

2. **Check for typos**:
   - Email must match exactly
   - Role must be lowercase: `"admin"` not `"Admin"`

3. **Try setting admin again**:
   - Run `auth:setAdminByEmail` function again in Convex Dashboard
   - Use your exact email: `nicolastzakis@students.unviersitasmulia.ac.id`

4. **Check browser console for errors**:
   - Look for any red error messages
   - Share the error if you see one

## Quick Test

To quickly test if the role check works, temporarily modify `src/components/Layout.tsx`:

```typescript
// Temporarily force show admin link for testing
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin", label: "Admin", icon: Settings }, // Force show
];
```

If the admin link appears, then the issue is with the role check, not the routing.

