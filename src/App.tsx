import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import TrangChu from './pages/TrangChu/TrangChu';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import TeacherDashboard from './pages/Admin/TeacherDashboard';
import TeacherGrading from './pages/Admin/TeacherGrading';
import ProtectedRoute from './components/ProtectedRoute';
import CourseDetail from './pages/KhoaHoc/CourseDetail';
import CourseLesson from './pages/KhoaHoc/CourseLesson';
import CourseExam from './pages/KhoaHoc/CourseExam';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/grading" element={<TeacherGrading />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route index element={<TrangChu />} />
            <Route path="course/:id" element={<CourseDetail />} />
          </Route>
          <Route path="course/:courseId/lesson/:lessonId" element={<CourseLesson />} />
          <Route path="course/:courseId/exam/:examId" element={<CourseExam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
