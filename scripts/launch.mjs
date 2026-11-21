/**
 * Egykattintásos indító – a start.bat / start.command / start.sh hívja.
 *
 * Lépések:
 *  1. Node.js verzió ellenőrzése (>= 22.13, a beépített node:sqlite miatt)
 *  2. Függőségek telepítése, ha még nincsenek meg vagy elavultak (npm install)
 *  3. Frontend build (vite build)
 *  4. Szerver indítása (egyetlen porton: frontend + API)
 *  5. Böngésző megnyitása
 *
 * Szándékosan csak Node.js beépített moduljait használja, mert a 2. lépés előtt
 * még nincs node_modules mappa.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const MIN_NODE = [22, 13];

const log = (msg) => console.log(`\x1b[32m▶\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\n\x1b[31m✖ ${msg}\x1b[0m\n`);
  process.exit(1);
};

// 1. Node.js verzió
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
  fail(
    `A program Node.js ${MIN_NODE.join('.')} vagy újabb verziót igényel (jelenleg: ${process.versions.node}).\n` +
      '  Töltsd le a legfrissebb LTS verziót: https://nodejs.org/',
  );
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port);
  });
}

async function isOurAppRunning(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok && (await res.json()).status === 'ok';
  } catch {
    return false;
  }
}

/** Alapértelmezett böngésző megnyitása (NO_BROWSER=1 környezeti változóval kikapcsolható). */
function openBrowser(url) {
  if (process.env.NO_BROWSER) return;
  const [cmd, args] = isWindows
    ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}

// Ha a program már fut (pl. másodszor kattintottak az indítóra), csak megnyitjuk.
let port = Number(process.env.PORT ?? 3001);
if (await isOurAppRunning(port)) {
  log(`Az alkalmazás már fut: http://localhost:${port} – megnyitás a böngészőben.`);
  openBrowser(`http://localhost:${port}`);
  process.exit(0);
}

// 2. Függőségek
function needsInstall() {
  const marker = path.join(ROOT, 'node_modules', '.package-lock.json');
  if (!fs.existsSync(marker)) return true;
  // Ha a package-lock.json frissebb (pl. git pull után), újratelepítünk.
  return fs.statSync(path.join(ROOT, 'package-lock.json')).mtimeMs > fs.statSync(marker).mtimeMs;
}

if (needsInstall()) {
  log('Függőségek telepítése (csak az első indításkor, 1-2 perc)…');
  const npm = spawnSync(isWindows ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: isWindows, // Windowson az npm.cmd csak shellen keresztül indítható
  });
  if (npm.status !== 0) fail('Az npm install nem sikerült. Ellenőrizd az internetkapcsolatot, majd próbáld újra.');
}

// 3. Frontend build
log('Felület előkészítése…');
const build = spawnSync(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--logLevel', 'warn'], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (build.status !== 0) fail('A felület buildje nem sikerült.');

// 4. Szabad port keresése (ha a 3001 foglalt, a következőt próbáljuk)
while (!(await isPortFree(port))) port += 1;

// 5. Szerver indítása, majd böngésző megnyitása
log('Szerver indítása…');
const server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'server/src/index.ts'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});
server.on('exit', (code) => process.exit(code ?? 0));

const url = `http://localhost:${port}`;
for (let i = 0; i < 60; i++) {
  if (await isOurAppRunning(port)) {
    console.log(`\n  \x1b[1m✅ A Digitális receptkönyv fut: \x1b[36m${url}\x1b[0m`);
    console.log('  A leállításhoz zárd be ezt az ablakot, vagy nyomd meg a Ctrl+C billentyűket.\n');
    openBrowser(url);
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
