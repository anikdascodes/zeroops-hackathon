import { registerRoot, Composition } from 'remotion';
import LessonComposition, { TITLE_FRAMES, EXIT_FRAMES } from './LessonComposition';
import type { LessonScene } from '@/types/lesson';

registerRoot(() => {
  return (
    <Composition
      id="Lesson"
      component={LessonComposition}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={Math.max(90, TITLE_FRAMES + 30 * (EXIT_FRAMES + 120))}
      defaultProps={{ scenes: [] as LessonScene[], lessonTitle: '', slug: '' }}
      calculateMetadata={({ props }) => {
        const scenes = props.scenes ?? [];
        const duration = TITLE_FRAMES + scenes.reduce((acc, s) => acc + (s.durationInFrames || 120) + EXIT_FRAMES, 0);
        return { durationInFrames: Math.max(90, duration), props };
      }}
    />
  );
});
