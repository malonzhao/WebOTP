## Why

Both READMEs contain implementation inventories and historical naming instructions that distract from using WebOTP. The development instructions are spread across repeated setup steps and a separate startup section, making the local quick start longer than necessary.

## What Changes

- Remove the product/package/container naming explanation from both editions.
- Remove the entire Tech Stack / 技术栈 section and the framework inventory sentence in the introduction; retain a short product-purpose description.
- Remove Migrating from the previous naming / 从旧命名迁移, including its Compose and standalone migration, backup, and rollback instructions. Do not relocate this historical material into a new guide.
- Consolidate Development / 开发 and Running the Application / 运行应用 into one concise local-development section: prerequisites, ordered setup/start commands, service URLs, and seeded account credentials.
- Keep bilingual content equivalent. Preserve language navigation, centered HTML statistics badges, screenshot, current Docker quick start and environment reference, testing, contribution, and license content except for a directly conflicting contribution branch example.
- Update the contribution branch example in both editions from `feature/AmazingFeature` to `feat/amazing-feature` to match AGENTS.md.

- Remove the badge caching explanation in both languages. Move and condense Features into four concise bullets directly after the introductory sentence, before statistics, removing the standalone Features heading.

## Capabilities

### New Capabilities

None. This is documentation-only; `skip_specs: true` explicitly opts out of functional specification deltas.

### Modified Capabilities

None. No application behavior changes. The previous README change's preservation of migration material is superseded by this explicit removal request; its historical artifacts remain untouched.

## Impact

Implementation is limited to `README.md` and `README.zh-CN.md`, plus tracking for this change. No package, application, Docker, CI, version, or release changes are needed. Acceptance is based on deletion scope, bilingual consistency, valid development commands, retained links, and Markdown rendering; unrelated application E2E tests are unnecessary.
