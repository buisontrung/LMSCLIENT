import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import TrangChu from './pages/TrangChu/TrangChu';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import CourseDetail from './pages/KhoaHoc/CourseDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route element={<MainLayout />}>
            <Route index element={<TrangChu />} />
            <Route path="course/:id" element={<CourseDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
