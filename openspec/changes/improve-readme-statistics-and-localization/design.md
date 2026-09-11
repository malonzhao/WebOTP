## Context

See `proposal.md` for motivation and scope. The repository currently has one English `README.md`, a shared `assets/screenshot.png`, and no published capability specs. The Git origin identifies `malonzhao/WebOTP`. Existing documentation contains detailed rename migration and rollback instructions that must remain complete in both languages.

This design records the external badge integration and localization choices before implementation. Reference: [Shields repository](https://github.com/badges/shields) demonstrates README badge integration. No live repository counts are assumed or recorded in prose.

## Goals / Non-Goals

**Goals:** Use GitHub-compatible Markdown, keep statistics maintainable without credentials, and provide equivalent English and Simplified Chinese instructions.

**Non-Goals:** Application localization changes, build/CI changes, release or download claims, visitor tracking, historical star charts, and unrelated corrections to existing setup instructions.

## Decisions

### Keep both editions at the repository root

Use `README.md` and `README.zh-CN.md`; this keeps existing entry points and identical relative paths to `assets/screenshot.png` and `LICENSE`. Add `[English](README.md) | [简体中文](README.zh-CN.md)` immediately after the application screenshot in both editions. A docs subdirectory would introduce unnecessary path differences. Simplified Chinese is the assumed Chinese edition; a Traditional Chinese edition is outside this change.

### Use three dynamic metrics in the requested visual order

Follow the user-provided reference: project title, brief project description, one compact badge paragraph, and the existing application screenshot. Place language navigation, the existing naming explanation, and the caching note after the screenshot. Do not add a statistics heading or explanatory metric list. Use linked images with descriptive alternative text and consistent badge styling:

| Metric | Image URL | Link destination under `https://github.com/malonzhao/WebOTP` |
| --- | --- | --- |
| Stars | `https://img.shields.io/github/stars/malonzhao/WebOTP` | `/stargazers` |
| Forks | `https://img.shields.io/github/forks/malonzhao/WebOTP` | `/forks` |
| Open Issues | `https://img.shields.io/github/issues/malonzhao/WebOTP` | `/issues` |

The three badges identify stars, forks, and currently open issues through their labels and localized alternative text. Keep the caching note below the screenshot. Do not hard-code counts or imply real-time guarantees. Linked alternative text remains available if images cannot load. Static counts would become stale; automated badge generation would add unnecessary maintenance.

### Translate the entire document while preserving executable content

Match section order and information across languages, including all migration warnings, backup and rollback steps, environment explanations, and contribution instructions. Preserve project/package names, URLs, commands, placeholders, configuration keys and values, ports, versions, and file paths. Comments may be translated. Translate the English statistics additions into Chinese as well. Add a short localized contributor note to update both editions together.

The existing README has a Node.js v22+ prerequisite while package.json permits >=20, and a JWT expiration comment mentioning 3600s next to 1800s. These are pre-existing discrepancies: preserve their literal content and do not silently resolve them through translation. Any correction should be separately agreed and made consistently in both editions.

## Risks / Trade-offs

- External images may be cached or unavailable → use descriptive alt text and clickable GitHub links; verify responses during implementation and report unavailable services accurately.
- Translations can drift → preserve matching sections and add the paired-update contributor note; review technical literals separately from prose.
- Long migration instructions can be accidentally shortened → compare every migration step and warning against the English source.

## Migration Plan

Publish the two Markdown files together through the normal repository change process. No application deployment or data migration is needed. Rollback consists of reverting the README edits and removing the Chinese edition together, avoiding dangling language links.
