## Context

See proposal.md for scope. Planning starts on `doc/simplify-bilingual-readmes` from remote main `27cd577f1dc5f635308b06feae780f4478dd5859`. GitHub PR #6 records documentation acceptance for that merge; the merge commit's scope, docs, and validate checks passed, with unrelated application/image/workflow jobs skipped. PR #5 records the preceding application acceptance and passing applicable checks. This establishes the inspected baseline, not a new application validation claim.

Both READMEs currently include naming prose, a Tech Stack section, an extensive rename migration section, five separate development setup blocks, and a standalone startup section. Root `dev` runs `pnpm -r --parallel dev`, so its current instruction to start services in separate terminals is inaccurate. Root packageManager pins pnpm 10.21.0; CI uses Node.js 22.x. API scripts provide Prisma generation, migration deploy, and seeding. The seed creates `admin` / `admin123`. API defaults to port 3000 and Vite to 5173.

Design is included to resolve how far development simplification goes and how to retain a complete setup sequence. There are no functional specs to change.

## Goals / Non-Goals

**Goals:** Shorten both editions while preserving a usable local setup path and the user's current header layout. Define explicit deletion boundaries and equivalent instructions.

**Non-Goals:** New documentation site, relocating historical migration instructions, runtime changes, toolchain upgrades, version preparation, release, or broad rewriting of Docker/testing instructions.

## Decisions

### Delete whole sections with precise boundaries

Remove the standalone naming paragraph. Remove Tech Stack through the next Docker heading, and the old-naming migration subsection through the next Development heading. Preserve the current Docker quick start and environment-variable reference above migration. Remove the framework sentence from the introduction so the product summary no longer repeats a technology inventory. Do not remove valid `webotp` identifiers in retained commands.

The earlier README proposal required preserving migration prose during translation; this explicit user request supersedes that requirement. Leave prior change artifacts intact as historical records. Moving the deleted sections elsewhere would add maintenance and is not requested.

### One compact development entry point

Retain Development / 开发 as a single section. Replace Prerequisites, Setup, and Running the Application with a short prerequisite line, one ordered shell block, and a compact access/credentials paragraph. Keep Testing separate for discoverability.

Document Node.js 22.x (the CI baseline) and pnpm 10.21.0 (the root pin), without a toolchain inventory. State that commands run from the repository root. The planned sequence is:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env for local development before continuing.
pnpm -F @webotp/api prisma:generate
pnpm -F @webotp/api db:migrate
pnpm -F @webotp/api db:seed
pnpm dev
```

Use a brief localized comment/prose to explain that the example sets NODE_ENV=production: use development locally, configure DATABASE_URL to a writable local SQLite path, and set the required encryption/JWT values. Do not obscure this manual step by describing the block as unattended execution. Do not overwrite an existing .env during verification. Existing Docker key guidance remains available; do not duplicate the full environment reference.

State that `pnpm dev` starts both services, list `http://localhost:3000` and `http://localhost:5173`, and identify `admin` / `admin123` as the seeded account. Keep initialization operations, rather than reducing the section to install/start and leaving a fresh database unusable. The displayed prerequisites describe the documented baseline, not a change to package engine support.

### Preserve presentation and bilingual equivalence

Keep the title, language selector directly beneath it with the current language as plain text, centered `<p>` / `<a>` / `<img>` badges, and shared screenshot. Match the two editions' section order, retained technical literals, commands, URLs, and meaning. Remove redundant prose rather than hide it in collapsible sections. Fix the existing contribution example to `feat/amazing-feature` because `feature/*` conflicts with AGENTS.md; retain the rest of that section.

## Risks / Trade-offs

- Removing historical migration instructions reduces guidance for old installations → this is explicitly requested; historical Git content remains available, with no new guide or runtime compatibility claim.
- Over-compression can omit setup prerequisites → retain environment editing, generation, migration, seeding, startup, and access details; compare each command to package scripts and config.
- Existing environment examples may require machine-specific paths → require a writable local database location rather than promise every default works unchanged.
- English and Chinese can diverge → compare headings, command blocks (allow translated comments), links, and deleted content together.

## Validation and Delivery

Accept when both files omit the targeted prose/sections, contain one shorter Development section with the complete sequence, and retain unaffected content and HTML layout. Review Markdown previews and relative links; check examples against manifests/configuration and check `git diff --check`. Documentation inspection does not establish a fresh end-to-end setup run; report that boundary explicitly. No unrelated application tests are required.

Future submission must use the documentation branch and a PR with the tested head and evidence, following AGENTS.md. This planning turn creates no commit, push, PR, merge, or release. Before subsequent implementation/submission, recheck intervening baseline changes as required by repository rules.

## Final User-Requested Refinements

Remove the Shields.io caching explanation from both editions. Present four concise feature bullets (account management, user authentication, language switching, responsive interface) directly after the opening product summary and before centered statistics. Remove the former standalone Features section. These explicit follow-up requests supersede the original preservation of that section and its placement; retain the rest of the planned scope.
