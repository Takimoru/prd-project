# Docker Setup Instructions

This guide starts the Express + Apollo GraphQL API and PostgreSQL database with Docker Compose.

## Prerequisites
- Docker Engine installed and running.
- Docker Compose (usually included with Docker Desktop).

## Project Structure
- `packages/server/Dockerfile.dev`: Defines the development API image.
- `docker-compose.yml`: Starts the API and PostgreSQL with a persistent database volume.

## How to Run

1. **Navigate to the monorepo root**:
   ```bash
   cd prd-project
   ```

2. **Build and Run**:
   ```bash
   docker compose up --build -d
   ```

3. **Verify**:
   - Check the API health endpoint at [http://localhost:4000/health](http://localhost:4000/health).
   - Send GraphQL requests to [http://localhost:4000/graphql](http://localhost:4000/graphql).
   - The client can be started from the repository root in another terminal:
     ```bash
     pnpm --filter @mentoring/client dev
     ```

## Database
- PostgreSQL uses the `postgres-data` Docker volume and is reachable to the API as `db:5432`.
- The API receives its `DATABASE_URL` from Compose. `DB_PATH` is not used by the current TypeORM/PostgreSQL data source.
- Set `CLERK_SECRET_KEY` in the repository-root `.env` file if authenticated API requests need Clerk.
