// Pre-commit gate: no commit unless the code works locally.
// Docs-only commits skip the checks. Everything else runs `npm run verify` (unit tests, build, e2e).
import { spawnSync } from 'node:child_process';

const staged = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], { encoding: 'utf8' })
  .stdout.split('\n')
  .map((file) => file.trim())
  .filter(Boolean);

const docsOnly = staged.length > 0 && staged.every((file) => /\.md$/i.test(file));
if (docsOnly) {
  console.log('pre-commit: documentation-only change, skipping checks.');
  process.exit(0);
}

console.log('pre-commit: running npm run verify (unit tests, build, end-to-end)...');
const result = spawnSync('npm', ['run', 'verify'], { stdio: 'inherit', shell: process.platform === 'win32' });

if (result.status !== 0) {
  console.error('\npre-commit: checks failed. Fix the problem and commit again.');
  process.exit(1);
}
