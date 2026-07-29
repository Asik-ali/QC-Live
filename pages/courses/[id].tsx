import { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/auth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import Layout from '@/components/Layout';
import LessonList from '@/components/LessonList';
import { getDb } from '@/lib/database';

interface Course {
  id: number; title: string; description: string | null; instructor: string;
  category: string; difficulty: string; status: string; lesson_count: number;
  enrollment_count: number; created_at: string;
}

interface Lesson {
  id: number; course_id: number; title: string; content: string | null;
  video_url: string | null; duration: number | null; sort_order: number;
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);
  if (!session.user?.isLoggedIn) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  const db = await getDb();
  const course = await db.get('SELECT * FROM courses WHERE id = ?', [context.params?.id]);
  if (!course) return { notFound: true };
  return { props: { initialCourse: JSON.parse(JSON.stringify(course)) } };
};

export default function CourseDetail({ initialCourse }: { initialCourse: Course }) {
  const router = useRouter();
  const [course] = useState<Course>(initialCourse);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', videoUrl: '', duration: '' });

  useEffect(() => {
    fetchLessons();
    fetchEnrollments();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await axios.get(`/api/courses/${course.id}/lessons/list`);
      setLessons(res.data.lessons);
    } catch (err) { console.error('Failed to fetch lessons:', err); }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/api/enrollments/list');
      setEnrollments(res.data.enrollments.filter((e: any) => e.course_id === course.id));
    } catch (err) { console.error('Failed to fetch enrollments:', err); }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) { toast.error('Enter your name'); return; }
    try {
      await axios.post('/api/enrollments/create', { courseId: course.id, studentName: studentName.trim() });
      toast.success('Enrolled successfully!');
      setStudentName('');
      setShowEnrollForm(false);
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) { toast.error('Title is required'); return; }
    try {
      await axios.post(`/api/courses/${course.id}/lessons/create`, {
        title: lessonForm.title, content: lessonForm.content,
        videoUrl: lessonForm.videoUrl || null, duration: lessonForm.duration ? parseInt(lessonForm.duration) : null,
      });
      toast.success('Lesson added');
      setLessonForm({ title: '', content: '', videoUrl: '', duration: '' });
      setShowLessonForm(false);
      fetchLessons();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to add lesson'); }
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-500/10 text-green-500',
    intermediate: 'bg-yellow-500/10 text-yellow-500',
    advanced: 'bg-red-500/10 text-red-500',
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.push('/courses')}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
                  <p className="text-muted-foreground mt-2">{course.description || 'No description'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${difficultyColors[course.difficulty] || 'bg-gray-500/10 text-gray-500'}`}>
                  {course.difficulty}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>By {course.instructor}</span>
                <span>{course.category}</span>
                <span>{course.lesson_count} lessons</span>
                <span>{course.enrollment_count} enrolled</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
                <button onClick={() => setShowLessonForm(!showLessonForm)}
                  className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  {showLessonForm ? 'Cancel' : 'Add Lesson'}
                </button>
              </div>

              {showLessonForm && (
                <form onSubmit={handleAddLesson} className="mb-6 p-4 bg-background rounded-lg space-y-3">
                  <input type="text" placeholder="Lesson title *" value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <textarea placeholder="Lesson content (markdown supported)" value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} rows={4}
                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Video URL (optional)" value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" placeholder="Duration (minutes)" value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                    Add Lesson
                  </button>
                </form>
              )}

              {lessons.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No lessons yet. Add your first lesson.</p>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id}
                      onClick={() => router.push(`/lessons/${lesson.id}`)}
                      className="flex items-center p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors border border-border">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3 text-sm font-medium text-muted-foreground flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                        {lesson.duration && (
                          <p className="text-xs text-muted-foreground">{lesson.duration} min</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-3">Enroll Now</h3>
              {showEnrollForm ? (
                <form onSubmit={handleEnroll}>
                  <input type="text" placeholder="Your name" value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="flex space-x-2">
                    <button type="submit" className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
                      Enroll
                    </button>
                    <button type="button" onClick={() => setShowEnrollForm(false)}
                      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowEnrollForm(true)}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Enroll Now
                </button>
              )}
            </div>

            {enrollments.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-3">Enrolled Students ({enrollments.length})</h3>
                <div className="space-y-2">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-primary">{enr.student_name.charAt(0)}</span>
                        </div>
                        <span className="text-foreground">{enr.student_name}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-16 bg-secondary rounded-full h-1.5 mr-2">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${enr.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{enr.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <LessonList lessons={lessons} completedLessons={[]} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
