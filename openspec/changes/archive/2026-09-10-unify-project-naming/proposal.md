## Why

The project currently mixes `WebOTP`, `Web OTP`, `web-otp`, and `web_otp`, causing inconsistencies between package references, deployment examples, and actual published image addresses. Standardizing the display name and technical identifiers gives development, builds, and deployment a single naming convention.

## What Changes

- Standardize the display name as `WebOTP` in documentation, package descriptions, and UI text; keep the already-correct title and appName values in all three languages consistent.
- Under the exception confirmed by the user, use lowercase `webotp` for technical identifiers: update the root package, workspace scope, import paths, TypeScript/Jest mappings, pnpm filters, container names, and Compose service names together.
- Have Docker builds read the root package's packageManager field to install the pnpm version declared by the project, avoiding incompatibility between the latest global version and the existing lockfile.
- **BREAKING**: Rename `@web-otp/*` to `@webotp/*`; do not provide compatibility aliases for old package names or commands.
- **BREAKING**: Standardize deployment examples and the release workflow on `ghcr.io/<lowercase owner>/webotp`, with `ghcr.io/malonzhao/webotp` as the current official example; stop referencing the old image address in current configuration and document migration steps for old containers.
- Update the project prefix in example JWT values to `webotp`; do not modify keys, environment files, or persistent data in users' actual deployments.
- Add deployment migration and rollback instructions to the documentation; historical migration instructions may explicitly reference old names to identify old resources.

## Capabilities

### New Capabilities

None. This change standardizes names, code references, tooling configuration, and documentation without adding business capabilities; delta specs are skipped through `skip_specs: true` in `.openspec.yaml`.

### Modified Capabilities

None. The business behavior of OTP, authentication, interfaces, and the data model remains unchanged.

## Impact

- `package.json`, `apps/*/package.json`, and `packages/shared/package.json`; check whether the lockfile needs updating without upgrading dependencies.
- Frontend shared-type imports, `apps/web/tsconfig.json`, and `apps/api/jest.config.js`.
- `docker/Dockerfile`, `docker/docker-compose.yaml`, `.github/workflows/release.yml`, `README.md`, and `apps/api/.env.example`.
- Preserve the physical directories `apps/api`, `apps/web`, and `packages/shared`, API routes, the database schema, the `./data:/root/.otp` mount path, and encryption keys.
- Do not rewrite Git history, rename the remote GitHub repository, or delete existing images or production containers. Old names are allowed only in OpenSpec historical notes and explicit migration/rollback instructions.
