import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, GraduationCap, Edit, LogOut } from 'lucide-react';
import './TeacherDashboard.css';

interface CourseClass {
    id: string;
    name: string;
    courseId: string;
    courseName: string;
    trainingProgramId: string;
    trainingProgramName: string;
    teacherId: string;
    teacherName: string;
}

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<CourseClass[]>([]);
    const [loading, setLoading] = useState(true);
    const teacherName = localStorage.getItem('userFullName') || 'Giảng viên';

    useEffect(() => {
        const fetchClasses = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Decode token to get user ID
                const payload = JSON.parse(atob(token.split('.')[1]));
                const teacherId = payload.sub || payload.userId || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

                const res = await axios.get(`https://localhost:7134/api/CourseClasses/teacher/${teacherId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setClasses(res.data);
            } catch (err) {
                console.error('Error fetching teacher classes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return <div className="loading-state">Đang tải dữ liệu lớp học...</div>;

    return (
        <div className="teacher-dashboard-container">
            <header className="td-header">
                <div className="td-header-left">
                    <h1>Teacher Dashboard</h1>
                    <span className="td-welcome">Xin chào, <strong>{teacherName}</strong></span>
                </div>
                <div className="td-header-right">
                    <button className="td-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} /> Đăng xuất
                    </button>
                </div>
            </header>

            <main className="td-main">
                <div className="td-section-title">
                    <h2>Các lớp đang phụ trách</h2>
                    <p>Danh sách các lớp học phần bạn được phân công giảng dạy.</p>
                </div>

                {classes.length === 0 ? (
                    <div className="td-empty-state">
                        <Users size={48} className="td-empty-icon" />
                        <p>Hiện tại bạn chưa được phân công phụ trách lớp học nào.</p>
                    </div>
                ) : (
                    <div className="td-grid">
                        {classes.map(c => (
                            <div key={c.id} className="td-card">
                                <div className="td-card-header">
                                    <div className="td-course-icon"><BookOpen size={24} /></div>
                                    <div className="td-course-info">
                                        <h3 className="td-course-name">{c.courseName}</h3>
                                        <span className="td-class-name">Lớp: {c.name}</span>
                                    </div>
                                </div>
                                
                                <div className="td-card-body">
                                    <div className="td-meta-item">
                                        <GraduationCap size={16} />
                                        <span>{c.trainingProgramName}</span>
                                    </div>
                                </div>
                                
                                <div className="td-card-footer">
                                    <button 
                                        className="td-grade-btn" 
                                        onClick={() => navigate(`/teacher/grading?classId=${c.id}&className=${encodeURIComponent(c.name)}`)}
                                    >
                                        <Edit size={16} /> Chấm điểm lớp này
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
