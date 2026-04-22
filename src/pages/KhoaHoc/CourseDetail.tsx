import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    BookOpen,
    ChevronDown,
    Star,
    Users,
    Tag,
    Clock,
    User,
    GraduationCap,
    ClipboardList,
    CheckCircle,
    Circle,
    Award,
    BookMarked
} from 'lucide-react';
import './CourseDetail.css';

const BANNER_BG = "/course_banner_bg.png";
const NEWS_IMG_1 = "/news_thumbnail_1.png";
const NEWS_IMG_2 = "/news_thumbnail_2.png";

interface Answer {
    id: string;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    content: string;
    answers: Answer[];
}

interface Exam {
    id: string;
    title: string;
    type: string;
    questions: Question[];
}

interface Lesson {
    id: string;
    title: string;
    fileUrl: string;
    order: number;
    chapterId: string;
    chapterTitle: string;
    isCompleted: boolean;
    completedAt: string | null;
}

interface Chapter {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
    completedLessons: number;
    isCompleted: boolean;
}

interface CourseDetail {
    courseId: string;
    courseName: string;
    description: string | null;
    imageUrl: string | null;
    courseClassId: string;
    courseClassName: string;
    trainingProgramName: string;
    enrollmentDate: string;
    userName: string;
    teacherId: string | null;
    teacherName: string;
    teacherEmail: string;
    studentCount: number;
    averageRating: number;
    ratingCount: number;
    userRating: number | null;
    userComment: string | null;
    chapters: Chapter[];
    exam: Exam | null;
}

const CourseDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('Nội dung');
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
    const [studentId, setStudentId] = useState<string | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingComment, setRatingComment] = useState('');

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterId]: !prev[chapterId]
        }));
    };

    const getUserIdFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return (
                payload.sub ||
                payload.userId ||
                payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
            );
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const fetchCourseDetail = async () => {
            const sid = getUserIdFromToken();
            if (!sid) { setLoading(false); return; }
            setStudentId(sid);
            try {
                const res = await axios.get(`https://localhost:7134/api/Students/${sid}/courses/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setCourse(res.data);
                // Auto-expand first chapter
                if (res.data.chapters && res.data.chapters.length > 0) {
                    setExpandedChapters({ [res.data.chapters[0].id]: true });
                }
            } catch (err) {
                console.error("Fetch course detail error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourseDetail();
    }, [id]);

    const markLessonComplete = async (lessonId: string, currentStatus: boolean) => {
        if (!studentId) return;
        try {
            if (!currentStatus) {
                await axios.post(
                    `https://localhost:7134/api/Students/${studentId}/lessons/${lessonId}/complete`,
                    {},
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
            } else {
                await axios.delete(
                    `https://localhost:7134/api/Students/${studentId}/lessons/${lessonId}/complete`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
            }
            // Re-fetch to update all counts
            const res = await axios.get(`https://localhost:7134/api/Students/${studentId}/courses/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setCourse(res.data);
        } catch (err) {
            console.error('Error updating lesson status:', err);
        }
    };

    const submitRating = async (stars: number) => {
        if (!studentId || !course) return;
        setSubmittingRating(true);
        try {
            await axios.post(
                `https://localhost:7134/api/Students/${studentId}/courses/${course.courseId}/rating`,
                { rating: stars, comment: ratingComment || null },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
            );
            // Re-fetch to get updated rating
            const res = await axios.get(`https://localhost:7134/api/Students/${studentId}/courses/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCourse(res.data);
        } catch (err) {
            console.error('Error submitting rating:', err);
        } finally {
            setSubmittingRating(false);
        }
    };

    const totalLessons = course?.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
    const totalCompleted = course?.chapters?.reduce((sum, ch) => sum + ch.completedLessons, 0) ?? 0;

    if (loading) return <div className="loading">Đang tải dữ liệu khóa học...</div>;
    if (!course) return <div className="error">Không tìm thấy thông tin khoá học.</div>;

    return (
        <div className="course-detail-page">
            {/* Banner */}
            <div className="course-banner">
                <img src={BANNER_BG} alt="Banner" className="course-banner-bg" />
                <div className="course-banner-content">
                    <nav className="breadcrumb">
                        Trang chủ <span>›</span> {course.trainingProgramName} <span>›</span> {course.courseClassName} <span>›</span> {course.courseName}
                    </nav>
                    <h1 className="course-title">{course.courseName}</h1>
                    <div className="course-meta-badges">
                        <span className="meta-badge">
                            <GraduationCap size={14} />
                            {course.trainingProgramName}
                        </span>
                        <span className="meta-badge">
                            <Users size={14} />
                            Lớp: {course.courseClassName}
                        </span>
                        <span className="meta-badge">
                            <BookOpen size={14} />
                            {course.chapters.length} chương · {totalLessons} bài học
                        </span>
                        {course.exam && (
                            <span className="meta-badge exam-badge">
                                <ClipboardList size={14} />
                                Có bài kiểm tra cuối khoá
                            </span>
                        )}
                    </div>
                    {course.description && (
                        <p className="course-description-banner">{course.description}</p>
                    )}
                </div>
            </div>

            {/* Main Layout */}
            <div className="course-main-container">
                {/* Left Column */}
                <div className="content-wrapper">
                    {/* Tabs */}
                    <div className="tabs-container">
                        <div className="tabs-header">
                            {['Nội dung', 'Bài kiểm tra', 'Giáo viên'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab: Nội dung */}
                        {activeTab === 'Nội dung' && (
                            <div className="chapter-list">
                                {(!course.chapters || course.chapters.length === 0) ? (
                                    <p className="no-lessons">Chưa có nội dung bài học nào được cập nhật.</p>
                                ) : (
                                    course.chapters.map((chapter) => (
                                        <div key={chapter.id} className={`chapter-item ${expandedChapters[chapter.id] ? 'expanded' : ''} ${chapter.isCompleted ? 'chapter-completed' : ''}`}>
                                            <div className="chapter-header-row" onClick={() => toggleChapter(chapter.id)}>
                                                <div className="chapter-info-box">
                                                    <ChevronDown
                                                        size={20}
                                                        className={`chapter-toggle-icon ${expandedChapters[chapter.id] ? 'rotate' : ''}`}
                                                    />
                                                    <h3 className="chapter-title">
                                                        {chapter.isCompleted && <CheckCircle size={16} className="chapter-done-icon" />}
                                                        Chương {chapter.order}: {chapter.title}
                                                    </h3>
                                                </div>
                                                <div className="chapter-summary">
                                                    {chapter.isCompleted
                                                        ? <span className="chapter-badge-done">✓ Hoàn thành</span>
                                                        : <span>{chapter.completedLessons}/{chapter.lessons.length} bài đã học</span>
                                                    }
                                                </div>
                                            </div>

                                            {expandedChapters[chapter.id] && (
                                                <div className="lesson-items-container">
                                                    {chapter.lessons.length === 0 ? (
                                                        <p className="no-lessons-in-chapter">Chương này chưa có bài học.</p>
                                                    ) : (
                                                        chapter.lessons.map((lesson) => (
                                                            <div key={lesson.id} className={`lesson-item-row ${lesson.isCompleted ? 'lesson-completed' : ''}`}>
                                                                <div className="lesson-main-content">
                                                                    <div className="lesson-icon-wrapper">
                                                                        {lesson.isCompleted
                                                                            ? <CheckCircle size={16} className="lesson-done-icon" />
                                                                            : <BookMarked size={15} />
                                                                        }
                                                                    </div>
                                                                    <div className="lesson-text">
                                                                        <span className="lesson-order">Bài {lesson.order}.</span>
                                                                        <span className={`lesson-title-text ${lesson.isCompleted ? 'lesson-title-done' : ''}`}>{lesson.title}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className={`lesson-complete-btn ${lesson.isCompleted ? 'undo' : ''}`}
                                                                    onClick={(e) => { e.stopPropagation(); markLessonComplete(lesson.id, lesson.isCompleted); }}
                                                                    title={lesson.isCompleted ? 'Bỏ hoàn thành' : 'Đánh dấu đã học'}
                                                                >
                                                                    {lesson.isCompleted ? 'Đã học ✓' : 'Đánh dấu học'}
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}

                                {/* Final Exam as last item in content tab */}
                                {course.exam && (
                                    <div className="chapter-item exam-chapter-item">
                                        <div className="chapter-header-row exam-header-row">
                                            <div className="chapter-info-box">
                                                <Award size={20} className="exam-icon" />
                                                <h3 className="chapter-title exam-title">{course.exam.title}</h3>
                                            </div>
                                            <div className="chapter-summary exam-summary-badge">
                                                {course.exam.questions.length} câu hỏi · {course.exam.type}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Bài kiểm tra */}
                        {activeTab === 'Bài kiểm tra' && (
                            <div className="exam-tab-container">
                                {!course.exam ? (
                                    <div className="no-exam">
                                        <ClipboardList size={40} className="no-exam-icon" />
                                        <p>Khoá học này chưa có bài kiểm tra.</p>
                                    </div>
                                ) : (
                                    <div className="exam-detail">
                                        <div className="exam-header-card">
                                            <Award size={32} className="exam-header-icon" />
                                            <div>
                                                <h2 className="exam-heading">{course.exam.title}</h2>
                                                <p className="exam-meta">
                                                    Loại: <strong>{course.exam.type}</strong>
                                                    &nbsp;·&nbsp;
                                                    Tổng số câu: <strong>{course.exam.questions.length} câu</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="question-list">
                                            {course.exam.questions.map((q, qIdx) => (
                                                <div key={q.id} className="question-card">
                                                    <div className="question-header">
                                                        <span className="question-number">Câu {qIdx + 1}</span>
                                                        <p className="question-content">{q.content}</p>
                                                    </div>
                                                    <div className="answer-list">
                                                        {q.answers.map((a, aIdx) => (
                                                            <div key={a.id} className={`answer-item ${a.isCorrect ? 'correct' : ''}`}>
                                                                <div className="answer-indicator">
                                                                    {a.isCorrect
                                                                        ? <CheckCircle size={16} className="answer-correct-icon" />
                                                                        : <Circle size={16} className="answer-circle-icon" />
                                                                    }
                                                                </div>
                                                                <span className="answer-label">{String.fromCharCode(65 + aIdx)}.</span>
                                                                <span className="answer-text">{a.content}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Giáo viên' && (
                            <div className="teacher-tab-container">
                                {!course.teacherName ? (
                                    <div className="no-exam">
                                        <User size={40} className="no-exam-icon" />
                                        <p>Chưa có giảng viên phụ trách được phân công.</p>
                                    </div>
                                ) : (
                                    <div className="teacher-card">
                                        <div className="teacher-avatar">
                                            <User size={40} />
                                        </div>
                                        <div className="teacher-info">
                                            <h3>{course.teacherName}</h3>
                                            <p>📧 {course.teacherEmail}</p>
                                            <p className="teacher-role-badge">Giảng viên phụ trách</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recent Activities */}
                    <div className="activity-card">
                        <div className="activity-header">
                            <h2>Hoạt động gần đây</h2>
                        </div>
                        <div className="activity-grid">
                            {[
                                { name: "Nguyễn Hiền Bách", time: "21:41:55 09/11/2025", score: "2/10" },
                                { name: "Bùi Đức Trọng", time: "21:40:26 09/11/2025", score: "2/10" },
                                { name: "Bùi Đức Trọng", time: "21:40:14 09/11/2025", score: "2/10" },
                                { name: "Phạm Năng Chiến", time: "21:40:00 09/11/2025", score: "2/10" },
                            ].map((act, i) => (
                                <div key={i} className="activity-item">
                                    <div className="user-avatar"><User size={24} /></div>
                                    <div className="activity-info">
                                        <h4 className="user-name">{act.name}</h4>
                                        <p className="activity-detail">Làm bài kiểm tra: Bài thi - Đúng: {act.score}</p>
                                        <p className="activity-time">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="sidebar-wrapper">
                    {/* Course Overview */}
                    <div className="sidebar-card">
                        <h2 className="sidebar-title">Thông tin khoá học</h2>
                        <div className="overview-stats">
                            <div className="stat-item">
                                <GraduationCap size={18} className="text-gray-400" />
                                <span>Chương trình: <strong>{course.trainingProgramName || 'N/A'}</strong></span>
                            </div>
                            <div className="stat-item">
                                <Users size={18} className="text-gray-400" />
                                <span>Lớp học: <strong>{course.courseClassName || 'N/A'}</strong></span>
                            </div>
                            <div className="stat-item">
                                <BookOpen size={18} className="text-gray-400" />
                                <span>Số chương: <strong>{course.chapters.length}</strong></span>
                            </div>
                            <div className="stat-item">
                                <BookMarked size={18} className="text-gray-400" />
                                <span>Tổng bài học: <strong>{totalLessons} bài</strong></span>
                            </div>
                            {course.exam && (
                                <div className="stat-item">
                                    <ClipboardList size={18} className="text-gray-400" />
                                    <span>Bài kiểm tra: <strong className="exam-count-badge">{course.exam.questions.length} câu</strong></span>
                                </div>
                            )}
                            <div className="stat-item">
                                <Tag size={18} className="text-gray-400" />
                                <span>Học phí: <span className="fee-badge">Miễn phí</span></span>
                            </div>
                            <div className="stat-item">
                                <div className="rating-stars active">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                </div>
                                <span className="text-gray-400">(0 đánh giá)</span>
                            </div>
                        </div>
                    </div>

                    {/* News */}
                    <div className="sidebar-card">
                        <h2 className="sidebar-title">Tin tức</h2>
                        <div className="news-items">
                            {[
                                { title: "Đoàn Viện Khoa học và Công nghệ tiên tiến Nhật...", date: "04/02/2026", img: NEWS_IMG_1 },
                                { title: "Thông báo về việc nghỉ học và thi kết thúc học phần...", date: "22/01/2026", img: NEWS_IMG_2 },
                                { title: "Hội nghị \"Học tập và làm theo tư tưởng, đạo đức,...", date: "11/08/2022", img: NEWS_IMG_1 },
                            ].map((news, i) => (
                                <div key={i} className="news-card">
                                    <img src={news.img} alt="Tin tức" className="news-thumb" />
                                    <div className="news-info">
                                        <h4 className="news-title">{news.title}</h4>
                                        <p className="news-date">Cập nhật {news.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="view-more-btn">Xem thêm...</button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CourseDetail;