# WebOTP

English | [简体中文](README.zh-CN.md)

A web application for managing OTP (One-Time Password).

- **Account management**: Organize accounts by authentication platform.
- **User authentication**: Sign in with JWT-based authentication.
- **Language switching**: English, Simplified Chinese, and Traditional Chinese.
- **Responsive interface**: Manage accounts across screen sizes with theme support.

<p align="center">
  <a href="https://github.com/malonzhao/WebOTP/stargazers"><img src="https://img.shields.io/github/stars/malonzhao/WebOTP" alt="GitHub stars"></a>
  <a href="https://github.com/malonzhao/WebOTP/forks"><img src="https://img.shields.io/github/forks/malonzhao/WebOTP" alt="GitHub forks"></a>
  <a href="https://github.com/malonzhao/WebOTP/issues"><img src="https://img.shields.io/github/issues/malonzhao/WebOTP" alt="GitHub open issues"></a>
</p>

![screenshot](assets/screenshot.png)

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

## 🚀 Development

Use Node.js 22.x and pnpm 10.21.0. Run the following commands from the repository root. After copying the environment file, edit it before continuing: set `NODE_ENV=development`, point `DATABASE_URL` to a writable local SQLite path, and configure `ENCRYPTION_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` as described above. Keep an existing `.env` instead of overwriting it.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env before running the remaining commands.
pnpm -F @webotp/api prisma:generate
pnpm -F @webotp/api db:migrate
pnpm -F @webotp/api db:seed
pnpm dev
```

`pnpm dev` starts both services: Web at `http://localhost:5173`, API at `http://localhost:3000`. The seed creates the account `admin` / `admin123`.

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
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
