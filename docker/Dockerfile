# Single build stage for unified build
FROM node:22-alpine AS builder
ENV CI=true
WORKDIR /repo

# Cache dependency installation independently of application source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -F @webotp/api prisma:generate
RUN pnpm build
RUN pnpm deploy --filter @webotp/api --prod --legacy dist

# Final image with nginx and supervisor
FROM node:22-alpine
RUN apk update && apk add --no-cache nginx supervisor
RUN rm -rf /var/cache/apk/* /tmp/*
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /repo/dist ./
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

# Copy config files
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh ./

ENV NODE_ENV=production
ENV HOME=/root
ENV DATABASE_URL=file:${HOME}/.otp/otp.db
ENV JWT_EXPIRES_IN=1800s

EXPOSE 80

ENTRYPOINT ["/app/entrypoint.sh"]
