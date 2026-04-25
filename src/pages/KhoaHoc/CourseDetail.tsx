import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    BookOpen,
    ChevronDown,
    Star,
    Users,
    Tag,
    User,
    GraduationCap,
    ClipboardList,
    CheckCircle,
    Circle,
    Award,
    BookMarked,
    MessageSquare,
    Trash2,
    PlayCircle
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

interface ExamSubmission {
    id: string;
    examId: string;
    examTitle: string;
    userId: string;
    userName: string;
    submissionFileUrl: string | null;
    content: string | null;
    score: number | null;
    teacherFeedback: string | null;
    submittedAt: string;
    courseClassName: string | null;
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
    userSubmission: ExamSubmission | null;
}

interface CourseRating {
    id: string;
    userId: string;
    userName: string;
    courseId: string;
    rating: number;
    comment: string | null;
    createdDate: string;
    updatedDate: string | null;
}

const CourseDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('Nội dung');
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
    const [studentId, setStudentId] = useState<string | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingComment, setRatingComment] = useState('');
    const [courseRatings, setCourseRatings] = useState<CourseRating[]>([]);
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const [ratingAvg, setRatingAvg] = useState(0);
    const [ratingTotal, setRatingTotal] = useState(0);
    const [deletingRating, setDeletingRating] = useState(false);

    const [examMsg, setExamMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

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

    const fetchRatings = useCallback(async () => {
        if (!id) return;
        setRatingsLoading(true);
        try {
            const res = await axios.get(`https://localhost:7134/api/Courses/${id}/ratings`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCourseRatings(res.data.ratings ?? []);
            setRatingAvg(res.data.averageRating ?? 0);
            setRatingTotal(res.data.ratingCount ?? 0);
        } catch (err) {
            console.error('Fetch ratings error:', err);
        } finally {
            setRatingsLoading(false);
        }
    }, [id]);

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
                // Pre-fill user's existing rating if any
                if (res.data.userRating) {
                    setSelectedRating(res.data.userRating);
                    setRatingComment(res.data.userComment ?? '');
                }
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

        const fetchRecentSubmissions = async () => {
            try {
                const res = await axios.get(`https://localhost:7134/api/ExamSubmissions/course/${id}/recent-submissions`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setRecentSubmissions(res.data);
            } catch (err) {
                console.error("Fetch recent submissions error:", err);
            }
        };

        if (id) {
            fetchCourseDetail();
            fetchRatings();
            fetchRecentSubmissions();
        }
    }, [id, fetchRatings]);

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

    const submitRating = async () => {
        if (!studentId || !course || selectedRating === 0) return;
        setSubmittingRating(true);
        try {
            await axios.post(
                `https://localhost:7134/api/Students/${studentId}/courses/${course.courseId}/rating`,
                { rating: selectedRating, comment: ratingComment || null },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
            );
            // Re-fetch course + ratings
            const [courseRes] = await Promise.all([
                axios.get(`https://localhost:7134/api/Students/${studentId}/courses/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                fetchRatings()
            ]);
            setCourse(courseRes.data);
        } catch (err) {
            console.error('Error submitting rating:', err);
        } finally {
            setSubmittingRating(false);
        }
    };

    const deleteMyRating = async () => {
        if (!studentId || !course) return;
        setDeletingRating(true);
        try {
            await axios.delete(
                `https://localhost:7134/api/Students/${studentId}/courses/${course.courseId}/rating`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSelectedRating(0);
            setRatingComment('');
            const [courseRes] = await Promise.all([
                axios.get(`https://localhost:7134/api/Students/${studentId}/courses/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                fetchRatings()
            ]);
            setCourse(courseRes.data);
        } catch (err) {
            console.error('Error deleting rating:', err);
        } finally {
            setDeletingRating(false);
        }
    };

    const totalLessons = course?.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
    const totalCompleted = course?.chapters?.reduce((sum, ch) => sum + ch.completedLessons, 0) ?? 0;
    const isCourseCompleted = totalLessons > 0 && totalCompleted === totalLessons;
    const progressPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

    // SVG Circle properties
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

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
                            {['Nội dung', 'Đánh giá', 'Giáo viên'].map((tab) => (
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
                                                            <Link
                                                                key={lesson.id}
                                                                to={`/course/${course.courseId}/lesson/${lesson.id}`}
                                                                className={`lesson-item-row ${lesson.isCompleted ? 'lesson-completed' : ''}`}
                                                                style={{ textDecoration: 'none', cursor: 'pointer' }}
                                                            >
                                                                <div className="lesson-main-content">
                                                                    <div className="lesson-icon-wrapper">
                                                                        {lesson.isCompleted
                                                                            ? <CheckCircle size={16} className="lesson-done-icon" />
                                                                            : <PlayCircle size={15} />
                                                                        }
                                                                    </div>
                                                                    <div className="lesson-text">
                                                                        <span className="lesson-order">Bài {lesson.order}.</span>
                                                                        <span className={`lesson-title-text ${lesson.isCompleted ? 'lesson-title-done' : ''}`}>{lesson.title}</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: 500 }}>
                                                                    Học ngay &rsaquo;
                                                                </div>
                                                            </Link>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}

                                {/* Final Exam Section */}
                                {course.exam && (
                                    <div className={`exam-unlock-card ${isCourseCompleted ? 'unlocked' : 'locked'}`}>
                                        <div className="unlock-icon">
                                            {isCourseCompleted ? <Award size={32} /> : <ClipboardList size={32} />}
                                        </div>
                                        <div className="unlock-content">
                                            <h3>{course.exam.title}</h3>
                                            <p>
                                                {isCourseCompleted
                                                    ? "Bạn đã hoàn thành tất cả bài học. Hãy tham gia bài kiểm tra cuối khóa để lấy chứng chỉ!"
                                                    : `Hoàn thành 100% nội dung để mở khóa bài thi (${totalCompleted}/${totalLessons} bài học).`
                                                }
                                            </p>
                                            {course.userSubmission ? (
                                                <div className="exam-result-summary">
                                                    <span className="result-badge">Đã nộp bài</span>
                                                    {course.userSubmission.score !== null && (
                                                        <span className="score-badge">Điểm: {course.userSubmission.score}/10</span>
                                                    )}
                                                    <Link to={`/course/${course.courseId}/exam/${course.exam.id}`} className="view-exam-btn">Xem lại kết quả</Link>
                                                </div>
                                            ) : (
                                                <Link
                                                    to={isCourseCompleted ? `/course/${course.courseId}/exam/${course.exam.id}` : '#'}
                                                    className={`exam-action-btn ${!isCourseCompleted ? 'disabled' : ''}`}
                                                    onClick={(e) => !isCourseCompleted && e.preventDefault()}
                                                >
                                                    {isCourseCompleted ? 'Làm bài ngay' : 'Đang bị khóa'}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}



                        {/* ===== Tab: Đánh giá ===== */}
                        {activeTab === 'Đánh giá' && (
                            <div className="rating-tab-container">
                                {/* Overview row */}
                                <div className="rating-overview">
                                    <div className="rating-big-score">
                                        <span className="rating-big-num">{ratingAvg.toFixed(1)}</span>
                                        <div className="rating-big-stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={22}
                                                    fill={s <= Math.round(ratingAvg) ? '#f59e0b' : 'none'}
                                                    color={s <= Math.round(ratingAvg) ? '#f59e0b' : '#cbd5e0'}
                                                />
                                            ))}
                                        </div>
                                        <span className="rating-big-count">{ratingTotal} đánh giá</span>
                                    </div>
                                    <div className="rating-bars">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const cnt = courseRatings.filter(r => r.rating === star).length;
                                            const pct = ratingTotal > 0 ? (cnt / ratingTotal) * 100 : 0;
                                            return (
                                                <div key={star} className="rating-bar-row">
                                                    <span className="rating-bar-label">{star} ★</span>
                                                    <div className="rating-bar-track">
                                                        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="rating-bar-cnt">{cnt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* My rating form */}
                                <div className="rating-form-card">
                                    <h3 className="rating-form-title">
                                        <MessageSquare size={18} />
                                        {course?.userRating ? 'Đánh giá của bạn' : 'Gửi đánh giá của bạn'}
                                    </h3>
                                    <div className="rating-star-picker">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star
                                                key={s}
                                                size={32}
                                                className="rating-star-pick"
                                                fill={(hoverRating || selectedRating) >= s ? '#f59e0b' : 'none'}
                                                color={(hoverRating || selectedRating) >= s ? '#f59e0b' : '#cbd5e0'}
                                                onMouseEnter={() => setHoverRating(s)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setSelectedRating(s)}
                                            />
                                        ))}
                                        {selectedRating > 0 && (
                                            <span className="rating-pick-label">
                                                {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'][selectedRating]}
                                            </span>
                                        )}
                                    </div>
                                    <textarea
                                        className="rating-comment-input"
                                        placeholder="Nhận xét của bạn về khoá học (tuỳ chọn)..."
                                        rows={3}
                                        value={ratingComment}
                                        onChange={e => setRatingComment(e.target.value)}
                                        maxLength={500}
                                    />
                                    <div className="rating-form-actions">
                                        <button
                                            className="rating-submit-btn"
                                            onClick={submitRating}
                                            disabled={selectedRating === 0 || submittingRating}
                                        >
                                            {submittingRating ? 'Đang gửi...' : (course?.userRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                                        </button>
                                        {course?.userRating && (
                                            <button
                                                className="rating-delete-btn"
                                                onClick={deleteMyRating}
                                                disabled={deletingRating}
                                                title="Xoá đánh giá của bạn"
                                            >
                                                <Trash2 size={15} />
                                                {deletingRating ? 'Đang xoá...' : 'Xoá đánh giá'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Reviews list */}
                                <div className="review-list">
                                    <h3 className="review-list-title">Tất cả đánh giá ({ratingTotal})</h3>
                                    {ratingsLoading ? (
                                        <p className="review-loading">Đang tải đánh giá...</p>
                                    ) : courseRatings.length === 0 ? (
                                        <div className="no-reviews">
                                            <Star size={36} className="no-reviews-icon" />
                                            <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                                        </div>
                                    ) : (
                                        courseRatings.map(r => (
                                            <div key={r.id} className={`review-item ${r.userId === studentId ? 'my-review' : ''}`}>
                                                <div className="review-avatar">
                                                    <User size={20} />
                                                </div>
                                                <div className="review-body">
                                                    <div className="review-header-row">
                                                        <span className="review-user-name">{r.userName}</span>
                                                        {r.userId === studentId && <span className="review-mine-badge">Của bạn</span>}
                                                        <div className="review-stars">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} size={13}
                                                                    fill={s <= r.rating ? '#f59e0b' : 'none'}
                                                                    color={s <= r.rating ? '#f59e0b' : '#cbd5e0'}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="review-date">
                                                            {new Date(r.createdDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    {r.comment && <p className="review-comment">{r.comment}</p>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                            {recentSubmissions.length > 0 ? (
                                recentSubmissions.map((act, i) => {
                                    // Trích xuất "Đúng X/Y câu" từ Content nếu có
                                    let resultDetail = "Đã nộp bài";
                                    if (act.content && act.content.includes("Đúng")) {
                                        const match = act.content.match(/Đúng \d+\/\d+ câu/);
                                        if (match) resultDetail = match[0];
                                    } else if (act.score !== null) {
                                        resultDetail = `Điểm: ${act.score}/10`;
                                    }

                                    return (
                                        <div key={i} className="activity-item">
                                            <div className="user-avatar"><User size={24} /></div>
                                            <div className="activity-info">
                                                <h4 className="user-name">{act.studentName}</h4>
                                                <p className="activity-detail">Hoàn thành bài thi - {resultDetail}</p>
                                                <p className="activity-time">{new Date(act.submittedAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="no-activity-text">Chưa có hoạt động nộp bài nào.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="sidebar-wrapper">
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
                                <div className="rating-stars" style={{ display: 'flex', gap: 2 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={16}
                                            fill={s <= Math.round(course.averageRating) ? '#f59e0b' : 'none'}
                                            color={s <= Math.round(course.averageRating) ? '#f59e0b' : '#cbd5e0'}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    <strong>{course.averageRating.toFixed(1)}</strong> ({course.ratingCount} đánh giá)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-card">
                        <h2 className="sidebar-title">Tiến độ học tập</h2>
                        <div className="progress-chart-container">
                            <div className="progress-circle-wrapper">
                                <svg className="progress-circle-svg" width="100" height="100">
                                    <circle
                                        className="progress-circle-bg"
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        strokeWidth="8"
                                    />
                                    <circle
                                        className="progress-circle-fill"
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        strokeWidth="8"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="progress-text-center">
                                    <span className="percent-num">{progressPercent}%</span>
                                    <span className="percent-label">Hoàn thành</span>
                                </div>
                            </div>
                            <div className="progress-stats-summary">
                                <p>Đã học: <strong>{totalCompleted}</strong>/{totalLessons} bài</p>
                                <div className="progress-bar-linear">
                                    <div className="progress-fill-linear" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Overview */}


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