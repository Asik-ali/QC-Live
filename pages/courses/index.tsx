import { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/auth';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);
  if (!session.user?.isLoggedIn) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  return {
    props: {
      userRole: session.user.role || 'admin',
      studentId: session.user.studentId || null,
    },
  };
};

export default function CoursesPage({ userRole, studentId }: { userRole: string; studentId: number | null }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', instructor: 'Instructor', category: 'General', difficulty: 'beginner' });
  const isAdmin = userRole === 'admin';

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses/list');
      let allCourses = res.data.courses;
      if (!isAdmin && studentId) {
        const assignedRes = await axios.get(`/api/courses/student/${studentId}`);
        const assignedIds = assignedRes.data.courses.map((c: any) => c.id);
        allCourses = allCourses.filter((c: any) => assignedIds.includes(c.id));
      }
      setCourses(allCourses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      await axios.post('/api/courses/create', form);
      toast.success('Course created');
      setForm({ title: '', description: '', instructor: 'Instructor', category: 'General', difficulty: 'beginner' });
      setShowForm(false);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course and all its lessons?')) return;
    try {
      await axios.delete(`/api/courses/${id}/delete`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete course');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Courses</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Create and manage learning content' : 'Your assigned courses'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              {showForm ? 'Cancel' : 'New Course'}
            </button>
          )}
        </div>

        {isAdmin && showForm && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Create New Course</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Introduction to Web Development" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Course description..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Instructor</label>
                  <input type="text" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="General">General</option>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Create Course
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12"><p className="text-muted-foreground">Loading courses...</p></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-1">
              {isAdmin ? 'No courses yet' : 'No courses assigned'}
            </h3>
            <p className="text-muted-foreground">
              {isAdmin ? 'Create your first course to get started' : 'Contact your admin to get course access'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onDelete={isAdmin ? handleDelete : () => {}} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
