ARG NODE_VERSION=20.19.6

# --- Stage 1: Base ---
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /usr/src/app

# --- Stage 2: Dependencies ---
FROM base AS deps
# Copy workspace config and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
# Copy all package.json files from the workspace
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Install dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# --- Stage 3: Build ---
FROM deps AS builder
COPY . .
# Re-run install to ensure workspace symlinks are correctly established in this stage
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @mentoring/backend build

# --- Stage 4: Production Bundle (Deploy) ---
FROM builder AS deployer
# pnpm deploy creates a self-contained production directory
RUN pnpm --filter @mentoring/backend --prod deploy /pruned

# --- Stage 5: Execution (Runner) ---
FROM base AS runner
ENV NODE_ENV=production

# Set up the application directory with correct permissions as root
WORKDIR /app
RUN mkdir -p /app/prisma && chown -R node:node /app

# Switch to non-root user for security
USER node

# Copy the pruned, self-contained package
COPY --from=deployer --chown=node:node /pruned ./
# Copy the compiled JS from the builder stage
COPY --from=builder --chown=node:node /usr/src/app/packages/server/dist ./dist

EXPOSE 4000

# In production, run the compiled JS
CMD [ "node", "dist/index.js" ]
