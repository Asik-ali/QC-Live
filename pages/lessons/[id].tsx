import { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/auth';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import LessonList from '@/components/LessonList';
import { getDb } from '@/lib/database';

interface Lesson {
  id: number; course_id: number; title: string; content: string | null;
  video_url: string | null; duration: number | null; sort_order: number;
}

interface Course {
  id: number; title: string; description: string | null; instructor: string;
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);
  if (!session.user?.isLoggedIn) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  const db = await getDb();
  const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [context.params?.id]);
  if (!lesson) return { notFound: true };
  const course = await db.get('SELECT * FROM courses WHERE id = ?', [lesson.course_id]);
  return { props: { initialLesson: JSON.parse(JSON.stringify(lesson)), course: JSON.parse(JSON.stringify(course)) } };
};

export default function LessonPage({ initialLesson, course }: { initialLesson: Lesson; course: Course }) {
  const router = useRouter();
  const [lesson] = useState<Lesson>(initialLesson);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [showEnrollPrompt, setShowEnrollPrompt] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    fetchLessons();
    checkEnrollment();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await axios.get(`/api/courses/${course.id}/lessons/list`);
      setLessons(res.data.lessons);
    } catch (err) { console.error('Failed to fetch lessons:', err); }
  };

  const checkEnrollment = async () => {
    try {
      const res = await axios.get('/api/enrollments/list');
      const enrolled = res.data.enrollments.filter((e: any) => e.course_id === course.id);
      if (enrolled.length > 0) {
        setEnrollment(enrolled[0]);
        setCompletedLessons(JSON.parse(enrolled[0].completed_lessons || '[]'));
      }
    } catch (err) { console.error('Failed to check enrollment:', err); }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    try {
      const res = await axios.post('/api/enrollments/create', { courseId: course.id, studentName: studentName.trim() });
      await checkEnrollment();
      setShowEnrollPrompt(false);
    } catch (err: any) {
      if (err.response?.data?.error === 'Already enrolled') {
        await checkEnrollment();
        setShowEnrollPrompt(false);
      }
    }
  };

  const toggleComplete = async () => {
    if (!enrollment) { setShowEnrollPrompt(true); return; }
    const isCompleted = completedLessons.includes(lesson.id);
    try {
      await axios.put(`/api/enrollments/${enrollment.id}/progress`, {
        lessonId: lesson.id, completed: !isCompleted,
      });
      if (isCompleted) {
        setCompletedLessons(completedLessons.filter((id) => id !== lesson.id));
      } else {
        setCompletedLessons([...completedLessons, lesson.id]);
      }
    } catch (err) { console.error('Failed to update progress:', err); }
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    if (direction === 'prev' && idx > 0) router.push(`/lessons/${lessons[idx - 1].id}`);
    if (direction === 'next' && idx < lessons.length - 1) router.push(`/lessons/${lessons[idx + 1].id}`);
  };

  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const markdownContent = lesson.content || '';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.push(`/courses/${course.id}`)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {course.title}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Lesson {idx + 1} of {lessons.length}
                  </p>
                  <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
                </div>
                <button
                  onClick={toggleComplete}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    completedLessons.includes(lesson.id)
                      ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {completedLessons.includes(lesson.id) ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Complete
                    </>
                  )}
                </button>
              </div>

              {lesson.duration && (
                <p className="text-sm text-muted-foreground mb-4">Duration: {lesson.duration} minutes</p>
              )}

              {lesson.video_url && (
                <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                  <video controls className="w-full h-full" key={lesson.video_url}>
                    <source src={lesson.video_url} type="video/mp4" />
                  </video>
                </div>
              )}

              {markdownContent ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                  {markdownContent}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No content for this lesson.</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigateLesson('prev')}
                disabled={idx <= 0}
                className="flex items-center px-4 py-2 bg-card border border-border rounded-md text-sm text-foreground hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Lesson
              </button>
              <button
                onClick={() => navigateLesson('next')}
                disabled={idx >= lessons.length - 1}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next Lesson
                <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {showEnrollPrompt && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-foreground mb-2">Enroll to track your progress</p>
                <form onSubmit={handleEnroll} className="flex space-x-2">
                  <input type="text" placeholder="Your name" value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
                    Go
                  </button>
                </form>
              </div>
            )}

            {enrollment && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">{enrollment.student_name}'s Progress</p>
                <div className="w-full bg-secondary rounded-full h-2 mb-1">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{enrollment.progress}% complete</p>
              </div>
            )}

            <LessonList lessons={lessons} currentLessonId={lesson.id} completedLessons={completedLessons} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
