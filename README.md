# WebOTP

English | [简体中文](README.zh-CN.md)

A web application for managing OTP (One-Time Password). The system consists of a NestJS backend API and a React frontend interface with internationalization support.

<p align="center">
  <a href="https://github.com/malonzhao/WebOTP/stargazers"><img src="https://img.shields.io/github/stars/malonzhao/WebOTP" alt="GitHub stars"></a>
  <a href="https://github.com/malonzhao/WebOTP/forks"><img src="https://img.shields.io/github/forks/malonzhao/WebOTP" alt="GitHub forks"></a>
  <a href="https://github.com/malonzhao/WebOTP/issues"><img src="https://img.shields.io/github/issues/malonzhao/WebOTP" alt="GitHub open issues"></a>
</p>

![screenshot](assets/screenshot.png)

The product name is **WebOTP**. Package names, import paths, container names and image repositories use the lowercase identifier `webotp`.

Badges refresh through Shields.io and may be cached; follow the links for repository details.

## 🌟 Features

- **User Authentication**
    - Secure JWT-based authentication
- **Platform Management**
    - Create and manage authentication platforms
    - Associate user accounts with platforms
- **Internationalization**
    - Multi-language support (English, Simplified Chinese, Traditional Chinese)
    - Language switching capability
- **Modern UI**
    - Responsive dashboard interface
    - Theme support

## 🛠 Tech Stack

### Backend (apps/api)
- **Framework**: NestJS 11
- **Database**: Prisma .prisma with Sqlite
- **Authentication**: JWT, Passport.js, speakeasy (OTP)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest, Supertest
- **Other**: i18n, Helmet security headers

### Frontend (apps/web)
- **Framework**: React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Headless UI
- **Routing**: React Router 7
- **i18n**: i18next
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Shared
- TypeScript
- Monorepo structure (pnpm workspace)
- ESLint + Prettier
- Jest for testing

## 🐳 Usage(Docker Container)

**Quick Start**
```bash
# Run with Docker Compose (recommended):
cd docker && docker compose -f docker-compose.yaml up -d
```

```bash
# Alternative Run with Docker:
docker run -d --name webotp \
  -e ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456 \
  -e JWT_SECRET=webotp_secret_key \
  -e JWT_REFRESH_SECRET=webotp_refresh_secret_key \
  -p 8080:8080 \
  -v $(pwd)/data:/root/.otp \
  ghcr.io/malonzhao/webotp:latest
```

Open a browser and visit http://localhost:8080 to use the application.

**Additional Environment Variables**
```dotenv
# 32-byte encryption key for encrypting sensitive OTP data
# DO NOT use default key in production - must be changed and kept secure
ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456

# Secret key used for signing JWT access tokens
# Unique value required in production - should be 32+ characters
JWT_SECRET=webotp_secret_key

# Secret key for signing JWT refresh tokens
# Must be different from JWT_SECRET for security
JWT_REFRESH_SECRET=webotp_refresh_secret_key

# Access token expiration time in seconds
# 3600s = 1 hour, adjust based on security requirements
JWT_EXPIRES_IN=1800s

# Database connection string in Prisma format for sqlite
DATABASE_URL=file:${HOME}/.otp/otp.db
```

### Migrating from the previous naming

The former `web-otp` container/service and image references are replaced by `webotp`. Workspace packages move from `@web-otp/*` to `@webotp/*`; update local scripts accordingly. Old package aliases and image tags are not published by the updated workflow.

Before upgrading, record the old container's image ID and repository digest (if available), the original data directory, ports, environment values and Compose project name. Keep the old image locally for rollback. Preserve the actual `ENCRYPTION_KEY`, `JWT_SECRET` and `JWT_REFRESH_SECRET`; the new example values are not replacement keys. The database path and format are unchanged.

**Compose deployments**

Run these steps from the existing deployment's `docker` directory. Substitute the original Compose project name for `EXISTING_PROJECT` throughout. Before replacing your old configuration, save a protected copy in the same directory so relative data paths remain valid:

```bash
cp docker-compose.yaml compose.previous.yaml
chmod 600 compose.previous.yaml
docker inspect --format '{{.Image}}' web-otp
docker image inspect --format '{{json .RepoDigests}}' OLD_IMAGE_ID
docker pull ghcr.io/malonzhao/webotp:latest
```

Replace `OLD_IMAGE_ID` with the recorded image ID. If pulling the new image fails, wait until it is published; keep the old service running. Pin the saved configuration's image to the recorded old digest or image ID for rollback.

Replace the current Compose file with the new configuration, preserving your actual environment values, original volume source and any custom ports. A Compose `.env` file alone does not override literal values in `environment`; edit those entries or retain your existing interpolation/override configuration. Include your existing override files in the commands if applicable. Then stop the old service, back up its data while stopped, and start the new service:

```bash
docker compose -p EXISTING_PROJECT -f compose.previous.yaml stop web-otp
tar -czf "otp-data-before-rename-$(date +%Y%m%d-%H%M%S).tgz" -C ./data .
docker compose -p EXISTING_PROJECT -f docker-compose.yaml up -d webotp
```

Use your actual data directory in the backup command if it differs from `./data`. Keep the backup private. Confirm login, existing bindings and OTP generation at your configured URL. Leave the old container stopped until the new deployment is verified; never run both against the same database or use `down -v` during this migration.

To roll back, stop the new service before starting the previous configuration with the same data and keys:

```bash
docker compose -p EXISTING_PROJECT -f docker-compose.yaml stop webotp
docker compose -p EXISTING_PROJECT -f compose.previous.yaml up -d web-otp
```

**Standalone `docker run` deployments**

Record the image ID/digest as above and successfully pull the new image before stopping the old container. Save your actual environment values in a private file outside the repository, such as `/absolute/path/retained.env` with mode `600`. Stop `web-otp`, back up its original data directory while stopped, then start the new container using the same mount, ports and environment:

```bash
docker stop web-otp
tar -czf "otp-data-before-rename-$(date +%Y%m%d-%H%M%S).tgz" -C /absolute/path/data .
docker run -d --name webotp --env-file /absolute/path/retained.env \
  -p 8080:8080 -v /absolute/path/data:/root/.otp \
  ghcr.io/malonzhao/webotp:latest
```

Replace the absolute paths and port mapping with those from the old deployment, retaining any other custom runtime options. Keep the old container for rollback. If verification fails, run `docker stop webotp` followed by `docker start web-otp`. If database recovery is needed, restore the backup only while both containers are stopped. Do not remove old containers/images until you no longer need rollback.

## 🚀 Development

### Prerequisites
- Node.js v22+
- pnpm v10+

### Setup
1. Install dependencies:
```bash
pnpm install
```

2. Generate prisma ORM files
```bash
pnpm -F @webotp/api prisma:generate
```

3. Set up environment variables:
```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your database connection
```

4. Run database migrations:
```bash
pnpm -F @webotp/api db:migrate
```

5. Execute seed data population:
```bash
pnpm -F @webotp/api db:seed
```

## 🏃‍♂️ Running the Application

Start both services in separate terminals:

```bash
pnpm dev
```

The application will be available at:
- API: `http://localhost:3000`
- Web: `http://localhost:5173`

Default account credentials: `admin` / `admin123`

## 🧪 Testing

Run tests for specific applications:

```bash
# Backend tests
pnpm --filter @webotp/api test

# Frontend tests
pnpm --filter @webotp/web test
```

## 🤝 Contributing

When updating this README, update both the English and Simplified Chinese editions together.

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
