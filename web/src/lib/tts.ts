import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '@/db';
import { audioAssets } from '@/db/schema';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const TTS_MODEL = 'canopylabs/orpheus-v1-english';
const TTS_VOICE = 'autumn';

/**
 * Generate narration audio for a single scene's text via Groq TTS.
 * Returns a public URL path (e.g. /api/audio/<hash>.wav) that the browser
 * and Remotion fetch at runtime.
 *
 * Bytes are stored in the Postgres audio_assets table so generated audio
 * survives container restarts and is reachable from any replica. A local
 * public/audio copy is kept only as a dev-time cache.
 */
export async function generateSceneAudio(
  text: string,
  sceneIndex: number,
  lessonId: string
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  // Clean text for narration — strip code blocks, keep it conversational
  const narrationText = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '').trim();
  if (!narrationText) return null;

  const hash = crypto
    .createHash('sha256')
    .update(`${lessonId}:${sceneIndex}:${narrationText}`)
    .digest('hex')
    .slice(0, 16);
  const filename = `${hash}.wav`;
  const publicUrl = `/api/audio/${filename}`;

  // Already in the DB? Skip the API call.
  try {
    const existing = await db.query.audioAssets.findFirst({
      where: (row, { eq }) => eq(row.id, hash),
    });
    if (existing) return publicUrl;
  } catch {
    // DB unavailable — fall through to generating again.
  }

  try {
    const res = await fetch(GROQ_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input: narrationText,
        response_format: 'wav',
      }),
    });

    if (!res.ok) {
      console.error('TTS error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Persist to Postgres (base64 text column) so any container replica can serve it.
    try {
      await db
        .insert(audioAssets)
        .values({ id: hash, data: buffer.toString('base64') })
        .onConflictDoNothing();
    } catch (e) {
      console.error('TTS DB store error:', e);
    }

    // Dev-time cache so local next dev / tests can read it from disk.
    try {
      const publicDir = path.join(process.cwd(), 'public', 'audio');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.join(publicDir, filename), buffer);
    } catch {
      // Non-fatal — the DB row is the source of truth.
    }

    return publicUrl;
  } catch (e) {
    console.error('TTS fetch error:', e);
    return null;
  }
}

/**
 * Generate narration for all scenes in parallel.
 * Returns the same scenes array with audioUrl populated where TTS succeeded.
 */
export async function narrateScenes<T extends { text: string }>(
  scenes: T[],
  lessonId: string
): Promise<(T & { audioUrl?: string })[]> {
  const results = await Promise.all(
    scenes.map((scene, i) => generateSceneAudio(scene.text, i, lessonId))
  );
  return scenes.map((scene, i) => ({
    ...scene,
    audioUrl: results[i] ?? undefined,
  }));
}