'use client';

import { Player } from '@remotion/player';
import dynamic from 'next/dynamic';
import { LessonScene } from '@/types/lesson';
import { TITLE_FRAMES, EXIT_FRAMES } from './LessonComposition';

const LessonComposition = dynamic(() => import('./LessonComposition'), { ssr: false });

export default function LessonPlayer({
  scenes,
  lessonTitle,
  slug,
  videoUrl,
}: {
  scenes: LessonScene[];
  lessonTitle?: string;
  slug?: string;
  videoUrl?: string;
}) {
  // Curated lessons ship a pre-rendered, high-quality MP4 (rendered with Remotion
  // at build time). Play it with a native <video> for instant, frameless playback.
  if (videoUrl) {
    return (
      <div className="border border-ash bg-ink overflow-hidden">
        <video
          className="w-full aspect-video object-contain"
          src={videoUrl}
          controls
          playsInline
          autoPlay
          loop
        />
      </div>
    );
  }

  // On-the-fly LLM lessons reuse the same composition rendered live in the browser.
  const durationInFrames =
    TITLE_FRAMES + scenes.reduce((acc, s) => acc + s.durationInFrames + EXIT_FRAMES, 0) || 90;

  return (
    <div className="border border-ash bg-ink overflow-hidden">
      <Player
        component={LessonComposition as any}
        inputProps={{ scenes, lessonTitle, slug }}
        durationInFrames={durationInFrames}
        compositionWidth={1280}
        compositionHeight={720}
        fps={30}
        controls
        style={{ width: '100%', aspectRatio: '16/9' }}
        autoPlay
        loop
      />
    </div>
  );
}