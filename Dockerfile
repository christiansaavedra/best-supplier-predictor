FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# Install dependencies once, cached until a package.json or the lockfile changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS source
COPY . .

# API: apply migrations, seed if empty, start. Env vars come from Compose, not a .env file.
FROM source AS api
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "pnpm exec tsx src/db/migrate.ts && pnpm exec tsx src/db/seed.ts && pnpm start"]

FROM source AS web-build
RUN pnpm --filter web build

# Web: only the standalone Next.js output.
FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=web-build /app/apps/web/.next/standalone ./
COPY --from=web-build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
