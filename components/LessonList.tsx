import Link from 'next/link';

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  duration: number | null;
  sort_order: number;
}

interface LessonListProps {
  lessons: Lesson[];
  currentLessonId?: number;
  completedLessons: number[];
}

export default function LessonList({ lessons, currentLessonId, completedLessons }: LessonListProps) {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Course Content</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{lessons.length} lessons</p>
      </div>
      <div className="divide-y divide-border">
        {lessons.map((lesson, idx) => {
          const isActive = lesson.id === currentLessonId;
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className={`flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'hover:bg-accent/50 text-foreground border-l-2 border-transparent'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-medium flex-shrink-0 ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{lesson.title}</p>
                {lesson.duration && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
