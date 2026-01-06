# Migration Completion Guide

This guide provides step-by-step instructions to complete the Convex → TypeGraphQL migration.

## Current Status

✅ **Completed:**
- Prisma schema with all tables
- TypeGraphQL base structure
- Auth resolver (example)
- Program resolver (example)
- Server setup with TypeGraphQL
- Clerk middleware foundation

## Next Steps

### 1. Complete Remaining Resolvers

Follow the pattern established in `auth.resolver.ts` and `program.resolver.ts`:

#### Team Resolver (`src/graphql/resolvers/team.resolver.ts`)
```typescript
@Resolver(() => Team)
export class TeamResolver {
  @Query(() => [Team])
  async teams(@Arg('programId', () => ID, { nullable: true }) programId?: string) { ... }
  
  @Query(() => Team, { nullable: true })
  async team(@Arg('id', () => ID) id: string) { ... }
  
  @Mutation(() => Team)
  async createTeam(@Arg('input') input: CreateTeamInput, @Ctx() ctx: Context) { ... }
}
```

**Key mappings:**
- `getTeamsByProgram` → `teams(programId)`
- `getTeamById` → `team(id)`
- `createTeam` → `createTeam(input)`
- `addMember` → `addMember(teamId, userId)`
- `updateTeam` → `updateTeam(input)`

#### Task Resolver (`src/graphql/resolvers/task.resolver.ts`)
- `getByTeam` → `tasks(teamId)`
- `create` → `createTask(input)`
- `update` → `updateTask(input)`
- `remove` → `deleteTask(id)`

#### Registration Resolver (`src/graphql/resolvers/registration.resolver.ts`)
- `getPendingRegistrations` → `pendingRegistrations`
- `getApprovedRegistrations` → `approvedRegistrations`
- `submitRegistration` → `submitRegistration(input)`
- `approveRegistration` → `approveRegistration(id)`
- `rejectRegistration` → `rejectRegistration(id)`

#### Attendance Resolver (`src/graphql/resolvers/attendance.resolver.ts`)
- `getAttendanceByTeamDate` → `attendanceByTeam(teamId, date)`
- `getWeeklyAttendanceSummary` → `weeklyAttendanceSummary(teamId, week)`
- `checkIn` → `checkIn(input)`

### 2. Add Input Types

Create input types for all mutations in `src/graphql/inputs/`:

- `TeamInputs.ts` - CreateTeamInput, UpdateTeamInput, AddMemberInput
- `TaskInputs.ts` - CreateTaskInput, UpdateTaskInput
- `RegistrationInputs.ts` - SubmitRegistrationInput
- `AttendanceInputs.ts` - CheckInInput

### 3. Register All Resolvers

Update `src/index.ts`:
```typescript
const schema = await buildSchema({
  resolvers: [
    AuthResolver,
    ProgramResolver,
    TeamResolver,
    TaskResolver,
    RegistrationResolver,
    AttendanceResolver,
    UserResolver,
    ReportResolver,
    WorkProgramResolver,
    ActivityResolver,
  ],
});
```

### 4. Set Up Apollo Subscriptions

#### Install dependencies:
```bash
pnpm add graphql-ws ws @graphql-tools/schema
```

#### Update server (`src/index.ts`):
```typescript
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';

// After creating httpServer
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer({ schema }, wsServer);
```

#### Create Subscription Resolvers:
```typescript
@Subscription(() => Team, {
  topics: 'TEAM_UPDATED',
  filter: ({ payload, args }) => payload.teamId === args.teamId,
})
async teamUpdated(
  @Arg('teamId', () => ID) teamId: string,
  @Root() payload: { team: Team }
): AsyncIterator<Team> {
  return payload.team;
}
```

#### Publish events in mutations:
```typescript
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Mutation(() => Team)
async createTeam(...) {
  const team = await ctx.prisma.team.create(...);
  await pubSub.publish('TEAM_UPDATED', { teamId: team.id, team });
  return team;
}
```

### 5. File Upload Endpoints

#### Create upload route (`src/routes/upload.ts`):
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  
  const fileUrl = `/files/${file.filename}`;
  res.json({ url: fileUrl, filename: file.originalname });
});
```

#### Add to server:
```typescript
app.use('/files', express.static('uploads'));
app.use('/api', uploadRouter);
```

### 6. Update Frontend

#### Replace Convex hooks with Apollo:

**Before (Convex):**
```typescript
const programs = useQuery(api.programs.getAllPrograms, { includeArchived: false });
const createProgram = useMutation(api.programs.createProgram);
```

**After (Apollo):**
```typescript
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_PROGRAMS = gql`
  query GetPrograms($includeArchived: Boolean) {
    programs(includeArchived: $includeArchived) {
      id
      title
      description
    }
  }
`;

const CREATE_PROGRAM = gql`
  mutation CreateProgram($input: CreateProgramInput!) {
    createProgram(input: $input) {
      id
      title
    }
  }
`;

const { data } = useQuery(GET_PROGRAMS, { variables: { includeArchived: false } });
const [createProgram] = useMutation(CREATE_PROGRAM);
```

#### Update AuthContext:
- Replace Convex auth with Clerk React hooks
- Use `useUser()` and `useAuth()` from `@clerk/clerk-react`

### 7. PostHog Integration

#### Server-side (`src/lib/posthog.ts`):
```typescript
import { posthog } from './posthog';

// In resolvers:
posthog.capture({
  distinctId: ctx.userId || ctx.userEmail || 'anonymous',
  event: 'program_created',
  properties: { programId: program.id },
});
```

#### Client-side:
```typescript
import posthog from 'posthog-js';

posthog.init(process.env.VITE_POSTHOG_KEY!);

// Track events
posthog.capture('page_view', { page: '/dashboard' });
```

### 8. Docker Setup

#### `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

#### `docker-compose.yml`:
```yaml
version: '3.8'
services:
  server:
    build: ./packages/server
    ports:
      - "4000:4000"
    volumes:
      - ./packages/server/prisma/dev.db:/app/prisma/dev.db
      - ./packages/server/uploads:/app/uploads
    environment:
      - DATABASE_URL=file:./prisma/dev.db
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
```

### 9. GitHub Actions CI/CD

#### `.github/workflows/ci.yml`:
```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          # Add deployment steps
```

## Testing Checklist

- [ ] All queries work
- [ ] All mutations work
- [ ] Subscriptions work for realtime updates
- [ ] File uploads work
- [ ] Auth (Clerk) works
- [ ] PostHog events fire
- [ ] Docker builds and runs
- [ ] CI/CD pipeline passes

## Migration Order

1. ✅ Prisma schema
2. ✅ TypeGraphQL types
3. ✅ Auth resolver
4. ✅ Program resolver
5. ⏳ Team resolver
6. ⏳ Task resolver
7. ⏳ Registration resolver
8. ⏳ Attendance resolver
9. ⏳ User resolver
10. ⏳ Report resolver
11. ⏳ Subscriptions
12. ⏳ File uploads
13. ⏳ Frontend migration
14. ⏳ Docker
15. ⏳ CI/CD

## Notes

- Keep Convex running during migration for comparison
- Test each resolver before moving to the next
- Use GraphQL Playground at `/graphql` for testing
- Monitor PostHog for errors
- Keep migration guide updated as you progress

