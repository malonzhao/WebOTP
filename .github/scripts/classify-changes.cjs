const fs = require('node:fs');
const cp = require('node:child_process');

function classify(files, branch = '', release = false) {
  const prefix = branch.split('/')[0];
  const known = ['docs', 'ci', 'feat', 'fix', 'refactor', 'build', 'deps', 'chore'];
  const isDoc = f => /\.md$/.test(f) || (f.startsWith('docs/') && /\.(txt|png|jpg|jpeg|gif|svg|webp|pdf)$/.test(f));
  const docs = files.some(isDoc);
  const workflows = files.some(f => f.startsWith('.github/'));
  const runtime = files.some(f => !(isDoc(f) || f.startsWith('.github/')));
  const image = release || ['build', 'deps'].includes(prefix) || files.some(f =>
    f.startsWith('docker/') || f === '.dockerignore' || /(^|\/)(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc)$/.test(f));
  const full = release || runtime || image || ['feat', 'fix', 'refactor'].includes(prefix) ||
    (branch !== 'main' && !known.includes(prefix));
  return { full, docs, workflows: workflows || image, image };
}

if (require.main === module) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const pr = event.pull_request;
  const base = pr?.base.sha || event.before;
  const head = pr?.head.sha || event.after;
  let result;
  try {
    if (!base || /^0+$/.test(base) || !head) throw Error('No reliable comparison');
    const files = cp.execFileSync('git', ['diff', '--name-only', '-z', '--no-renames', pr ? `${base}...${head}` : base, ...(pr ? [] : [head])], {encoding:'utf8'}).split('\0').filter(Boolean);
    result = classify(files, pr?.head.ref || 'main');
  } catch {
    result = {full:true, docs:true, workflows:true, image:true};
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([k,v])=>`${k}=${v}\n`).join(''));
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### CI scope\n\n${Object.entries(result).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n`);
}
module.exports = { classify };
