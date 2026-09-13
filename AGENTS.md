# WebOTP agent rules

These repository-wide rules apply to all agents and sessions working in this project.

## Communication and Git changes

- Communicate with the user in Chinese unless requested otherwise. Write commit messages and PR titles/descriptions in English.
- Work on descriptive branches that identify the purpose of the change: `feat/<name>`, `fix/<name>`, `doc/<name>`, `refactor/<name>`, `test/<name>`, or `chore/<name>`.
- Do not create or push `codex/*` branches, including `codex/release-*`. For version-only preparation, use `chore/prepare-v<version>`.
- Keep related changes together and unrelated changes separate. Do not include unrelated local edits in a commit.
- Submit changes through a branch and PR; do not commit or push changes directly to `main`.
- Before writing to the remote, inspect the configured remote and current branch. Use the user's existing authorization; do not repeatedly request permission for already authorized steps.
- If work starts on a legacy branch that violates these rules, preserve its commits and use an allowed branch for subsequent submissions. Do not delete old branches or rewrite shared history without authorization.

## Standard delivery and release sequence

1. Implement and validate the change on an allowed branch.
2. Commit and push that branch, then create a PR targeting `main` with `gh`.
3. Inspect the PR's current head, checks, and mergeability. Merge the reviewed head only after applicable checks pass. Do not bypass required checks or branch protection.
4. For a release, ensure the version update described below has also merged into remote `main`.
5. Create the new tag **on GitHub**, pointing at the exact verified remote `main` commit selected for release.
6. Let the existing tag-triggered GitHub Actions workflow validate, build, and publish the release. Wait for completion and verify the GitHub Release and image publication before claiming success.

An explicit request for the full release process includes the necessary version-preparation PR, its merge after successful checks, remote tag creation, and monitoring publication. A request only to inspect rules or workflows does not authorize publication.

## Version source and maintenance

- Remote GitHub releases and remote tags are authoritative when selecting a version. Inspect both, including unpublished tags, to avoid collisions. Never select or skip a release number because of a local tag.
- If the user specifies a version, check that version against the remote. Otherwise choose an appropriate unused version based on the remote release history and change scope; explain the choice before applying it.
- Do not silently skip from `1.0.4` to `1.0.6` solely because a local `v1.0.5` exists. Verify the remote state first. Do not delete or overwrite a conflicting tag to proceed.
- The root `package.json` is the product release version source. Update it **before merging the release-producing PR**, either in the feature PR when that release is decided or in a separate `chore/prepare-v<version>` PR after collecting multiple changes.
- Ordinary development commits do not require version bumps. Do not bump the version after tagging or have publication mutate the tagged source.
- The selected commit's root version and remote tag must agree exactly: `"version": "X.Y.Z"` corresponds to `vX.Y.Z`.
- Keep workspace package versions unchanged unless their independent versioning or publication is explicitly part of the task. Do not synchronize them merely because the root version changes.

## Remote-only tag creation and publication

- **Never create release tags locally or push tags from the local repository.** Do not use `git tag`, `git push --tags`, or a tag refspec to publish a release.
- Existing or fetched local tags are not release decision inputs. Do not modify them as part of release preparation.
- Use the GitHub API through `gh` to create a remote `refs/tags/vX.Y.Z` reference at the verified release SHA, or use a repository-supported remote workflow. Recheck remote tag absence and the selected commit's version before creation.
- Do not manually create a GitHub Release just to trigger publication. The existing Actions workflow owns image building, GitHub Release creation, release notes, and promotion of `latest`.
- The current release entry point is `.github/workflows/release.yml`: a remote `v*` tag push starts publication. It requires a stable `vMAJOR.MINOR.PATCH` tag matching root `package.json` and a commit contained in remote `main`.
- The workflow also supports manual dispatch on `main` for an existing remote tag. Use that path for an appropriate retry if necessary; do not move the tag or publish another version merely to retry a failed run.
- Before relying on these workflow details, inspect the current workflow files. If the implementation conflicts with the requested process, report and resolve the conflict rather than silently bypassing it.

## Verification and reporting

- Report local commits, remote pushes, PR creation, PR merge, remote tag creation, and completed publication as separate outcomes. Do not describe a triggered workflow as a completed release.
- Verify native AMD64 and ARM64 publication through the release workflow results; do not infer it from a local build.
- Distinguish automated tests, browser E2E observations, and unverified scenarios. In particular, a browser page that still reports `visible` does not validate background-tab suspension or recovery.
- If interrupted or an operation has uncertain results, query current remote state before retrying to avoid duplicate PRs, tags, or releases.
