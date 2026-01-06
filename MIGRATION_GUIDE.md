# Migration Guide: Convex → TypeGraphQL + Express + Apollo

## Overview

This document tracks the migration from Convex to a self-managed stack:
- **Backend**: TypeGraphQL + Express + Apollo Server + SQLite (Prisma)
- **Frontend**: Apollo Client
- **Auth**: Clerk
- **Analytics**: PostHog

## Migration Status

### ✅ Completed
- [x] Prisma schema updated to match all Convex tables
- [x] TypeGraphQL dependencies added
- [x] TypeScript config updated for decorators

### 🚧 In Progress
- [ ] TypeGraphQL schema conversion
- [ ] Clerk authentication setup
- [ ] Apollo Subscriptions for realtime
- [ ] File upload endpoints
- [ ] Frontend Apollo Client migration

### ⏳ Pending
- [ ] All Convex queries → TypeGraphQL @Query
- [ ] All Convex mutations → TypeGraphQL @Mutation
- [ ] PostHog integration
- [ ] Docker setup
- [ ] CI/CD pipeline

## Convex → New Stack Mapping

| Convex Feature | New Implementation |
|----------------|-------------------|
| `query()` | `@Query()` TypeGraphQL resolver |
| `mutation()` | `@Mutation()` TypeGraphQL resolver |
| `ctx.db.query()` | Prisma queries |
| `ctx.db.insert()` | Prisma `create()` |
| `ctx.db.patch()` | Prisma `update()` |
| `ctx.db.delete()` | Prisma `delete()` |
| `ctx.auth.getUserIdentity()` | Clerk `getAuth()` |
| `ctx.storage.generateUploadUrl()` | Multer + Express endpoint |
| Automatic reactivity | Apollo Subscriptions |
| `useQuery()` | `useQuery()` from Apollo Client |
| `useMutation()` | `useMutation()` from Apollo Client |

## Key Files to Migrate

### Backend
- `convex/auth.ts` → `src/graphql/resolvers/auth.resolver.ts`
- `convex/programs.ts` → `src/graphql/resolvers/program.resolver.ts`
- `convex/teams.ts` → `src/graphql/resolvers/team.resolver.ts`
- `convex/tasks.ts` → `src/graphql/resolvers/task.resolver.ts`
- `convex/attendance.ts` → `src/graphql/resolvers/attendance.resolver.ts`
- `convex/registrations.ts` → `src/graphql/resolvers/registration.resolver.ts`
- `convex/users.ts` → `src/graphql/resolvers/user.resolver.ts`
- `convex/reports.ts` → `src/graphql/resolvers/report.resolver.ts`
- `convex/workPrograms.ts` → `src/graphql/resolvers/work-program.resolver.ts`
- `convex/activities.ts` → `src/graphql/resolvers/activity.resolver.ts`

### Frontend
- All `useQuery(api.*)` → `useQuery(GQL_QUERY)`
- All `useMutation(api.*)` → `useMutation(GQL_MUTATION)`
- `AuthContext` → Clerk React hooks

## Next Steps

1. Convert existing GraphQL schema to TypeGraphQL classes
2. Set up Clerk middleware
3. Migrate resolvers one by one
4. Add subscriptions for realtime features
5. Update frontend components

