# Implementation validation

Validation date: 2026-09-09; Docker verification was completed on 2026-09-10. Implementation baseline: `73da812` (main was fast-forwarded from `ead7c23`, incorporating only the upstream automated patch version bump to 1.0.4).

## Completed checks

- The baseline `pnpm install --frozen-lockfile` succeeded; Prisma 6.17.1 client generation succeeded. No migrations were run against the actual database.
- `pnpm build` succeeded both before and after the rename, producing both API and frontend build outputs; the frontend output asset filenames and sizes were identical.
- API Jest results were 2 failing suites and 13 failing tests both before and after the rename. Comparing failing test titles and error messages one by one showed identical results, all caused by test modules lacking an I18nService provider. The rename introduced no new test failures; the API tests cannot be reported as passing.
- `pnpm list -r --depth -1` correctly displayed the root package `webotp` and `@webotp/api`, `@webotp/web`, and `@webotp/shared`. The new API filter located the directory; the old scope filter had no matches.
- Repeating installation with a frozen lockfile after the rename succeeded, with no changes to `pnpm-lock.yaml` or dependency versions.
- The TypeScript compiler's module resolution API confirmed that `@webotp/shared/types` resolves to `packages/shared/types/index.ts`; the Jest mapper points to the same shared-type directory.
- Executing the workflow's image naming script produced `ghcr.io/malonzhao/webotp` for `MalonZhao` and `ghcr.io/other-fork/webotp` for `Other-Fork`; version and latest tags share the same output.
- YAML parsing passed; static checks confirmed the Compose service/container name, image, port 8080 mapping, and `./data:/root/.otp` mount. This check is not equivalent to executing Docker Compose.
- Package names, the page title, appName values in all three languages, and the three sets of example JWT values were checked against the naming convention.
- Scanning Git-tracked text found old names only in explicitly labeled README migration/rollback instructions; OpenSpec records were excluded as historical notes. Current source, configuration, and development/deployment examples contain no old names.
- The README's Compose/standalone container migration and rollback sequence was reviewed: it requires preserving the old image, actual keys, and data, stopping the old service before taking a backup and starting the new service.
- `git diff --check` and `openspec validate unify-project-naming --strict --no-interactive` passed.

## Completed container verification

- After the user installed Docker, the remaining verification was completed using Docker Desktop 4.90.0, Engine 29.7.2, and Compose 5.5.1; the local platform was linux/amd64, and ARM64 verification was not performed.
- Task 2.2: `docker compose -f docker/docker-compose.yaml config --format json` succeeded. Checks confirmed that the sole service/container name is `webotp`, the image is `ghcr.io/malonzhao/webotp:latest`, the port is 8080, and the mount remains the original `docker/data` directory to `/root/.otp`. Only the deployment configuration was read; no service was started using that actual data directory.
- The first image build failed during dependency installation: the Dockerfile installed the latest pnpm version and reported `ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE`. It was changed to read the root package's `packageManager` field and install `pnpm@10.21.0`, matching the verified local tooling version; the project lockfile and dependency declarations were unchanged.
- `docker build -f docker/Dockerfile -t webotp:unify-project-naming-test .` succeeded, including dependency installation, Prisma generation, frontend/backend builds, and API deploy packaging.
- Task 3.4: Temporary containers were started from that image using a separate database directory under `/private/tmp`, randomly generated test keys, and random host ports on `127.0.0.1`. The WebOTP page title was retrieved through Nginx, login succeeded, and platform and account binding creation succeeded.
- The OTP endpoint returned a six-digit code and 1–30 seconds of remaining validity; comparison against a TOTP calculated with an independent HMAC-SHA1 implementation passed. The secret in the temporary SQLite database was verified to be encrypted.
- The first container was stopped and removed, then a new container was created using the same database directory and test keys. After logging in again, the binding ID, account name, and stored encrypted secret were unchanged, and the generated TOTP again matched the independent calculation.
- All test containers were stopped and automatically removed, completing tasks 2.2 and 3.4. The temporary database was cleaned up after verification; the local test image was retained.

## Delivery state

A total of 18 existing project files were changed, in addition to this change's documents, and 13/13 tasks are complete. Actual environment files, databases, encryption keys, API routes, and physical source directories were not modified; this rename was not committed, no image was published, and no production service was migrated. The availability of the new GHCR image for pulling has not been verified; smoke verification used a locally built image.

Local build logs are at `/tmp/WebOTP-baseline-build.log` and `/tmp/WebOTP-renamed-build.log`; test logs are at `/tmp/WebOTP-baseline-test.log` and `/tmp/WebOTP-renamed-test.log`. These are temporary logs; this summary preserves the main results.

Container build log: `/tmp/WebOTP-docker-build.log`; smoke verification script: `/tmp/WebOTP-container-smoke.py`; machine-readable results: `/tmp/WebOTP-container-smoke-result.json`.
