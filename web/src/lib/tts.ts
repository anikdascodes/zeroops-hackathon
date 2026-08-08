import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const TTS_MODEL = 'canopylabs/orpheus-v1-english';
const TTS_VOICE = 'autumn';

/**
 * Generate narration audio for a single scene's text via Groq TTS.
 * Returns a public URL path (e.g. /audio/<hash>.wav) that the browser
 * and Remotion can fetch at runtime.
 *
 * In a serverless/standalone context we write to public/audio/.
 * On Zerops the runtime container has a writable /var/www/dist/public.
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
  const publicDir = path.join(process.cwd(), 'public', 'audio');
  const filePath = path.join(publicDir, filename);
  const publicUrl = `/audio/${filename}`;

  // Already generated? Skip the API call.
  if (fs.existsSync(filePath)) return publicUrl;

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

    const arrayBuffer = await res.arrayBuffer();
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
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
