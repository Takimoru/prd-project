# How to Set Up Admin Access

There are **three ways** to set yourself (or another user) as an admin:

## Method 1: Using Convex Dashboard (Recommended for First-Time Setup)

1. **Login to your app** with your Google account (your email: `nicolastzakis@students.unviersitasmulia.ac.id`)

2. **Open Convex Dashboard**:

   - Go to [https://dashboard.convex.dev](https://dashboard.convex.dev)
   - Select your project

3. **Go to Functions Tab**:

   - Click on "Functions" in the left sidebar
   - Find `auth:setAdminByEmail` function

4. **Run the Function**:

   - Click on `auth:setAdminByEmail`
   - In the "Args" section, enter:
     ```json
     {
       "email": "nicolastzakis@students.unviersitasmulia.ac.id"
     }
     ```
   - Click "Run"
   - You should see a success message with the user ID

5. **Refresh your app** - You should now see the "Admin" link in the sidebar!

## Method 2: Using Convex Dashboard Data Editor

1. **Open Convex Dashboard** → Your Project → "Data" tab

2. **Find your user**:

   - Click on the `users` table
   - Find your user by email: `nicolastzakis@students.unviersitasmulia.ac.id`

3. **Edit the role**:

   - Click on your user record
   - Find the `role` field
   - Change it from `"student"` to `"admin"`
   - Click "Save"

4. **Refresh your app** - You should now have admin access!

## Method 3: Using the Code (For Developers)

If you want to set admin during signup, you can modify the `createOrUpdateUser` call in `src/contexts/AuthContext.tsx`:

```typescript
// In handleGoogleSuccess function, change:
await createOrUpdateUser({
  name: userInfo.name,
  email: userInfo.email,
  googleId: userInfo.sub,
  picture: userInfo.picture,
  role:
    userInfo.email === "nicolastzakis@students.unviersitasmulia.ac.id"
      ? "admin"
      : undefined,
});
```

**Note**: This is less secure and not recommended for production. Use Method 1 or 2 instead.

## Verify Admin Access

After setting admin role:

1. Logout and login again (or refresh the page)
2. You should see:
   - "Admin" link in the sidebar
   - Access to `/admin` page
   - Ability to create programs

## Setting Other Users as Admin

Once you're an admin, you can create a UI to manage user roles, or use Method 1/2 above to set other users as admin or supervisor.

## Troubleshooting

- **Still showing as student?**

  - Clear browser localStorage: `localStorage.clear()` in browser console
  - Logout and login again
  - Check Convex dashboard to verify the role was saved

- **Can't find the function in Convex Dashboard?**

  - Make sure `convex dev` is running
  - Wait a few seconds for functions to sync
  - Refresh the dashboard

- **Function not working?**
  - Check the browser console for errors
  - Verify the email is exactly as it appears in the database
  - Make sure the user exists in the `users` table
