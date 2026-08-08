const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function rmRecursive(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

const projectRoot = path.join(__dirname, '..', '..');
const distDir = path.join(projectRoot, 'dist');
const webDir = path.join(projectRoot, 'web');
const standaloneDir = path.join(webDir, 'build', 'standalone');

console.log('Running next build...');
execSync('next build', { stdio: 'inherit', cwd: webDir });

console.log('Rendering curated lesson videos...');
try {
  execSync('node scripts/render-videos.js', { stdio: 'inherit', cwd: webDir });
} catch (e) {
  // Video rendering is best-effort at build time; if headless Chrome is
  // unavailable the app still works (client player fallback for all lessons).
  console.warn('render-videos failed, continuing without pre-rendered videos:', e.message);
}

console.log('Preparing dist/ for deploy...');
rmRecursive(distDir);
copyRecursive(standaloneDir, distDir);

// Next.js standalone does NOT ship static assets automatically when using a
// custom distDir. Copy build/static into the standalone tree so the server
// can serve JS/CSS chunks (otherwise the page is an unstyled, non-hydrated
// HTML shell). Also copy public/ if present.
copyRecursive(path.join(webDir, 'build', 'static'), path.join(distDir, 'build', 'static'));
if (fs.existsSync(path.join(webDir, 'public'))) {
  copyRecursive(path.join(webDir, 'public'), path.join(distDir, 'public'));
}

for (const [name, file] of [
  ['migrate.cjs', 'migrate.js'],
  ['daily.cjs', 'daily.js'],
]) {
  console.log(`Bundling ${name}...`);
  esbuild.buildSync({
    entryPoints: [path.join(webDir, 'scripts', file)],
    bundle: true,
    platform: 'node',
    target: 'node24',
    outfile: path.join(distDir, name),
    format: 'cjs',
    external: [],
  });
}

console.log('Build complete');