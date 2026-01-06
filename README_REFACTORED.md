# Field Study Management System - Complete Refactored Stack

## 🎯 Executive Summary

This repository contains a **fully refactored** Field Study Management System migrated from Convex to a modern, production-ready stack:

**Tech Stack:**
- **Backend**: Express + Apollo Server + TypeGraphQL
- **ORM**: TypeORM with SQLite (dev) / Postgres (prod-ready)
- **Auth**: Clerk with role-based access control
- **Analytics**: PostHog for user behavior tracking
- **Package Manager**: pnpm
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Testing**: Jest with comprehensive test coverage

## ✨ Key Features

### Role-Based System
- **Admin**: Program management, registration approvals, team assignments, CSV exports
- **Supervisor**: Weekly report reviews, attendance approvals, team progress monitoring
- **Team Leader**: Work program creation, task management, weekly summary submissions
- **Member (Student)**: Daily check-ins, task updates, file uploads, progress tracking

### Security & Auth
- ✅ Clerk JWT authentication
- ✅ Role-based authorization middleware
- ✅ Email-based user mapping
- ✅ Secure file uploads with type validation

### Analytics & Monitoring
- ✅ PostHog event tracking for all user actions
- ✅ Comprehensive analytics per role
- ✅ Health check endpoints
- ✅ Error tracking and logging

### Developer Experience
- ✅ Hot reload in development
- ✅ Docker containerization
- ✅ Automated CI/CD pipeline
- ✅ Comprehensive test suite
- ✅ TypeScript for type safety

## 📦 Project Structure

```
prd-test/
├── packages/
│   ├── server/              # Backend API
│   │   ├── src/
│   │   │   ├── __tests__/   # Test suite
│   │   │   ├── entities/    # TypeORM models
│   │   │   ├── graphql/     # Resolvers & types
│   │   │   ├── middleware/  # Auth, logging
│   │   │   ├── routes/      # REST endpoints
│   │   │   ├── scripts/     # Migration tools
│   │   │   └── lib/         # Utilities
│   │   ├── Dockerfile       # Production
│   │   ├── Dockerfile.dev   # Development
│   │   └── .env.example     # Configuration template
│   └── client/              # Frontend (React + Vite)
├── convex/                  # Legacy Convex (for reference)
├── docker-compose.dev.yml   # Development environment
├── .github/workflows/       # CI/CD pipelines
├── MIGRATION_IMPLEMENTATION.md  # Detailed implementation docs
└── README_REFACTORED.md     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker (optional, for containerized development)

### 1. Environment Setup

```bash
# Clone repository
git clone <repo-url>
cd prd-test

# Install dependencies
pnpm install

# Setup environment
cp packages/server/.env.example packages/server/.env
# Edit .env with your credentials
```

### 2. Run Development Server

**Option A: Local Development**
```bash
cd packages/server
pnpm dev
# Server runs at http://localhost:4000
```

**Option B: Docker Development**
```bash
docker-compose -f docker-compose.dev.yml up
# Server runs at http://localhost:4000
```

### 3. Access Services

- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health
- **File Uploads**: http://localhost:4000/api/single

## 🔄 Migration from Convex

### Step-by-Step Migration Process

**1. Export Convex Data**
```bash
cd packages/server
npm run export:convex
# Follow instructions to export collections from Convex dashboard
```

**2. Run Data Migration**
```bash
npm run migrate:from-convex
# Migrates: users, programs, teams, registrations, attendance, tasks, etc.
```

**3. Migrate Files**
```bash
# Create files manifest (see MIGRATION_IMPLEMENTATION.md)
npm run migrate:files
npm run migrate:files:update-db
```

**4. Verify Migration**
```bash
npm run test
# Run all tests to verify data integrity
```

See **[MIGRATION_IMPLEMENTATION.md](./MIGRATION_IMPLEMENTATION.md)** for detailed migration guide.

## 📝 API Examples

### Admin: Create Program

```graphql
mutation CreateProgram {
  createProgram(input: {
    title: "Field Study 2024"
    description: "Annual field study program"
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  }) {
    id
    title
    archived
  }
}
```

### Admin: Approve Registration

```graphql
mutation ApproveRegistration {
  approveRegistration(id: "registration-id") {
    id
    status
    user {
      id
      email
      role
    }
  }
}
```

### Supervisor: Review Weekly Report

```graphql
query WeeklyReviewQueue {
  weeklyReviewQueue {
    id
    team {
      name
    }
    week
    progressPercentage
    status
  }
}

mutation ApproveReport {
  approveWeeklyReport(id: "report-id") {
    id
    status
  }
}
```

### Leader: Create Work Program

```graphql
mutation CreateWorkProgram {
  createWorkProgram(input: {
    teamId: "team-id"
    title: "Community Development Project"
    description: "Building local infrastructure"
    startDate: "2024-01-01"
    endDate: "2024-03-31"
    assignedMemberIds: ["user1", "user2"]
  }) {
    id
    title
    assignedMembers {
      id
      name
    }
  }
}
```

### Member: Check In

```graphql
mutation CheckIn {
  checkIn(input: {
    teamId: "team-id"
    date: "2024-01-15"
    status: "present"
    lat: -6.2088
    long: 106.8456
  }) {
    id
    date
    status
    timestamp
  }
}
```

## 🧪 Testing

### Run Tests
```bash
cd packages/server

# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch

# Specific test file
npm run test -- admin.test.ts
```

### Test Coverage
- ✅ Admin program management flows
- ✅ Registration approval flows
- ✅ Team CRUD operations
- ✅ Supervisor weekly report reviews
- ✅ Attendance management
- ✅ Authorization/permission checks

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Build
```bash
# Build image
docker build -f packages/server/Dockerfile -t field-study-api:latest .

# Run container
docker run -d \
  -p 4000:4000 \
  -e DB_PATH=/app/data/production.sqlite \
  -e CLERK_SECRET_KEY=<your-key> \
  -e POSTHOG_API_KEY=<your-key> \
  -v field-study-data:/app/data \
  -v field-study-uploads:/app/uploads \
  field-study-api:latest
```

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  api:
    image: field-study-api:latest
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/production.sqlite
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - POSTHOG_API_KEY=${POSTHOG_API_KEY}
    volumes:
      - api-data:/app/data
      - api-uploads:/app/uploads
    restart: unless-stopped
volumes:
  api-data:
  api-uploads:
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=4000

# Database
DB_PATH=./database.sqlite

# Clerk Auth
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# PostHog Analytics
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

See `.env.example` for complete configuration.

## 🎯 Role-Specific Guides

### Admin Guide
- Create and manage programs
- Review and approve registrations
- Assign teams and supervisors
- Export attendance/progress reports
- Manage system-wide settings

### Supervisor Guide
- View assigned teams
- Review weekly reports
- Approve/reject with feedback
- Monitor team attendance
- Track team progress

### Team Leader Guide
- Create work programs
- Assign tasks to members
- Submit weekly summaries
- Monitor task completion
- Manage team files

### Member Guide
- Daily check-in/check-out
- View assigned tasks
- Submit task updates
- Upload task files
- Track personal progress

## 📊 Analytics Events

PostHog tracks the following events:

### Admin Events
- `program_created` - New program created
- `registration_approved` - Registration approved
- `program_archived` - Program archived
- `export_performed` - Data exported

### Supervisor Events
- `weekly_report_reviewed` - Report reviewed
- `report_approved` - Report approved
- `report_rejected` - Report rejected with feedback

### Leader Events
- `work_program_created` - Work program created
- `task_created` - New task created
- `weekly_summary_submitted` - Weekly summary submitted

### Member Events
- `checkin` - Daily attendance check-in
- `task_update_submitted` - Task progress updated
- `file_uploaded` - File uploaded

## 🚦 CI/CD Pipeline

GitHub Actions automatically:
1. **Lint** - Code quality checks
2. **Test** - Run test suite
3. **Build** - Compile TypeScript
4. **Docker Build** - Build and push images
5. **Deploy** - Deploy to staging/production

Pipeline triggers on:
- Push to `main` or `develop`
- Pull requests

## 🔒 Security Considerations

### Authentication
- Clerk handles user authentication
- JWT tokens verified on every request
- Role-based authorization guards

### Data Protection
- SQL injection prevention via TypeORM
- File type validation
- File size limits
- CORS configuration

### Best Practices
- Environment variables for secrets
- Secure password hashing (via Clerk)
- HTTPS enforcement (in production)
- Regular security audits

## 📈 Performance

### Optimizations
- Database indexing on frequently queried fields
- Eager loading of related entities
- GraphQL query batching
- File upload streaming

### Monitoring
- Health check endpoints
- Database connection pooling
- Error tracking
- Performance metrics via PostHog

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Write/update tests
4. Run linter: `pnpm lint`
5. Run tests: `pnpm test`
6. Submit pull request

### Code Style
- TypeScript strict mode
- ESLint rules enforced
- Prettier formatting
- Descriptive commit messages

## 📚 Additional Documentation

- **[MIGRATION_IMPLEMENTATION.md](./MIGRATION_IMPLEMENTATION.md)** - Complete implementation details
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Architecture overview
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[TROUBLESHOOTING_ADMIN.md](./TROUBLESHOOTING_ADMIN.md)** - Common issues

## 🆘 Troubleshooting

### Common Issues

**Database Locked**
```bash
# Stop all processes using the database
pkill -f "ts-node-dev"
rm database.sqlite
pnpm dev
```

**Port Already in Use**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

**Docker Issues**
```bash
# Rebuild containers
docker-compose down -v
docker-compose up --build
```

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@example.com

## 📄 License

[Your License Here]

---

## 🎉 Migration Status

✅ **Complete!** All PRD requirements implemented and tested.

**Ready for Production Deployment!**

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Post-Convex Migration)


