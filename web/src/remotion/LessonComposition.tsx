import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
} from 'remotion';
import type { LessonScene } from '@/types/lesson';

export const TITLE_FRAMES = 70;
export const EXIT_FRAMES = 16;

/* ---------------------------------- helpers --------------------------------- */

function useBgParticles(count: number, width: number, height: number) {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 7.13;
    return {
      x: (((seed * 97) % 1000) / 1000) * width,
      y: (((seed * 53) % 1000) / 1000) * height,
      r: 0.8 + (((seed * 31) % 100) / 100) * 3,
      drift: (seed % 2 === 0 ? 1 : -1) * (0.4 + ((seed * 7) % 5) / 8),
    };
  });
}

function useAmbientHues(slug: string) {
  const map: Record<string, [number, number]> = {
    'first-deploy': [222, 280],
    'zerops-yml-anatomy': [210, 260],
    'env-variables-wiring': [200, 320],
    'valkey-cache': [260, 320],
    'cron': [320, 260],
    'cron-jobs': [320, 260],
    'safe-deploys': [150, 210],
    'networking': [190, 280],
    'scaling': [260, 200],
  };
  return map[slug] ?? [225, 285];
}

function buildIcon(type: string, frame: number, fps: number, accent: string) {
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const o = interpolate(enter, [0, 1], [0, 1]);
  const s = interpolate(enter, [0, 1], [0.55, 1]);
  const rot = interpolate(enter, [0, 1], [-10, 0]);
  const stroke = { stroke: accent, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const g = { opacity: o, transform: `translate(44 54) scale(${s}) rotate(${rot})`, transformOrigin: '44px 54px' };

  switch (type) {
    case 'rocket':
      return (
        <g {...g}>
          <ellipse cx="44" cy="76" rx="30" ry="12" {...stroke} opacity="0.5" />
          <path d="M16 74 C20 60 30 52 44 46 C58 52 68 60 72 74 Z" fill={accent} opacity="0.18" />
          <path d="M30 68 C52 58 58 62 44 76 C32 68 30 64 30 68 Z" fill="rgba(255,255,255,0.3)" />
          <circle cx="36" cy="50" r="5" fill={accent} />
          <path d="M34 76 l20 -8" stroke={accent} strokeWidth="3" opacity="0.6" />
        </g>
      );
    case 'config':
      return (
        <g {...g}>
          <rect x="18" y="52" width="52" height="42" rx="7" {...stroke} />
          <rect x="26" y="62" width="18" height="12" rx="3" fill={accent} opacity="0.5" />
          <rect x="48" y="62" width="14" height="12" rx="3" fill={accent} opacity="0.3" />
          <circle cx="66" cy="34" r="9" {...stroke} />
          <line x1="66" y1="18" x2="66" y2="12" {...stroke} />
          <line x1="66" y1="50" x2="66" y2="56" {...stroke} />
          <circle cx="66" cy="34" r="3" fill={accent} />
        </g>
      );
    case 'db':
      return (
        <g {...g}>
          <ellipse cx="44" cy="58" rx="32" ry="11" fill={accent} opacity="0.12" />
          <path d="M12 58 V74 C12 80 26 86 44 86 C62 86 76 80 76 74 V58" {...stroke} />
          <path d="M12 58 C12 64 26 70 44 70 C62 70 76 64 76 58" fill={accent} opacity="0.15" />
          <ellipse cx="44" cy="42" rx="32" ry="11" {...stroke} />
          <path d="M12 42 V58 C12 64 26 70 44 70 C62 70 76 64 76 58 V42" {...stroke} opacity="0.7" />
        </g>
      );
    case 'bolt':
      return (
        <g {...g}>
          <path d="M46 14 L26 54 H40 L34 84 L62 40 H48 Z" {...stroke} fill={accent} opacity="0.12" />
        </g>
      );
    case 'clock':
      return (
        <g {...g}>
          <circle cx="44" cy="56" r="32" {...stroke} />
          <path d="M44 34 V56 L58 64" {...stroke} transform={`rotate(${interpolate(frame, [0, 90], [0, 400])} 44 56)`} />
          <circle cx="44" cy="56" r="3" fill={accent} />
        </g>
      );
    case 'shield':
      return (
        <g {...g}>
          <path d="M44 16 L70 30 V50 C70 68 58 82 44 88 C30 82 18 68 18 50 V30 Z" {...stroke} fill={accent} opacity="0.08" />
          <path d="M32 50 L40 58 L56 42" {...stroke} strokeWidth="5" />
        </g>
      );
    case 'network':
      return (
        <g {...g}>
          <circle cx="26" cy="56" r="11" {...stroke} />
          <circle cx="62" cy="36" r="11" {...stroke} />
          <circle cx="62" cy="76" r="11" {...stroke} />
          <circle cx="62" cy="56" r="11" {...stroke} fill={accent} opacity="0.15" />
          <line x1="37" y1="52" x2="51" y2="41" {...stroke} strokeWidth="3" />
          <line x1="37" y1="60" x2="51" y2="71" {...stroke} strokeWidth="3" />
        </g>
      );
    case 'scale':
      return (
        <g {...g}>
          <line x1="14" y1="24" x2="74" y2="24" {...stroke} />
          <path d="M44 24 V86 M20 24 C14 34 14 42 20 50 M68 24 C74 34 74 42 68 50" {...stroke} />
          <line x1="32" y1="50" x2="20" y2="50" {...stroke} strokeWidth="6" strokeLinecap="round" />
          <line x1="56" y1="50" x2="68" y2="50" {...stroke} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g {...g}>
          <rect x="16" y="34" width="56" height="44" rx="7" {...stroke} />
          <circle cx="32" cy="40" r="4" fill={accent} />
          <circle cx="48" cy="40" r="4" fill="rgba(255,255,255,0.4)" />
          <circle cx="64" cy="40" r="4" fill="rgba(255,255,255,0.4)" />
          <circle cx="32" cy="68" r="4" fill="rgba(255,255,255,0.4)" />
          <circle cx="48" cy="68" r="4" fill={accent} />
          <circle cx="64" cy="68" r="4" fill="rgba(255,255,255,0.4)" />
        </g>
      );
  }
}

function SceneIcon({ type, frame, fps, accent }: { type: string; frame: number; fps: number; accent: string }) {
  return (
    <svg
      width={150}
      height={130}
      viewBox="0 0 88 108"
      style={{ filter: `drop-shadow(0 12px 32px ${accent}55)`, flexShrink: 0 }}
    >
      {buildIcon(type, frame, fps, accent)}
    </svg>
  );
}

function sceneIconType(slug: string, i: number): string {
  const map: Record<string, string> = {
    'first-deploy': 'rocket',
    'zerops-yml-anatomy': 'config',
    'env-variables-wiring': 'db',
    'valkey-cache': 'bolt',
    'cron': 'clock',
    'cron-jobs': 'clock',
    'safe-deploys': 'shield',
    'networking': 'network',
    'scaling': 'scale',
  };
  if (map[slug]) return map[slug];
  return ['rocket', 'config', 'db', 'bolt', 'clock', 'network', 'scale', 'shield'][i % 8];
}

/* ------------------------- title reveal / word typewriter ------------------------- */

function RevealTitle({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <h1 className="text-6xl font-bold tracking-tight leading-tight">
      {text.split('').map((c, i) => {
        const s = spring({ frame: frame - delay - i * 1.4, fps, config: { damping: 200, stiffness: 220 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) rotate(${interpolate(s, [0, 1], [8, 0])}deg)`,
              backgroundImage: 'linear-gradient(90deg,#60a5fa,#c084fc,#f0abfc)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {c === ' ' ? '\u00A0' : c}
          </span>
        );
      })}
    </h1>
  );
}

function WordReveal({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  const visible = Math.floor(interpolate(frame, [delay, delay + Math.max(16, words.length * 5)], [0, words.length], { extrapolateRight: 'clamp' }));
  return (
    <p className="text-2xl leading-relaxed text-zinc-200">
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * 5, fps, config: { damping: 18 } });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: 7, opacity: i < visible ? interpolate(s, [0, 1], [0, 1]) : 0 }}>
            {w}
          </span>
        );
      })}
    </p>
  );
}

function CodeTyper({ code, delay, accent }: { code: string; delay: number; accent: string }) {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  const typed = Math.floor(interpolate(frame, [delay, delay + code.length * 2.6], [0, code.length], { extrapolateRight: 'clamp' }));
  let consumed = 0;
  return (
    <pre
      className="font-mono text-[15px] leading-6 bg-black/50 border rounded-2xl px-6 py-5 overflow-hidden w-full"
      style={{ borderColor: `${accent}44`, boxShadow: `0 24px 70px -24px ${accent}66` }}
    >
      <div className="flex gap-6">
        <div className="shrink-0 text-zinc-600 select-none">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="whitespace-pre text-green-300">
          {lines.map((l, i) => {
            const len = l.length + 1;
            const start = consumed;
            consumed += len;
            const localTyped = Math.max(0, Math.min(l.length, typed - start));
            const fullyTyped = typed >= start + len;
            return (
              <div key={i} className="flex items-center">
                <span style={{ opacity: localTyped > 0 || fullyTyped ? 1 : 0.25 }}>{l.slice(0, localTyped)}</span>
                {i === lines.length - 1 && !fullyTyped && localTyped > 0 && (
                  <span className="w-[8px] h-[18px] bg-green-300" style={{ marginLeft: 2, animation: 'blink 1s steps(1) infinite' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </pre>
  );
}

/* ---------------------------------- composition ---------------------------------- */

export default function LessonComposition({
  scenes,
  lessonTitle,
  slug = '',
}: {
  scenes: LessonScene[];
  lessonTitle?: string;
  slug?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [hueA, hueB] = useAmbientHues(slug);
  const accent = `hsl(${hueA} 90% 66%)`;
  const particles = useBgParticles(40, width, height);

  // scene timing
  const sceneStarts: number[] = [];
  let t = TITLE_FRAMES;
  for (const s of scenes) {
    sceneStarts.push(t);
    t += s.durationInFrames + EXIT_FRAMES;
  }
  const total = t;

  // title screen
  if (frame < TITLE_FRAMES) {
    const enter = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
    const scale = interpolate(enter, [0, 1], [0.9, 1]);
    const glow = interpolate(frame, [0, 60], [0, 1]);
    return (
      <AbsoluteFill style={{ background: bgGrad(hueA, hueB) }}>
        <ParticlesLayer particles={particles} frame={frame} accent={accent} />
        <div className="absolute inset-0 flex items-center justify-center p-20">
          <div style={{ opacity: interpolate(enter, [0, 1], [0, 1]), transform: `scale(${scale})` }} className="text-center">
            <div className="text-sm tracking-[0.5em] uppercase text-zinc-400 mb-8">Zerops Academy</div>
            <RevealTitle text={lessonTitle ?? 'Lesson'} delay={10} />
            <div
              className="h-[3px] mx-auto mt-10 rounded-full"
              style={{ width: `${interpolate(frame, [30, 62], [0, 260])}px`, background: `linear-gradient(90deg,transparent,${accent},transparent)`, opacity: glow }}
            />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // find current scene
  let current = scenes.length - 1;
  for (let i = 0; i < scenes.length; i++) {
    if (frame < sceneStarts[i] + scenes[i].durationInFrames + EXIT_FRAMES) {
      current = i;
      break;
    }
  }
  const scene = scenes[current];
  const sceneStart = sceneStarts[current];
  const sceneFrame = frame - sceneStart;
  const exitFrom = sceneStart + scene.durationInFrames;
  const exiting = sceneFrame > scene.durationInFrames;
  const enterSlide = spring({ frame: sceneFrame, fps, config: { damping: 15, stiffness: 80 } });
  const exitFade = exiting ? interpolate(frame, [exitFrom, exitFrom + EXIT_FRAMES], [1, 0]) : 1;

  return (
    <AbsoluteFill style={{ background: bgGrad(hueA, hueB) }}>
      <ParticlesLayer particles={particles} frame={frame} accent={accent} />
      <div className="absolute top-10 left-16 right-16 flex items-center justify-between z-10">
        <div className="text-xs tracking-[0.4em] uppercase text-zinc-500">Zerops Academy</div>
        <div className="flex items-center gap-3">
          {scenes.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{
                width: i === current ? 28 : 8,
                background: i <= current ? accent : 'rgba(255,255,255,0.18)',
                transition: 'all 120ms linear',
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0 flex items-center gap-14 px-20"
        style={{
          opacity: exitFade,
          transform: `translateX(${interpolate(enterSlide, [0, 1], [60, 0])}px)`,
        }}
      >
        <SceneIcon type={sceneIconType(slug, current)} frame={sceneFrame} fps={fps} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: accent }}>
            Scene {current + 1} / {scenes.length}
          </div>
          <RevealTitle text={scene.title} delay={6} />
          <div className="mt-6">
            <WordReveal text={scene.text} delay={20} />
          </div>
          {scene.code && (
            <div className="mt-8">
              <CodeTyper code={scene.code} delay={30} accent={accent} />
            </div>
          )}
        </div>
      </div>

      <ProgressBar frame={frame} total={total} accent={accent} />
    </AbsoluteFill>
  );
}

/* ------------------------------ bg + progress ------------------------------ */

function bgGrad(hueA: number, hueB: number) {
  return `linear-gradient(145deg, hsl(${hueA} 42% 8%), hsl(${hueB} 50% 5%), #050208)`;
}

function ParticlesLayer({ particles, frame, accent }: { particles: { x: number; y: number; r: number; drift: number }[]; frame: number; accent: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-60">
      {particles.map((p, i) => {
        const y = (p.y + frame * p.drift * 0.6) % 720;
        const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(frame * 0.02 + i));
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: y,
              width: p.r * 2,
              height: p.r * 2,
              background: accent,
              opacity: twinkle,
              boxShadow: `0 0 ${p.r * 4}px ${accent}`,
            }}
          />
        );
      })}
    </div>
  );
}

function ProgressBar({ frame, total, accent }: { frame: number; total: number; accent: string }) {
  const pct = Math.min(frame / total, 1);
  return (
    <div className="absolute bottom-10 left-16 right-16 z-10">
      <div className="h-[6px] w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg,${accent},#c084fc)` }}
        />
      </div>
    </div>
  );
}
