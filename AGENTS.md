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

## Stable development baseline

- `main` is the stable development baseline. Only reviewed, tested, and accepted changes belong there; it is not a staging area for unfinished requirements or integration experiments. Stable does not mean bug-free, and passing CI alone does not establish acceptance.
- Start independent requirement branches from the latest verified stable remote `main` commit. Before branching, inspect remote `main`, its applicable checks, and the relevant PR acceptance evidence. Record the base SHA. An unverified latest commit is not automatically a stable baseline.
- If the latest `main` has a known regression or unresolved acceptance failure, report it and prioritize a fix or revert. When independent work must continue, use an explicitly identified earlier verified stable commit and record the reason; do not silently propagate the affected baseline.
- Do not start independent work from another requirement branch, an unaccepted release candidate, a version-preparation branch, or a temporary integration branch. If requirements truly depend on each other, document the dependency explicitly and validate the prerequisite before the dependent change enters `main`.
- A new branch inherits its base commit. Existing branches do not receive later fixes or reverts automatically; affected branches must incorporate the correction and rerun relevant checks before merging.

## Validation and acceptance before merging

- Define observable acceptance criteria from the user's request before implementation. Cover the intended behavior, relevant failure paths, and affected existing behavior; scale validation to the change's risk and scope.
- Validate the requirement branch before merging. Use an isolated preview/test environment for UI and integration work. Exercise the affected user journeys and regression scenarios; for UI changes, include keyboard interaction and relevant responsive/theme states.
- Record evidence in the PR: the tested head SHA, acceptance criteria and results, automated checks, browser/manual observations when applicable, and remaining limitations. Do not claim untested scenarios passed or interpret a generic request to merge/release as proof of acceptance.
- Agents may verify objective acceptance criteria within the user's authorized scope. If a required criterion depends on the user's judgment or information only they possess, present the concrete result for acceptance. Do not introduce an additional approval request for criteria already accepted in the session.
- Documentation-only changes can satisfy acceptance through checking meaning, consistency, examples, and conflicts with existing rules; they do not require unrelated application E2E tests.
- Before merging, verify the current PR head matches the reviewed and tested head, applicable checks pass, acceptance criteria are satisfied, and the result is compatible with current `main`. Use an exact-head merge guard. Do not bypass required checks or branch protection.
- If the PR head changes or intervening `main` changes can affect the result, revalidate the affected combination before merging. Prefer testing the prospective merge result in CI or an isolated checkout. After merging, verify the actual remote merge commit's applicable checks; hold dependent merges and publication if they fail.
- An unresolved acceptance failure or known blocking regression prevents merging. An untested non-blocking scenario must be disclosed with the reason it is outside the required acceptance scope, rather than silently treated as validated.

## Temporary integration and regression recovery

- When several requirements need joint validation, create a disposable branch named `test/integration-<purpose>` from the verified stable baseline and merge the selected requirement heads into it. Record those SHAs and test the combined behavior in an isolated environment.
- Never use a temporary integration branch as the base for new development, merge it wholesale into `main`, or publish a release from it. Keep fixes on the owning requirement branches and update the integration candidate for retesting.
- After acceptance, merge the individual requirement PRs into `main` in dependency order. Recheck each prospective merge against the current baseline; a previous integration test does not validate an arbitrary new combination of commits.
- If a regression reaches `main`, identify the introducing commit and affected dependent branches. Prepare a focused fix or revert PR, validate it, and restore the stable baseline before continuing affected integration or publication. Do not reset or force-push shared history.
- Sync the correction into affected branches through the repository's normal PR/merge workflow and rerun the relevant acceptance checks. Merely fixing `main` does not repair branches already based on the faulty commit.

## Standard delivery and release sequence

1. Identify the verified stable remote `main` base, define acceptance criteria, and implement on an allowed requirement branch.
2. Commit and push that branch, then create a PR targeting `main` with `gh`. Attach the validation and acceptance evidence described above; opening a PR does not authorize bypassing acceptance.
3. Complete branch-level and, when needed, combined integration acceptance. Merge the exact accepted head only after the pre-merge gates pass, then verify the actual remote merge commit's checks.
4. For a release, ensure the version update described below has also merged into remote `main` through the same applicable gates. A version-preparation branch only updates release metadata; requirement branches continue to target `main`.
5. Select the exact remote `main` commit for release and verify its version, applicable checks, and acceptance of the final combination. Resolve blocking regressions before tagging; the publication workflow is an additional check, not a substitute for pre-merge acceptance.
6. Create the new tag **on GitHub**, pointing at that verified release commit.
7. Let the existing tag-triggered GitHub Actions workflow validate, build, and publish the release. Wait for completion and verify the GitHub Release and image publication before claiming success.

An explicit request for the full release process includes the necessary version-preparation PR, its merge after successful checks and applicable acceptance, remote tag creation, and monitoring publication. This authorization does not waive the stable-baseline gates. A request only to inspect rules or workflows does not authorize publication.

## Version source and maintenance

- Remote GitHub releases and remote tags are authoritative when selecting a version. Inspect both, including unpublished tags, to avoid collisions. Never select or skip a release number because of a local tag.
- If the user specifies a version, check that version against the remote. Otherwise choose an appropriate unused version based on the remote release history and change scope; explain the choice before applying it.
- Do not silently skip from `1.0.4` to `1.0.6` solely because a local `v1.0.5` exists. Verify the remote state first. Do not delete or overwrite a conflicting tag to proceed.
- The root `package.json` is the product release version source. Update it **before merging the release-producing PR**, either in the feature PR when that release is decided or in a separate `chore/prepare-v<version>` PR after collecting multiple changes.
- When an immediate release is already authorized and the requirement PR is still open, prefer including the root version update in that PR and revalidating its new head. Use a separate version-preparation PR when changes have already merged or several accepted changes are being collected. Do not use that branch to collect unaccepted features or treat a version-only change as proof of product acceptance.
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
