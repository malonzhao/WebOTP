# Single build stage for unified build
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
ENV CI=true
WORKDIR /repo

# Copy all project files
COPY . .

# Install dependencies and build both projects
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm -F @web-otp/api prisma:generate
RUN pnpm build
RUN pnpm deploy --filter @web-otp/api --prod --legacy dist

# Final image with nginx and supervisor
FROM --platform=$BUILDPLATFORM node:22-alpine
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
