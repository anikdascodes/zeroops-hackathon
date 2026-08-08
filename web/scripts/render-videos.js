const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require('esbuild');

const webDir = path.join(__dirname, '..');
const outDir = path.join(webDir, 'public', 'videos');

// Load curated lessons from the TS content module by bundling it to CJS first
// (it's plain data + type imports, so this is cheap and has no runtime deps).
async function loadLessons() {
  const result = await esbuild.build({
    entryPoints: [path.join(webDir, 'src', 'content', 'lessons.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
    define: {},
  });
  const code = result.outputFiles[0].text;
  const tmp = path.join(os.tmpdir(), `zerops-lessons-${Date.now()}.cjs`);
  fs.writeFileSync(tmp, code);
  try {
    return require(tmp).curatedLessons;
  } finally {
    fs.unlinkSync(tmp);
  }
}

async function renderAll() {
  const { bundle } = require('@remotion/bundler');
  const { renderMedia, selectComposition, ensureBrowser } = require('@remotion/renderer');

  const lessons = await loadLessons();
  if (!Array.isArray(lessons) || lessons.length === 0) {
    console.warn('render-videos: no lessons found, skipping render');
    return;
  }

  // First render needs a browser binary; ensure it is downloaded/available.
  try {
    await ensureBrowser();
  } catch (e) {
    console.error('render-videos: could not ensure browser:', e.message);
  }

  const entryPoint = path.join(webDir, 'src', 'remotion', 'Root.tsx');
  console.log('render-videos: bundling composition...');
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...(config.resolve.alias || {}), '@': path.join(webDir, 'src') };
      return config;
    },
  });

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const lesson of lessons) {
    const outFile = path.join(outDir, `${lesson.slug}.mp4`);
    if (fs.existsSync(outFile)) {
      console.log(`render-videos: ${lesson.slug}.mp4 already exists, skipping`);
      continue;
    }
    const inputProps = { scenes: lesson.scenes, lessonTitle: lesson.title, slug: lesson.slug };
    console.log(`render-videos: rendering ${lesson.slug} (${lesson.scenes.length} scenes)...`);
    try {
      const composition = await selectComposition({
        serveUrl,
        id: 'Lesson',
        inputProps,
      });
      await renderMedia({
        composition,
        serveUrl,
        codec: 'h264',
        outputLocation: outFile,
        inputProps,
        overwrite: true,
      });
      console.log(`render-videos: done ${lesson.slug}`);
    } catch (e) {
      console.error(`render-videos: FAILED ${lesson.slug}:`, e && e.message);
    }
  }
  console.log('render-videos: complete');
}

renderAll().catch((e) => {
  console.error('render-videos: fatal', e);
  process.exit(1);
});
