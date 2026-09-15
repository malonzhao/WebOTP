## 1. Repository Statistics

- [x] 1.1 Add the English repository statistics section with Stars, Forks, and open Issues linked Shields.io badges using the URLs in design.md; verify all three reference `malonzhao/WebOTP`, have descriptive alt text, and link to the corresponding GitHub pages.
- [x] 1.2 Arrange both introductions as project name, brief description, compact badge row, then application screenshot; keep the naming explanation and caching note below the screenshot. Verify the requested order and absence of hard-coded counts.

## 2. Chinese Edition and Language Navigation

- [x] 2.1 Create the complete `README.zh-CN.md` translation from the updated English README; verify section-by-section coverage including statistics, Docker migration precautions, backup/rollback steps, development, testing, contribution, and license.
- [x] 2.2 Add reciprocal `English` / `简体中文` relative links immediately after both application screenshots and a localized contributor note to update both editions together; verify each link resolves to the intended root file.
- [x] 2.3 Compare both editions for matching commands, identifiers, URLs, environment keys and values, versions, ports, and file paths, allowing translated comments; verify no executable content or migration instruction was altered or omitted.

## 3. Documentation Verification

- [x] 3.1 Preview both Markdown documents at desktop and narrow widths; verify language links, statistics, code fences, lists, shared screenshot, and license link render correctly. Check the three badge image responses and GitHub destinations, recording any network/provider limitation without claiming a pass.
- [x] 3.2 Run `git diff --check` and inspect the final diff and new Chinese file; verify implementation changes are limited to the two README files, with only this change's OpenSpec tracking updates alongside them. Record documentation checks; no application test run is required.

## Validation Notes

- Final English and Chinese introductions follow the requested title, description, three badges, screenshot order. Both were previewed at 1280px and 390px using a local Markdown renderer; this is not a published GitHub rendering check.
- Browser loaded all three Shields.io badges and the existing screenshot. Reciprocal language links worked. Code blocks, lists, and license link were inspected.
- Earlier HTTP checks returned 403 for Shields.io and 404 for the GitHub stargazers page, while forks and issues returned 200. These command-line access limitations remain recorded; browser badge loading succeeded.
- Executable fenced content, inline technical literals, heading structure, and local link targets match between editions.
- `git diff --check` and strict OpenSpec validation passed. No application tests, commits, pushes, or archive operation were performed.
