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

console.log('Preparing dist/ for deploy...');
rmRecursive(distDir);
copyRecursive(standaloneDir, distDir);

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