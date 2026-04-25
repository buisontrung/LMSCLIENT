import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, CheckCircle, Circle, PlayCircle, Lock, Award, BookOpen } from 'lucide-react';
import './CourseLesson.css';

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
    chapters: Chapter[];
}

const CourseLesson = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);

    // Watch time tracking
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [canComplete, setCanComplete] = useState(false);
    const [completing, setCompleting] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastTimeRef = useRef<number>(0);

    const getUserIdFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        } catch { return null; }
    };

    const fetchCourseData = async (sid: string) => {
        try {
            const res = await axios.get(`https://localhost:7134/api/Students/${sid}/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setCourse(res.data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu khóa học:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const sid = getUserIdFromToken();
        if (sid) {
            setStudentId(sid);
            fetchCourseData(sid);
        } else {
            navigate('/login');
        }
    }, [courseId, lessonId, navigate]);

    // Reset progress when changing lesson
    useEffect(() => {
        setPlayedSeconds(0);
        setCanComplete(false);
        lastTimeRef.current = 0;
        
        // If lesson is already completed in db, we can immediately allow complete button or just show it as completed
        if (course) {
            const currentLesson = course.chapters.flatMap(c => c.lessons).find(l => l.id === lessonId);
            if (currentLesson?.isCompleted) {
                setCanComplete(true);
            }
        }
    }, [lessonId, course]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (canComplete) return; // Stop tracking if already hit threshold
        
        const currentTime = e.currentTarget.currentTime;
        const duration = e.currentTarget.duration;
        if (!duration) return;

        const delta = currentTime - lastTimeRef.current;
        
        // Anti-skip logic: Only count positive, small deltas (smooth playback)
        // If delta is huge, it means user seeked forward.
        if (delta > 0 && delta <= 1.5) {
            setPlayedSeconds(prev => {
                const newVal = prev + delta;
                if (newVal >= duration * 0.6) {
                    setCanComplete(true);
                }
                return newVal;
            });
        }
        
        lastTimeRef.current = currentTime;
    };

    const handleSeeked = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        // Reset lastTime to current position after seek to resume tracking correctly
        lastTimeRef.current = e.currentTarget.currentTime;
    };

    const markAsComplete = async () => {
        if (!studentId || !lessonId) return;
        setCompleting(true);
        try {
            await axios.post(
                `https://localhost:7134/api/Students/${studentId}/lessons/${lessonId}/complete`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            
            // Refresh data to show green tick
            await fetchCourseData(studentId);
            
            // Optionally, automatically navigate to the next lesson here...
        } catch (err) {
            alert('Có lỗi xảy ra khi hoàn thành bài học!');
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="cl-loading">Đang tải bài học...</div>;
    if (!course) return <div className="cl-error">Không tìm thấy khoá học.</div>;

    const allLessons = course.chapters.flatMap(c => c.lessons);
    const currentLessonIndex = allLessons.findIndex(l => l.id === lessonId);
    const currentLesson = allLessons[currentLessonIndex];
    
    if (!currentLesson) return <div className="cl-error">Không tìm thấy bài học này.</div>;

    const nextLesson = allLessons[currentLessonIndex + 1];
    const prevLesson = allLessons[currentLessonIndex - 1];

    // Calculate overall progress
    const totalCount = allLessons.length;
    const completedCount = allLessons.filter(l => l.isCompleted).length;
    const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div className="course-lesson-layout">
            {/* Header */}
            <header className="cl-header">
                <Link to={`/course/${courseId}`} className="cl-back-btn">
                    <ChevronLeft size={20} /> Quay lại Khoá học
                </Link>
                <div className="cl-title-area">
                    <h1 className="cl-course-title">{course.courseName}</h1>
                </div>
                <div className="cl-progress-area">
                    <div className="cl-progress-bar-bg">
                        <div className="cl-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="cl-progress-text">{progressPercent}% hoàn thành</span>
                </div>
            </header>

            <div className="cl-main-content">
                {/* Left: Video Player */}
                <div className="cl-player-section">
                    <div className="cl-video-wrapper">
                        {currentLesson.fileUrl ? (
                            <video 
                                ref={videoRef}
                                src={`https://localhost:7134${currentLesson.fileUrl}`} 
                                controls 
                                controlsList="nodownload"
                                className="cl-video-element"
                                onTimeUpdate={handleTimeUpdate}
                                onSeeked={handleSeeked}
                                autoPlay
                            />
                        ) : (
                            <div className="cl-no-video">Bài học này chưa có video đính kèm.</div>
                        )}
                    </div>
                    
                    <div className="cl-lesson-footer">
                        <h2 className="cl-lesson-title">Bài {currentLesson.order}: {currentLesson.title}</h2>
                        
                        <div className="cl-lesson-actions">
                            {currentLesson.isCompleted ? (
                                <button className="cl-btn-completed" disabled>
                                    <CheckCircle size={18} /> Đã hoàn thành
                                </button>
                            ) : (
                                <div className="cl-action-group">
                                    {!canComplete && (
                                        <div className="cl-lock-notice">
                                            <Lock size={14} /> Bạn cần xem tối thiểu 60% video để hoàn thành.
                                        </div>
                                    )}
                                    <button 
                                        className={`cl-btn-complete ${canComplete ? 'active' : ''}`}
                                        disabled={!canComplete || completing}
                                        onClick={markAsComplete}
                                    >
                                        {completing ? 'Đang xử lý...' : (
                                            <>
                                                <CheckCircle size={18} /> Đánh dấu Hoàn thành
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cl-nav-buttons">
                        {prevLesson ? (
                            <Link to={`/course/${courseId}/lesson/${prevLesson.id}`} className="cl-nav-btn outline">
                                &laquo; Bài trước
                            </Link>
                        ) : <div></div>}
                        
                        {nextLesson && (
                            <Link to={`/course/${courseId}/lesson/${nextLesson.id}`} className="cl-nav-btn primary">
                                Bài tiếp theo &raquo;
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar Curriculum */}
                <aside className="cl-sidebar">
                    <div className="cl-sidebar-header">
                        <h3>Nội dung bài giảng</h3>
                    </div>
                    <div className="cl-curriculum-list">
                        {course.chapters.map(chapter => (
                            <div key={chapter.id} className="cl-chapter-block">
                                <div className="cl-chapter-title">
                                    <BookOpen size={16} />
                                    <span>Chương {chapter.order}: {chapter.title}</span>
                                </div>
                                <div className="cl-lesson-list">
                                    {chapter.lessons.map(lesson => {
                                        const isActive = lesson.id === lessonId;
                                        return (
                                            <Link 
                                                key={lesson.id}
                                                to={`/course/${courseId}/lesson/${lesson.id}`}
                                                className={`cl-lesson-item ${isActive ? 'active' : ''}`}
                                            >
                                                <div className="cl-lesson-status">
                                                    {lesson.isCompleted ? (
                                                        <CheckCircle size={16} className="text-green" />
                                                    ) : (
                                                        isActive ? <PlayCircle size={16} className="text-blue" /> : <Circle size={16} className="text-gray" />
                                                    )}
                                                </div>
                                                <div className="cl-lesson-name">
                                                    <span className="cl-lname">Bài {lesson.order}. {lesson.title}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CourseLesson;
