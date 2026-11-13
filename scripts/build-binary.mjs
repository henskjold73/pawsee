// Builds a single-file executable (Node SEA) for the platform this runs on: dist/pawsee[.exe]
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const win = process.platform === 'win32';
const mac = process.platform === 'darwin';
const exe = join('dist', win ? 'pawsee.exe' : 'pawsee');
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');

// SEA wants one CommonJS file; import.meta.url only matters for createRequire, so point it at the executable
await build({
  entryPoints: ['server.mjs'], bundle: true, platform: 'node', format: 'cjs', outfile: 'dist/pawsee.cjs',
  define: { 'import.meta.url': '__importMetaUrl' },
  banner: { js: "const __importMetaUrl = require('node:url').pathToFileURL(process.execPath).href;" },
  logLevel: 'warning',
});

writeFileSync('dist/sea-config.json', JSON.stringify({
  main: 'dist/pawsee.cjs',
  output: 'dist/pawsee.blob',
  disableExperimentalSEAWarning: true,
  assets: {
    'package.json': 'package.json',
    'index.html': 'public/index.html',
    'style.css': 'public/style.css',
    'app.js': 'public/app.js',
    'brands.js': 'public/brands.js',
    'faces.js': 'public/faces.js',
    'faces/cel.js': 'public/faces/cel.js',
    'faces/pixel.js': 'public/faces/pixel.js',
    'faces/robot.js': 'public/faces/robot.js',
    'faces/blobs.js': 'public/faces/blobs.js',
    'faces.html': 'public/faces.html',
    'mood.js': 'public/mood.js',
    'meter.js': 'public/meter.js',
    'history.js': 'public/history.js',
  },
}));
run(process.execPath, ['--experimental-sea-config', 'dist/sea-config.json']);

copyFileSync(process.execPath, exe);
if (!win) chmodSync(exe, 0o755);
if (mac) run('codesign', ['--remove-signature', exe]);
run(process.execPath, [join('node_modules', 'postject', 'dist', 'cli.js'), exe, 'NODE_SEA_BLOB', 'dist/pawsee.blob',
  '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2', ...(mac ? ['--macho-segment-name', 'NODE_SEA'] : [])]);
if (mac) run('codesign', ['--sign', '-', exe]); // ad-hoc, so Apple Silicon will run it

console.log(`built ${exe}`);
