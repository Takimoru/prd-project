# Field Study Project Information System

A comprehensive system for managing university field study programs. The client uses React, TypeScript, Vite, and Tailwind CSS; the API uses Express, Apollo GraphQL, TypeORM, and PostgreSQL. Some older pages still use Convex.

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
- **Backend API**: Express + Apollo GraphQL, backed by PostgreSQL and TypeORM
- **Legacy functions**: Convex (still used by some older pages)
- **Authentication**: Google OAuth 2.0
- **Routing**: React Router v6
- **Package Manager**: pnpm

## Prerequisites

- Node.js 20+ and pnpm installed
- Docker Engine and Docker Compose
- A Convex account (sign up at [convex.dev](https://convex.dev))
- A Google OAuth 2.0 Client ID

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL and the API

Start the API and PostgreSQL together:

```bash
docker compose up --build -d
```

The API listens on `http://localhost:4000/graphql`; its health endpoint is `http://localhost:4000/health`.

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

Set the client variables in `packages/client/.env.local`:

```env
VITE_API_URL=http://localhost:4000
VITE_CONVEX_URL=your_convex_url_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_ALLOWED_EMAIL_DOMAINS=university.edu,student.university.edu
```

Replace:
- `VITE_API_URL` with the public API origin when deploying the client
- `your_convex_url_here` with your Convex deployment URL
- `your_google_client_id_here` with your Google OAuth Client ID
- `university.edu,student.university.edu` with your allowed email domains (comma-separated)

The local Docker Compose file supplies `DATABASE_URL` to the API and persists PostgreSQL data in a named volume. Set `CLERK_SECRET_KEY` in the root `.env` file if authenticated API requests need Clerk.

### 5. Run the Web Client

```bash
pnpm --filter @mentoring/client dev
```

The app will be available at `http://localhost:5173`

### 6. Run Convex for Older Pages (if needed)

```bash
pnpm --filter @mentoring/client convex:dev
```

This will watch for changes in your Convex functions and update them automatically.

## Project Structure

```
├── packages/
│   ├── client/            # React/Vite client and remaining Convex functions
│   └── server/            # Express/Apollo API, TypeORM entities, and PostgreSQL setup
├── package.json
├── docker-compose.yml     # Local PostgreSQL and API services
└── pnpm-workspace.yaml
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

### Deploy Convex Functions (for older pages)

```bash
pnpm --filter @mentoring/client convex:deploy
```

### Deploy Frontend

You can deploy the frontend to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Make sure to set the environment variables in your hosting platform.

## Notes

- The GraphQL API is served by the Express/Apollo backend
- Some older pages still call Convex functions
- Google OAuth tokens are validated on the client side
- Email domain validation is performed both client-side and server-side
- The API stores its data in PostgreSQL

## License

MIT

