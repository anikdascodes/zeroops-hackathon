const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const esbuild = require('esbuild');

const webDir = path.join(__dirname, '..');
const outDir = path.join(webDir, 'public', 'videos');
const audioDir = path.join(webDir, 'public', 'audio');

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';

/**
 * Generate TTS narration for a scene via Groq Orpheus, with retry on rate limit.
 */
async function generateSceneAudio(text, sceneIndex, lessonId, retries = 3) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const narrationText = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '').trim();
  if (!narrationText) return null;

  const hash = crypto
    .createHash('sha256')
    .update(`${lessonId}:${sceneIndex}:${narrationText}`)
    .digest('hex')
    .slice(0, 16);
  const filename = `${hash}.wav`;
  const filePath = path.join(audioDir, filename);

  if (fs.existsSync(filePath)) return `/audio/${filename}`; // public-relative URL for staticFile

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(GROQ_TTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'canopylabs/orpheus-v1-english',
          voice: 'autumn',
          input: narrationText,
          response_format: 'wav',
        }),
      });
      if (res.status === 429) {
        const wait = 2000 * (attempt + 1);
        console.error(`  TTS rate limited scene ${sceneIndex}, retrying in ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        console.error(`  TTS error scene ${sceneIndex}: ${res.status}`);
        return null;
      }
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buf);
      return `/audio/${filename}`;
    } catch (e) {
      console.error(`  TTS fetch error scene ${sceneIndex}:`, e.message);
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

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

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Phase 1: Generate ALL TTS narration first (serialized to avoid rate limits)
  console.log('render-videos: === Phase 1: generating narration ===');
  const narratedLessons = [];
  for (const lesson of lessons) {
    const outFile = path.join(outDir, `${lesson.slug}.mp4`);
    if (fs.existsSync(outFile)) {
      console.log(`render-videos: ${lesson.slug}.mp4 already exists, skipping`);
      narratedLessons.push(null);
      continue;
    }
    console.log(`render-videos: narrating ${lesson.slug}...`);
    const audioPaths = [];
    for (let i = 0; i < lesson.scenes.length; i++) {
      const p = await generateSceneAudio(lesson.scenes[i].text, i, lesson.slug);
      audioPaths.push(p);
    }
    const narratedScenes = lesson.scenes.map((s, i) => ({
      ...s,
      audioUrl: audioPaths[i] || undefined,
    }));
    const count = audioPaths.filter(Boolean).length;
    console.log(`  TTS: ${count}/${lesson.scenes.length} scenes narrated`);
    narratedLessons.push({ lesson, narratedScenes });
    await new Promise((r) => setTimeout(r, 500));
  }

  // Phase 2: Bundle composition (audio files now exist in public/ for the bundler)
  console.log('render-videos: === Phase 2: bundling composition ===');
  const entryPoint = path.join(webDir, 'src', 'remotion', 'Root.tsx');
  const serveUrl = await bundle({
    entryPoint,
    publicDir: path.join(webDir, 'public'),
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...(config.resolve.alias || {}), '@': path.join(webDir, 'src') };
      return config;
    },
  });

  // Phase 3: Render each lesson to MP4
  console.log('render-videos: === Phase 3: rendering videos ===');
  for (const entry of narratedLessons) {
    if (!entry) continue;
    const { lesson, narratedScenes } = entry;
    const outFile = path.join(outDir, `${lesson.slug}.mp4`);
    const inputProps = { scenes: narratedScenes, lessonTitle: lesson.title, slug: lesson.slug };
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
        publicDir: path.join(webDir, 'public'),
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
