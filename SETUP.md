# Quick Setup Guide

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Convex

1. **Login to Convex:**
   ```bash
   npx convex login
   ```

2. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   
   This will:
   - Create a new Convex project
   - Generate your `CONVEX_URL`
   - Start watching for changes

3. **Copy the CONVEX_URL** from the terminal output.

## Step 3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API" or "Google Identity Services API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
7. Copy the Client ID

## Step 4: Create Environment File

Create a `.env` file in the root:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_ALLOWED_EMAIL_DOMAINS=university.edu
```

## Step 5: Run the Application

**Terminal 1 - Frontend:**
```bash
pnpm dev
```

**Terminal 2 - Convex Backend:**
```bash
pnpm convex:dev
```

## Step 6: Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Authentication Setup Note

The current implementation uses Google OAuth on the client side and stores user data in Convex. For production, you may want to:

1. Set up Convex authentication with Google OAuth
2. Implement server-side token validation
3. Add proper session management

See the Convex documentation for setting up authentication: https://docs.convex.dev/auth

## Troubleshooting

### "VITE_CONVEX_URL is not set"
- Make sure you've created the `.env` file
- Restart the dev server after creating `.env`

### "Failed to sign in with Google"
- Check that your Google Client ID is correct
- Verify authorized origins include `http://localhost:5173`
- Make sure Google+ API is enabled

### Convex functions not working
- Make sure `pnpm convex:dev` is running
- Check that your `VITE_CONVEX_URL` is correct
- Look for errors in the Convex dev terminal

