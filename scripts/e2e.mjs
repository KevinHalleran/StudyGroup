// Runs the end-to-end suite against a locally managed stack:
// Azurite (storage) -> Azure Functions host (api) -> Vite dev server (web), then tears everything down.
// Usage: npm run test:e2e   (requires Azure Functions Core Tools `func` on PATH and a built API)
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const isWindows = process.platform === 'win32';
const children = [];

function start(name, command, args) {
  // shell:true lets Windows resolve .cmd shims (npx, func).
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: isWindows });
  child.output = '';
  child.stdout.on('data', (chunk) => (child.output += chunk));
  child.stderr.on('data', (chunk) => (child.output += chunk));
  child.exited = new Promise((resolve) => child.on('exit', (code) => resolve(code)));
  child.label = name;
  children.push(child);
  return child;
}

function stopAll() {
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    if (isWindows) spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
}

async function waitFor(url, child, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${child.label} exited early:\n${child.output}`);
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${child.label} at ${url}:\n${child.output}`);
}

async function main() {
  // Local settings are gitignored; create them from the template so a fresh clone or CI runner works.
  if (!existsSync('api/local.settings.json')) {
    copyFileSync('api/local.settings.example.json', 'api/local.settings.json');
  }
  mkdirSync('.azurite', { recursive: true });

  const build = spawnSync('npm', ['run', 'build', '--workspace', 'api'], { stdio: 'inherit', shell: isWindows });
  if (build.status !== 0) throw new Error('API build failed');

  const azurite = start('azurite', 'npx', [
    'azurite', '--silent', '--location', '.azurite',
    '--blobHost', '127.0.0.1', '--queueHost', '127.0.0.1', '--tableHost', '127.0.0.1',
    '--skipApiVersionCheck'
  ]);
  await waitFor('http://127.0.0.1:10002/', azurite);

  const api = start('functions host', 'func', ['start', '--script-root', 'api', '--port', '7071']);
  await waitFor('http://127.0.0.1:7071/api/health', api);

  const web = start('vite', 'npx', ['vite', 'frontend', '--host', '127.0.0.1', '--port', '5173', '--strictPort']);
  await waitFor('http://127.0.0.1:5173/', web);

  const result = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.e2e.config.js'], {
    stdio: 'inherit',
    shell: isWindows
  });
  return result.status ?? 1;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (error) {
  console.error(error.message);
} finally {
  stopAll();
}
process.exit(exitCode);
