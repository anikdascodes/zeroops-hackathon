import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from 'remotion';
import { LessonScene } from '@/types/lesson';

const EXIT_FRAMES = 12;

function SceneCard({ scene, progress, frame }: { scene: LessonScene; progress: number; frame: number }) {
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 100 } });
  const y = interpolate(enter, [0, 1], [30, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity }} className="max-w-3xl mx-auto w-full">
      <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
        {scene.title}
      </h1>
      <div className="text-2xl leading-relaxed mb-10 text-zinc-200">
        {scene.text.split('').map((char, i) => (
          <span
            key={i}
            className={i < progress * scene.text.length ? 'opacity-100' : 'opacity-20'}
          >
            {char}
          </span>
        ))}
      </div>
      {scene.code && (
        <pre className="bg-zinc-950/80 border border-blue-500/30 rounded-xl p-6 text-base font-mono overflow-x-auto text-green-400 shadow-lg shadow-blue-500/5">
          {scene.code}
        </pre>
      )}
    </div>
  );
}

export default function LessonComposition({
  scenes,
  lessonTitle,
}: {
  scenes: LessonScene[];
  lessonTitle?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TITLE_FRAMES = 60;
  const sceneStarts: number[] = [];
  let t = TITLE_FRAMES;
  for (const s of scenes) {
    sceneStarts.push(t);
    t += s.durationInFrames + EXIT_FRAMES;
  }
  const total = t;

  if (frame < TITLE_FRAMES) {
    const enter = spring({ frame, fps, config: { damping: 100 } });
    const scale = interpolate(enter, [0, 1], [0.92, 1]);
    const opacity = interpolate(enter, [0, 1], [0, 1]);
    return (
      <AbsoluteFill className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center p-16">
        <div style={{ transform: `scale(${scale})`, opacity }} className="text-center max-w-3xl">
          <div className="text-sm tracking-[0.4em] uppercase text-zinc-500 mb-6">Zerops Academy</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight">
            {lessonTitle ?? 'Lesson'}
          </h1>
        </div>
      </AbsoluteFill>
    );
  }

  let current = scenes.length - 1;
  for (let i = 0; i < scenes.length; i++) {
    if (frame < sceneStarts[i] + scenes[i].durationInFrames + EXIT_FRAMES) {
      current = i;
      break;
    }
  }
  const scene = scenes[current];
  const sceneFrame = frame - sceneStarts[current];
  const progress = Math.min(sceneFrame / scene.durationInFrames, 1);
  const exiting = sceneFrame > scene.durationInFrames;

  if (exiting) return null; // pause between scenes

  return (
    <AbsoluteFill className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-16 flex flex-col justify-center relative">
      <div className="absolute top-8 left-16 right-16 flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] uppercase text-zinc-600">Zerops Academy</span>
        <span className="text-xs text-zinc-600 font-mono">
          {current + 1} / {scenes.length}
        </span>
      </div>
      <SceneCard scene={scene} progress={progress} frame={sceneFrame} />
      <div className="absolute bottom-8 left-16 right-16 flex items-center gap-4">
        <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${(frame / total) * 100}%` }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}