# Field Study Project Information System

A comprehensive system for managing university field study programs, built with React, TypeScript, Vite, Tailwind CSS, and Convex.

## Features

- **Google OAuth 2.0 Authentication** - University domain-only access
- **Role-Based Access Control** - Admin, Supervisor, and Student roles
- **Program Management** - Create and manage field study programs
- **Team Management** - Form teams and assign supervisors
- **Daily Attendance** - Check-in with optional GPS and photo
- **Task Management** - Weekly task planning and assignment
- **Progress Reporting** - Weekly progress reports with photo documentation
- **Supervisor Review** - Review and comment on student submissions
- **CSV Export** - Export program data
- **Archival System** - Archive completed programs

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Convex (serverless backend)
- **Authentication**: Google OAuth 2.0
- **Routing**: React Router v6
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18+ and pnpm installed
- A Convex account (sign up at [convex.dev](https://convex.dev))
- A Google OAuth 2.0 Client ID

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Convex

1. Install Convex CLI globally (if not already installed):
```bash
npm install -g convex
```

2. Login to Convex:
```bash
npx convex login
```

3. Initialize Convex in your project:
```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to an existing one)
- Generate the `CONVEX_URL` for your deployment
- Start the Convex development server

4. Copy the `CONVEX_URL` from the terminal output.

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (when deploying)
7. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain (when deploying)
8. Copy the Client ID

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_CONVEX_URL=your_convex_url_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_ALLOWED_EMAIL_DOMAINS=university.edu,student.university.edu
```

Replace:
- `your_convex_url_here` with your Convex deployment URL
- `your_google_client_id_here` with your Google OAuth Client ID
- `university.edu,student.university.edu` with your allowed email domains (comma-separated)

### 5. Run the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### 6. Run Convex Development Server (in a separate terminal)

```bash
pnpm convex:dev
```

This will watch for changes in your Convex functions and update them automatically.

## Project Structure

```
├── convex/                 # Convex backend functions
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication functions
│   ├── programs.ts        # Program management
│   ├── teams.ts           # Team management
│   ├── attendance.ts      # Attendance tracking
│   ├── tasks.ts           # Task management
│   ├── reports.ts         # Weekly reports
│   └── registrations.ts   # Student registrations
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeamWorkspace.tsx
│   │   ├── SupervisorDashboard.tsx
│   │   ├── AdminPanel.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## User Roles

### Admin
- Create and manage programs
- Create teams and assign supervisors
- Approve/reject student registrations
- Export program data
- Archive completed programs

### Supervisor
- View assigned teams
- Review weekly progress reports
- Add comments and request revisions
- Approve reports

### Team Leader (Student)
- Assign tasks to team members
- Compile weekly attendance summary
- Submit weekly progress reports
- Coordinate team activities

### Team Member (Student)
- Perform daily check-ins
- Complete assigned tasks
- Contribute to weekly submissions

## Development Roadmap

- [x] Week 1: Auth & App Structure
- [ ] Week 2: Registration + Admin approval
- [ ] Week 3: Team creation + supervisor assignment
- [ ] Week 4: Task assignment + attendance check-in
- [ ] Week 5: Weekly reporting + supervisor review
- [ ] Week 6: Export + Final report + Archival

## Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

## Deployment

### Deploy Convex Backend

```bash
pnpm convex:deploy
```

### Deploy Frontend

You can deploy the frontend to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Make sure to set the environment variables in your hosting platform.

## Notes

- The Convex backend automatically handles authentication tokens
- Google OAuth tokens are validated on the client side
- Email domain validation is performed both client-side and server-side
- All data is stored in Convex's serverless database

## License

MIT

