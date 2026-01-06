# Docker Setup Instructions

This guide explains how to run the new Express + Apollo + SQLite stack using Docker.

## Prerequisites
- Docker Engine installed and running.
- Docker Compose (usually included with Docker Desktop).

## Project Structure
- `backend/Dockerfile`: Defines the backend image.
- `docker-compose.yml`: Orchestrates the server service and mounts a volume for the SQLite database.

## How to Run

1. **Navigate to the monorepo root**:
   ```bash
   cd mentoring-v2
   ```

2. **Build and Run**:
   ```bash
   docker-compose up --build
   ```

3. **Verify**:
   - Access the GraphQL Playground at [http://localhost:4000/graphql](http://localhost:4000/graphql).
   - You should see the Apollo Server interface.
   - Run the sample query:
     ```graphql
     query {
       hello
       users {
         name
         email
       }
     }
     ```

## Database
- The SQLite database file will be created at `./data/database.sqlite` on your host machine (mapped to `/app/data/database.sqlite` in the container).
- This ensures data persistence across container restarts.

## Next Steps
- Implement migration scripts to initialize schema tables properly (currently just a raw CREATE TABLE in `db.ts`).
- Add environment variables for Clerk secrets in `docker-compose.yml` or a `.env` file.
