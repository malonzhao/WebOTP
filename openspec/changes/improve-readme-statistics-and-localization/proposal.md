## Why

The English-only README does not give readers a quick view of repository interest and activity, and Chinese-speaking users must read deployment and migration instructions in English. Adding repository statistics and a complete Simplified Chinese edition will improve discovery and accessibility.

## What Changes

- Keep `README.md` as the English entry point and add a complete `README.zh-CN.md` translation, including deployment, migration, development, testing, contribution, and license sections.
- Add prominent reciprocal relative links labeled `English` and `简体中文` immediately after the application screenshot in both files.
- Arrange both introductions as project name, brief description, a compact row of dynamic Stars/Forks/open Issues badges, then the existing application screenshot, following the user-provided reference. Link badges to the relevant `malonzhao/WebOTP` GitHub pages; omit a separate statistics heading and metric list.
- Preserve technical meaning, commands, identifiers, configuration values, migration precautions, and existing local asset links across editions. Translate explanatory prose and code comments without changing executable content.

## Capabilities

### New Capabilities

None. This is a documentation-only change; `.openspec.yaml` sets `skip_specs: true`.

### Modified Capabilities

None. Application behavior and existing functional requirements are unchanged.

## Impact

- Implementation affects only `README.md` and the new `README.zh-CN.md`.
- README rendering will request public images from Shields.io; no runtime dependency, API token, workflow, or generated statistics file is needed.
- Validation covers translation completeness, technical literal parity, relative links, badge destinations, and Markdown rendering. Application tests are not required for these Markdown-only edits.
