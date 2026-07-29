import Link from 'next/link';

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string | null;
    instructor: string;
    category: string;
    difficulty: string;
    status: string;
    lesson_count: number;
    enrollment_count: number;
    created_at: string;
  };
  onDelete: (id: number) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-red-500/10 text-red-500',
};

export default function CourseCard({ course, onDelete }: CourseCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
              <h3 className="text-lg font-semibold text-foreground truncate">{course.title}</h3>
            </Link>
            {course.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
            )}
          </div>
          <div className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[course.difficulty] || 'bg-gray-500/10 text-gray-500'}`}>
            {course.difficulty}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {course.instructor}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {course.lesson_count} lessons
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {course.enrollment_count} enrolled
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Link href={`/courses/${course.id}`}>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
              View Course
            </button>
          </Link>
          <button
            onClick={() => onDelete(course.id)}
            className="text-sm text-muted-foreground hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
