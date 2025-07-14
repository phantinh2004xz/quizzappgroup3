import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './AuthPage/AuthForm';
import AdminForm from "./AdminPage/AdminFrom";
import UserPage from "./UserPage/UserPage";
import { auth, db } from "./shared/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AdminCourseManagerPage from './AdminPage/manage-course/AdminCourseManagerPage';
import ManageStudentPage from './AdminPage/manage-course/course-student/ManageStudentPage';
import MyCourseDetailPage from './UserPage/my-course/MyCourseDetailPage';

// Hook kiểm tra user đăng nhập & role
export function useAuthRole() {
  const [state, setState] = React.useState<{ loading: boolean; user: any; role: string | null }>({
    loading: true,
    user: null,
    role: null,
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setState({ loading: false, user, role: userDoc.data().role });
        } else {
          setState({ loading: false, user, role: null });
        }
      } else {
        setState({ loading: false, user: null, role: null });
      }
    });
    return () => unsubscribe();
  }, []);

  return state;
}

// Route bảo vệ, chỉ cho user hoặc admin vào đúng page của mình
function ProtectedRoute({ children, requireRole }: { children: React.ReactNode; requireRole: string }) {
  const { loading, user, role } = useAuthRole();
  if (loading) return <div className="flex justify-center items-center h-screen">Đang kiểm tra đăng nhập...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== requireRole) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <AuthForm onClose={() => {}} />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin" element={
          <ProtectedRoute requireRole="admin">
            <AdminForm />
          </ProtectedRoute>
        } />
        <Route path="/admin/course/:id" element={
          <ProtectedRoute requireRole="admin">
            <AdminCourseManagerPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-students" element={
          <ProtectedRoute requireRole="admin">
            <ManageStudentPage />
          </ProtectedRoute>
        } />
        <Route path="/user" element={
          <ProtectedRoute requireRole="user">
            <UserPage />
          </ProtectedRoute>
        } />
        <Route path="/my-course/:id/*" element={
          <ProtectedRoute requireRole="user">
            <MyCourseDetailPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
