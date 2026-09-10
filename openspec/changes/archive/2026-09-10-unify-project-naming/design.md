## Context

See proposal.md for motivation and scope. Code inspection found four package manifests using the old name, seven frontend shared-type imports and TypeScript/Jest aliases depending on the old scope, and Docker builds and README commands using old pnpm filters. The page title and appName values in all three languages are already `WebOTP`.

The Compose/README image is `ghcr.io/malonzhao/web-otp`, while the release workflow directly interpolates `github.repository`; the casing of the repository name `WebOTP` therefore enters the image path. The current lockfile uses directories as importers and contains no old project name. This change spans builds and deployment, so a design document is retained; business specs are skipped through skip_specs.

## Goals / Non-Goals

**Goals:**
- Update all naming dependencies together so package discovery, compilation, test mappings, image builds, and documentation references remain consistent.
- Keep existing data readable and provide actionable deployment migration and rollback instructions.

**Non-Goals:**
- Do not change authentication, OTP, pagination, data structures, or physical source directories.
- Do not upgrade dependencies, fix pre-existing test/build issues unrelated to the rename, or automatically perform production migration or releases.
- Do not modify actual JWT/encryption keys, database paths, environment variable names, or browser storage keys.

## Decisions

### 1. Define an explicit mapping for display names and technical identifiers

| Purpose | Target |
| --- | --- |
| Display name and project name in descriptions | `WebOTP` |
| Root package name and project keyword | `webotp` |
| Workspace packages | `@webotp/api`, `@webotp/web`, `@webotp/shared` |
| Shared-type imports/aliases | `@webotp/shared/types`, `@webotp/shared/*` |
| Compose service/container_name | `webotp` |
| GHCR image | `ghcr.io/<lowercase owner>/webotp` |
| Example JWT values | `webotp_secret_key`, `webotp_refresh_secret_key` |

The user has confirmed the exception for lowercase technical identifiers. Enforcing uppercase everywhere would violate package and image naming constraints; retaining aliases for the old scope would perpetuate two naming schemes, so that option is rejected. Directories such as `apps/api` do not contain the old name and do not need to be moved.

### 2. Update all code and tooling references in the same change

Update the manifests, seven frontend shared-type references, tsconfig paths, Jest moduleNameMapper, Docker pnpm filters, and README commands together. Preserve the existing relative path targets and type definitions. Check the lockfile during installation and update it only if the tooling produces necessary changes; do not manually change dependency versions or perform unrelated workspace refactoring.

Container verification found that `npm install -g pnpm` in the Dockerfile installs the latest pnpm version, which is incompatible with the current lockfile. Docker builds therefore read `packageManager` from the root `package.json` (currently `pnpm@10.21.0`) and install that same version, keeping the container aligned with the verified local installation without upgrading dependencies or the lockfile.

### 3. Explicitly generate a consistent image address

The release workflow obtains the owner from `GITHUB_REPOSITORY_OWNER`, converts it to lowercase, and generates a single value, `ghcr.io/<owner>/webotp`, shared by the version and latest tags. The official README/Compose configuration uses `ghcr.io/malonzhao/webotp`. This preserves support for fork owners while preventing the repository name and its casing from affecting the image name. Hardcoding the official owner would hinder forks, while directly reusing github.repository would retain the current inconsistency.

Do not delete old images or continue publishing tags under the old name; the new configuration references only the canonical name. This change only adjusts the local workflow. Actual image availability must be confirmed after release; a local build is not evidence of a successful push.

### 4. Handle example updates separately from migration of actual configuration

Update the project prefix in example JWT values in the README, Compose configuration, and `.env.example`; deployed instances continue using their original values. Preserve the environment variable names `ENCRYPTION_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`, as well as `./data:/root/.otp` and the database file path. The migration documentation explicitly instructs users to copy the actual environment values from the old deployment, preventing the new examples from being treated as a key rotation operation.

### 5. Assess remaining old names according to their use

Scan current Git-tracked source, configuration, and documentation for case variants of names such as `web-otp`, `web_otp`, and `Web OTP`; none may remain in executable configuration or current usage examples. Old names are allowed only in OpenSpec change history and README text or commands explicitly labeled as migration/rollback instructions. Do not replace content in `.git`, dependencies, build outputs, user environment files, or databases. Allow `webotp` only as a technical identifier; use `WebOTP` for product display.

## Risks / Trade-offs

- [Existing installations use a different image path] → Switch only after the new image is published and can be pulled; record the old image digest for rollback.
- [Renaming a service leaves an old container occupying port 8080] → Require the documentation to instruct users to stop the old service with the old Compose file before starting the new service, preserve data, and avoid running two services against the same database simultaneously.
- [Replacing examples changes keys in an existing deployment] → Preserve actual environment values during migration; changing the encryption key would make existing OTP secrets undecryptable.
- [Existing validation issues obscure rename regressions] → Record results before and after the change. Observed issues include users tests calling a nonexistent update method, tests lacking an I18nService provider, and shared test being a failing placeholder script; do not attribute these failures to the rename or claim that all tests pass.
- [Static scans cannot prove correct runtime behavior] → Combine them with workspace package discovery, compilation, alias resolution, Compose configuration checks, and local container smoke verification.

## Migration Plan

1. Check the working tree and branch state before implementation; main is currently one commit behind its remote-tracking branch. Determine the impact of that commit first while preserving this change's documents.
2. Record baseline validation results, complete naming and reference changes, install dependencies, and generate the Prisma client; do not touch the actual database.
3. Confirm that all four new package names are discoverable and old filters have no matches; run the build and existing API tests, and check the new TypeScript/Jest aliases. Distinguish pre-existing failures from new regressions.
4. Use Compose config to check services, images, and mounts; build the newly named image locally and use a temporary data directory and a separate port to verify startup, login, OTP binding creation, and code generation. Verify that data remains readable after recreating the container with the same temporary database and encryption key.
5. Provide upgrade steps in the README: record the old image digest/version, actual keys, and Compose project name; stop the old service and back up the database; confirm the new image has been published and can be pulled; start `webotp` with the same project/data directory and actual keys. Do not use options that delete volumes.
6. For rollback, stop the new service and start the old service with the old Compose file, original image digest, same data directory, and same keys; use the backup after stopping services only if database recovery is needed. The naming change requires no database migration.
7. The implementation deliverables include local validation results and migration documentation. Publishing, production cutover, and deletion of old resources are not automatic tasks in this change.
