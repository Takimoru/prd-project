# Setting Admin Emails via Environment Variables

The easiest way to set admin access is through Convex environment variables. This way, specific emails will automatically get admin role when they sign up.

## Step 1: Set Admin Emails in Convex Dashboard

1. **Go to Convex Dashboard**: [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. **Select your project**
3. **Go to Settings** → **Environment Variables**
4. **Add a new variable**:
   - **Name**: `ADMIN_EMAILS`
   - **Value**: `nicolastzakis@students.unviersitasmulia.ac.id`
   - (For multiple admins, use comma-separated: `email1@domain.com,email2@domain.com`)
5. **Click "Save"**

## Step 2: How It Works

Once `ADMIN_EMAILS` is set:
- ✅ Any email in the list will automatically get `admin` role on signup
- ✅ Existing users with those emails will be upgraded to admin on next login
- ✅ No need to manually set roles in the database

## Step 3: Test It

1. **Make sure** your email is in the `ADMIN_EMAILS` environment variable
2. **Logout** from the app (if logged in)
3. **Login again** with Google OAuth
4. **Check** - You should now see the "Admin" link in the sidebar!

## For Your Email

Add this to `ADMIN_EMAILS` in Convex Dashboard:
```
nicolastzakis@students.unviersitasmulia.ac.id
```

## Multiple Admins

To add multiple admin emails, separate them with commas:
```
admin1@university.edu,admin2@university.edu,nicolastzakis@students.unviersitasmulia.ac.id
```

## Important Notes

- ⚠️ **Case-insensitive**: Email matching is case-insensitive
- ⚠️ **Automatic**: Users are automatically upgraded to admin on login if their email is in the list
- ⚠️ **Secure**: Only set this in Convex Dashboard environment variables, not in client-side code

## Troubleshooting

If admin link still doesn't appear:

1. **Verify environment variable is set**:
   - Go to Convex Dashboard → Settings → Environment Variables
   - Make sure `ADMIN_EMAILS` exists and has your email

2. **Logout and login again**:
   - The role is checked/updated on every login

3. **Check browser console**:
   - Look for: `AuthContext - Current user from query:`
   - Verify `role: "admin"` in the user object

4. **Verify email match**:
   - Make sure the email in `ADMIN_EMAILS` exactly matches your Google email
   - Check for typos or extra spaces

