## 1. Baseline and Package References

- [x] 1.1 Check differences between main and its remote-tracking branch, and establish the implementation baseline while preserving the change documents; record Git status, dependency installation/Prisma generation, build results, and API test results, identifying pre-existing failures.
- [x] 1.2 Update the name, description, and project keyword in the four package manifests; use pnpm package listings and filters to confirm that the root package `webotp` and the three `@webotp/*` workspace packages are recognized and old package names have no matches.
- [x] 1.3 Update all shared-type imports, frontend tsconfig paths, and the API Jest moduleNameMapper; confirm that the new aliases map to the original shared files, and verify through type checking or resolution checks that no new module-not-found errors are introduced.
- [x] 1.4 Update the Dockerfile's pnpm filters and install the project's declared pnpm version from the root packageManager field; check installation and lockfile consistency, verifying that the new filters locate the API, dependency versions have not been upgraded, the lockfile has no unnecessary changes, and the image build passes.

## 2. Display and Deployment Naming

- [x] 2.1 Standardize display names in current documentation and package descriptions as `WebOTP`, and update development/test commands in the README; check that the page title and appName values in all three languages are `WebOTP` and commands use the new scope.
- [x] 2.2 Rename the Compose service and container to `webotp`, and change the Compose/README image to `ghcr.io/malonzhao/webotp`; verify the names, port 8080, and original data mount path with `docker compose -f docker/docker-compose.yaml config`.
- [x] 2.3 Have the release workflow generate a shared image address using a lowercase owner and the fixed name `webotp`; check the results with a mixed-case owner and a different fork owner, confirming that version and latest tags share the address and do not directly interpolate github.repository.
- [x] 2.4 Update the example JWT prefixes in the README, Compose configuration, and API `.env.example` to `webotp`; check that the examples in all three files are consistent and actual environment files, encryption keys, databases, and environment variable names remain unchanged.

## 3. Migration and Overall Validation

- [x] 3.1 Write migration/rollback steps in the README for Compose and standalone docker run users, covering old service shutdown, port release, image availability, recording the original image digest, data backup, and preservation of actual keys; review the command sequence step by step to confirm that it does not delete data volumes or run two instances against the same database simultaneously.
- [x] 3.2 Scan version-controlled source, configuration, and documentation for old naming and case variants; confirm that old names are allowed only in OpenSpec historical notes and explicitly labeled migration/rollback instructions, and that current usage paths and examples all use the new naming.
- [x] 3.3 Run the project build, existing API tests, and TypeScript/Jest alias resolution checks, recording results against the baseline; confirm that the rename introduces no new failures, explicitly report pre-existing failures, and do not expand the work into unrelated fixes.
- [x] 3.4 Build the new image locally and use a temporary database directory and a separate port to verify startup, login, account binding, and TOTP generation; recreate the container while retaining the same temporary data and keys, confirm that the binding remains present and OTP generation still works, and record the results without accessing actual deployment data.
- [x] 3.5 Run diff formatting checks and OpenSpec validation, review the change scope and migration documentation, and deliver a validation summary; distinguish local validation from actual release status, and do not automatically publish images or migrate production containers.
