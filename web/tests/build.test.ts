import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const webDir = path.resolve(__dirname, '..');
const distDir = path.resolve(webDir, '..', 'dist');

describe('build pipeline (npm run build)', () => {
  beforeAll(() => {
    execSync('npm run build', { cwd: webDir, stdio: 'pipe' });
  }, 300_000);

  it('produces a deployable dist/ folder', () => {
    for (const f of ['server.js', 'package.json', 'migrate.cjs', 'daily.cjs']) {
      expect(fs.existsSync(path.join(distDir, f)), `missing ${f}`).toBe(true);
    }
    expect(fs.existsSync(path.join(distDir, 'node_modules'))).toBe(true);
  });

  it('ships the Next.js build under a non-hidden build/ dir (no .next)', () => {
    expect(fs.existsSync(path.join(distDir, 'build', 'BUILD_ID'))).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'build', 'server'))).toBe(true);
    expect(fs.existsSync(path.join(distDir, '.next'))).toBe(false);
  });

  it('bundles the migration script so pg is self-contained', () => {
    const size = fs.statSync(path.join(distDir, 'migrate.cjs')).size;
    expect(size).toBeGreaterThan(50_000);
  });

  it('references ./build as distDir in the standalone server', () => {
    const server = fs.readFileSync(path.join(distDir, 'server.js'), 'utf8');
    expect(server).toContain('"./build"');
  });
});