'use client';

import { Player } from '@remotion/player';
import dynamic from 'next/dynamic';
import { LessonScene } from '@/types/lesson';

const LessonComposition = dynamic(() => import('./LessonComposition'), { ssr: false });

const TITLE_FRAMES = 60;
const EXIT_FRAMES = 12;

export default function LessonPlayer({ scenes, lessonTitle }: { scenes: LessonScene[]; lessonTitle?: string }) {
  const durationInFrames =
    TITLE_FRAMES + scenes.reduce((acc, s) => acc + s.durationInFrames + EXIT_FRAMES, 0) || 90;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 shadow-2xl shadow-purple-500/10">
      <Player
        component={LessonComposition as any}
        inputProps={{ scenes, lessonTitle }}
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