# WebOTP

A web application for managing OTP (One-Time Password). The system consists of a NestJS backend API and a React frontend interface with internationalization support.

The product name is **WebOTP**. Package names, import paths, container names and image repositories use the lowercase identifier `webotp`.
![screenshot](assets/screenshot.png)
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

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Release workflow

CI runs on pull requests and pushes to `main`, selecting checks by branch intent
and changed files. Release validation always installs the pinned pnpm version,
generates Prisma Client, runs lint and tests, and builds both applications. Configure the repository's main branch
rules to require the `validate` CI check before merging. Frontend lint currently
allows the four existing React Hooks warnings; additional warnings fail CI.

To release, update the root `package.json` version in a normal pull request.
After merging, tag that exact commit and push the tag. For example, for a version
of `1.0.5`:

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.0.5 -m "Release v1.0.5"
git push origin v1.0.5
```

Only stable `vMAJOR.MINOR.PATCH` tags matching the root package version and pointing
to a commit on `main` can publish. The workflow builds native dependencies for
both `linux/amd64` and `linux/arm64` on native `ubuntu-24.04` and
`ubuntu-24.04-arm` runners using Buildx. Each runner pushes its image by digest;
after both succeed, the release job merges their manifests into the versioned
GHCR image and verifies both platforms before creating a GitHub Release.
QEMU is not used, and each architecture has its own build cache. Only the highest
published stable version is promoted to the image and GitHub Release `latest`.
Release jobs are serialized and never push commits back to `main`.

If publication fails, rerun the failed workflow jobs for the same tag. A version
image already in GHCR is reused, and an existing Release is preserved. Never move
a published tag; use a new version for changed code. GitHub concurrency retains
at most one pending run, so push one release tag at a time and wait for completion;
rerun a pending release if GitHub replaced it with a newer queued run.

Workflow maintenance does not require a new application version or tag. After
merging workflow fixes into `main`, use the manual Release entry point to publish
an existing tag with the current workflow:

```bash
gh workflow run release.yml --ref main -f tag=v1.0.4
```

In the Actions UI, select Release → Run workflow, choose `main`, and enter the
existing tag. Manual runs from other branches are skipped. The workflow resolves
the tag once to a commit SHA; validation and both image builds check out that
same SHA. Image revision labels use the source SHA, not the workflow commit.
The Dockerfile and dependency versions also come from the source tag.
Rerunning an old run still uses its old workflow, so start a new manual run after
workflow fixes. Existing version images are reused rather than overwritten.

Workflow responsibilities:

- `ci.yml`: change classification, selected checks, and the stable `validate`
  gate; an explicitly supplied release SHA always receives full validation.
- `release.yml`: automatic tag/manual entry, version and ancestry checks, source
  SHA resolution, existing-image detection, and publication concurrency.
- `build-images.yml`: reusable native AMD64/ARM64 builds with per-platform caches
  and digest artifacts; no public version tag is created by an individual build.
- `publish-release.yml`: reusable manifest merge, platform verification, GitHub
  Release creation, and latest-version promotion.

The two reusable publication workflows have no independent push/manual trigger.
A failed validation or architecture build prevents publication; a retry with an
existing image skips rebuilding but still validates source and image platforms.

### Branch intent and CI selection

| PR branch prefix | Intended change | Checks |
| --- | --- | --- |
| `docs/` | Documentation | Documentation checks when only documentation changes |
| `ci/` | Workflows | Workflow checks when workflow files change |
| `feat/`, `fix/`, `refactor/` | Application code | Full application validation |
| `build/`, `deps/` | Build or dependencies | Full validation and an AMD64 image build without publishing |
| `chore/` | Other maintenance | Selected from changed files |
| Any other prefix | Unclassified | Full application validation plus applicable file checks |

Actual files take precedence: application code and unknown file types require full
validation even on a `docs/` branch. Docker files, package manifests, pnpm lockfile,
workspace configuration, and npm configuration also require an image build.
Markdown and documentation assets select documentation checks; scripts placed in
`docs/` still require full validation. `.github/` changes run classifier tests and
actionlint. Documentation checks currently detect unresolved conflict markers;
they do not check prose quality or external links.

PRs compare the merge base against the PR head. Pushes to `main` compare the
before/after commits and use file changes, since the original branch prefix is no
longer available. If the comparison cannot be determined, all checks run.
The `validate` job always summarizes selected checks and fails on any failure or
cancellation, while permitting intentional skips. Keep it as the required branch
check instead of requiring conditional jobs individually.

Branch prefixes never trigger a release. Only version tags or the manual Release
entry publish images; CI image checks do not log in to GHCR or push images.
