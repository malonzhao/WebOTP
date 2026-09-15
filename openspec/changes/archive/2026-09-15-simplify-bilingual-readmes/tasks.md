## 1. Remove Redundant Content

- [x] 1.1 Remove the naming paragraph and introductory framework sentence from both READMEs; verify product-purpose descriptions remain and retained executable identifiers are unchanged.
- [x] 1.2 Remove the entire Tech Stack / 技术栈 section and old-naming migration subsection from both editions; verify all associated migration/rollback examples are gone while the current Docker quick start and environment reference remain intact.

## 2. Consolidate Local Development

- [x] 2.1 Replace Development and Running the Application with a single concise section in each language using the sequence in design.md; verify Node.js 22.x, pnpm 10.21.0, environment editing, Prisma generation, migration, seed, parallel startup, URLs, and seeded credentials against the inspected manifests/configuration. Ensure the section is shorter than the former combined sections and does not claim setup was executed unless it was.
- [x] 2.2 Update the contribution branch examples to `feat/amazing-feature` in both editions; verify checkout/push examples match AGENTS.md and each other without unrelated contribution changes.

## 3. Verify Bilingual Documentation

- [x] 3.1 Compare section order, retained technical literals, command blocks, and deleted content across both editions; verify language links, centered HTML badge markup, screenshot, revised feature summary, testing, and license remain intact and local link targets exist.
- [x] 3.2 Preview both Markdown files and run `git diff --check` plus strict OpenSpec validation; verify no broken fences/lists or empty headings, record documentation acceptance evidence and limitations, and confirm the final change scope is the two READMEs plus this change's tracking files. Do not run unrelated application E2E tests.

## 4. Final Copy Refinements

- [x] 4.1 Remove both badge caching notes; verify neither README contains the explanatory Shields.io prose.
- [x] 4.2 Replace the standalone Features section with four localized bullets after the introduction and before statistics; verify placement, matching topic coverage, and absence of the former heading in both files.
