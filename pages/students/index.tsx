import { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/auth';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);
  if (!session.user?.isLoggedIn || session.user.role !== 'admin') {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  return { props: {} };
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [assigning, setAssigning] = useState<{ studentId: number; studentName: string; selected: number[] } | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students/list');
      setStudents(res.data.students);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses/list');
      setCourses(res.data.courses);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.name) {
      toast.error('All fields required'); return;
    }
    try {
      await axios.post('/api/students/create', form);
      toast.success('Student created');
      setForm({ username: '', password: '', name: '' });
      setShowForm(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create student');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student?')) return;
    try {
      await axios.delete(`/api/students/${id}/delete`);
      toast.success('Student deleted');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const openAssign = async (student: any) => {
    try {
      const res = await axios.get(`/api/students/${student.id}/courses`);
      const assignedIds = res.data.courses.map((c: any) => c.id);
      setAssigning({ studentId: student.id, studentName: student.name, selected: assignedIds });
    } catch (err) {
      toast.error('Failed to load assigned courses');
    }
  };

  const toggleAssign = (courseId: number) => {
    if (!assigning) return;
    const selected = assigning.selected.includes(courseId)
      ? assigning.selected.filter((id) => id !== courseId)
      : [...assigning.selected, courseId];
    setAssigning({ ...assigning, selected });
  };

  const saveAssignments = async () => {
    if (!assigning) return;
    try {
      await axios.post(`/api/students/${assigning.studentId}/courses`, { courseIds: assigning.selected });
      toast.success('Courses updated');
      setAssigning(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update courses');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1">Manage student accounts and course access</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Student'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Create Student</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="johndoe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••" />
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Create Student
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12"><p className="text-muted-foreground">Loading...</p></div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-1">No students yet</h3>
            <p className="text-muted-foreground">Add students and assign them to courses</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Username</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Courses</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.username}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">{s.course_count}</td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <button onClick={() => openAssign(s)}
                        className="text-primary hover:underline">Assign Courses</button>
                      <button onClick={() => handleDelete(s.id)}
                        className="text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assigning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-foreground mb-1">Assign Courses</h3>
              <p className="text-sm text-muted-foreground mb-4">Select courses for {assigning.studentName}</p>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses available.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {courses.map((c) => (
                    <label key={c.id} className="flex items-center p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assigning.selected.includes(c.id)}
                        onChange={() => toggleAssign(c.id)}
                        className="mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.lesson_count} lessons</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button onClick={() => setAssigning(null)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={saveAssignments}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
