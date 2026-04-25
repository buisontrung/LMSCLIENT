import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Award, 
    ChevronLeft, 
    ClipboardList, 
    CheckCircle, 
    Circle,
    ArrowRight
} from 'lucide-react';
import './CourseExam.css';

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

interface ExamSubmission {
    id: string;
    score: number | null;
    submittedAt: string;
    content: string | null;
    teacherFeedback: string | null;
}

const CourseExam = () => {
    const { courseId, examId } = useParams();
    const navigate = useNavigate();
    
    const [exam, setExam] = useState<Exam | null>(null);
    const [submission, setSubmission] = useState<ExamSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Interactive State
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [examContent, setExamContent] = useState('');
    const [examFile, setExamFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const sid = getUserIdFromToken();
                if (!sid) { navigate('/login'); return; }

                // 1. Kiểm tra xem đã nộp bài chưa bằng API riêng
                const submissionRes = await axios.get(`https://localhost:7134/api/ExamSubmissions/my-submission/${examId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (submissionRes.data) {
                    setSubmission(submissionRes.data);
                }

                // 2. Tải thông tin khóa học và bài thi
                const res = await axios.get(`https://localhost:7134/api/Students/${sid}/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = res.data;
                
                // Verify completion
                const totalLessons = data.chapters?.reduce((sum: number, ch: any) => sum + ch.lessons.length, 0) ?? 0;
                const totalCompleted = data.chapters?.reduce((sum: number, ch: any) => sum + ch.completedLessons, 0) ?? 0;
                
                if (totalCompleted < totalLessons) {
                    setError("Bạn cần hoàn thành tất cả bài học trước khi thực hiện bài kiểm tra này.");
                    setLoading(false);
                    return;
                }

                if (!data.exam || data.exam.id !== examId) {
                    setError("Không tìm thấy thông tin bài kiểm tra.");
                    setLoading(false);
                    return;
                }

                setExam(data.exam);
            } catch (err) {
                console.error("Fetch exam error:", err);
                setError("Có lỗi xảy ra khi tải dữ liệu bài thi.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, examId, navigate]);

    const getUserIdFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        } catch { return null; }
    };

    const handleAnswerSelect = (questionId: string, answerId: string) => {
        if (submission) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmit = async () => {
        if (!exam) return;
        setSubmitting(false); // Reset submitting state if we return early
        setSubmitting(true);
        setMsg(null);

        const isMCQ = exam.type === 'MCQ' || exam.type === 0 || (exam.type as any) === '0';

        try {
            const token = localStorage.getItem('token');
            let response;

            if (isMCQ) {
                if (Object.keys(selectedAnswers).length < exam.questions.length) {
                    setMsg({ type: 'error', text: "Vui lòng hoàn thành tất cả các câu hỏi." });
                    setSubmitting(false);
                    return;
                }

                // MCQ dùng JSON API
                const payload = {
                    examId: exam.id,
                    answerIds: Object.values(selectedAnswers)
                };

                response = await axios.post('https://localhost:7134/api/ExamSubmissions/submit/mcq', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Essay dùng FormForm API
                if (!examContent && !examFile) {
                    setMsg({ type: 'error', text: "Vui lòng nhập nội dung bài làm hoặc đính kèm file." });
                    setSubmitting(false);
                    return;
                }

                const formData = new FormData();
                formData.append('ExamId', exam.id);
                if (examContent) formData.append('Content', examContent);
                if (examFile) formData.append('SubmissionFile', examFile);

                response = await axios.post('https://localhost:7134/api/ExamSubmissions/submit/essay', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            setMsg({ type: 'success', text: "Nộp bài thành công!" });
            // Re-fetch to show status
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            console.error("Submit error:", err);
            const errorMsg = err.response?.data || "Có lỗi xảy ra khi nộp bài.";
            setMsg({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : "Lỗi dữ liệu đầu vào." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="exam-loading">Đang chuẩn bị bài thi...</div>;
    if (error) return (
        <div className="exam-error-container">
            <ClipboardList size={64} color="#ef4444" />
            <h2>Rất tiếc!</h2>
            <p>{error}</p>
            <Link to={`/course/${courseId}`} className="back-link">Quay lại khóa học</Link>
        </div>
    );

    return (
        <div className="exam-page-layout">
            <div className="exam-top-nav">
                <button onClick={() => navigate(`/course/${courseId}`)} className="exam-back-btn">
                    <ChevronLeft size={20} />
                    Quay lại khóa học
                </button>
                <div className="exam-course-title">Bài thi: {exam?.title}</div>
            </div>

            <div className="exam-content-container">
                <div className="exam-main-card">
                    {submission && submission.score !== null ? (
                        <div className="exam-result-summary-view">
                            <div className="result-header">
                                <div className="result-medal-wrapper">
                                    <Award size={80} className="result-medal-icon" />
                                </div>
                                <h2>Chúc mừng bạn đã hoàn thành bài thi!</h2>
                                <p>Kết quả học tập của bạn đã được ghi nhận vào hệ thống.</p>
                            </div>
                            
                            <div className="result-score-container">
                                <div className="score-box">
                                    <span className="score-label">Điểm số của bạn</span>
                                    <div className="score-display">
                                        <span className="score-num">{submission.score}</span>
                                        <span className="score-total">/10</span>
                                    </div>
                                    <div className={`score-status ${submission.score >= 5 ? 'passed' : 'failed'}`}>
                                        {submission.score >= 5 ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
                                    </div>
                                </div>
                            </div>

                            <div className="result-info-list">
                                <div className="info-item">
                                    <span className="info-label">Ngày nộp bài:</span>
                                    <span className="info-value">{new Date(submission.submittedAt).toLocaleString('vi-VN')}</span>
                                </div>
                                {submission.teacherFeedback && (
                                    <div className="info-item feedback-item">
                                        <span className="info-label">Nhận xét từ hệ thống/giảng viên:</span>
                                        <div className="feedback-content">{submission.teacherFeedback}</div>
                                    </div>
                                )}
                            </div>

                            <div className="result-actions-footer">
                                <button className="back-to-course-btn" onClick={() => navigate(`/course/${courseId}`)}>
                                    Quay lại khóa học
                                </button>
                                <p className="review-hint">Bạn có thể xem lại chi tiết bài làm tại mục lịch sử học tập.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {submission && (
                                <div className="exam-status-banner pending">
                                    <div className="status-icon">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div className="status-text">
                                        <h3>Bài làm đã được ghi nhận</h3>
                                        <p>Đang chờ giảng viên chấm điểm. Thời gian nộp: {new Date(submission.submittedAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="exam-info-header">
                                <h1>{exam?.title}</h1>
                                <div className="exam-badges">
                                    <span className="exam-badge-type">{(exam?.type === 'MCQ' || exam?.type === 0 || (exam?.type as any) === '0') ? 'Trắc nghiệm' : 'Tự luận'}</span>
                                    <span className="exam-badge-count">{exam?.questions.length} câu hỏi</span>
                                </div>
                            </div>

                            <div className="exam-questions-list">
                                {exam?.questions.map((q, idx) => (
                                    <div key={q.id} className="exam-question-item">
                                        <div className="q-title">
                                            <span className="q-num">Câu {idx + 1}</span>
                                            <p>{q.content}</p>
                                        </div>
                                        { (exam.type === 'MCQ' || exam.type === 0 || exam.type === '0') && (
                                            <div className="ans-list">
                                                {(q.answers || (q as any).Answers || []).map((a: any, aIdx: number) => {
                                                    const isSelected = selectedAnswers[q.id] === a.id;
                                                    const isCorrect = a.isCorrect || a.IsCorrect;
                                                    
                                                    // Review mode logic
                                                    let reviewClass = "";
                                                    if (submission) {
                                                        if (isSelected && isCorrect) reviewClass = "review-correct";
                                                        else if (isSelected && !isCorrect) reviewClass = "review-wrong";
                                                        else if (!isSelected && isCorrect) reviewClass = "review-missed";
                                                    }

                                                    return (
                                                        <div 
                                                            key={a.id} 
                                                            className={`ans-item ${isSelected ? 'selected' : ''} ${submission ? 'disabled' : ''} ${reviewClass}`}
                                                            onClick={() => handleAnswerSelect(q.id, a.id)}
                                                        >
                                                            <div className="ans-radio">
                                                                {isSelected ? (
                                                                    reviewClass === 'review-wrong' ? <Circle size={18} color="#ef4444" /> : <CheckCircle size={18} />
                                                                ) : (
                                                                    reviewClass === 'review-missed' ? <CheckCircle size={18} color="#10b981" /> : <Circle size={18} />
                                                                )}
                                                            </div>
                                                            <span className="ans-label">{String.fromCharCode(65 + aIdx)}.</span>
                                                            <span className="ans-text">{a.content || a.Content}</span>
                                                            {submission && isCorrect && <span className="correct-tag">Đáp án đúng</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {!submission ? (
                                <div className="exam-footer-submission">
                                    {!(exam?.type === 'MCQ' || exam?.type === 0 || (exam?.type as any) === '0') && (
                                        <div className="essay-inputs">
                                            <textarea 
                                                placeholder="Nhập bài làm tự luận của bạn..."
                                                value={examContent}
                                                onChange={e => setExamContent(e.target.value)}
                                                rows={8}
                                            />
                                            <div className="file-input-group">
                                                <label>Hoặc đính kèm file (PDF, DOCX, ZIP):</label>
                                                <input type="file" onChange={e => setExamFile(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>
                                    )}

                                    {msg && <div className={`exam-msg ${msg.type}`}>{msg.text}</div>}

                                    <button 
                                        className="exam-final-submit" 
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Đang nộp bài...' : 'Nộp bài thi ngay'}
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="exam-submission-footer">
                                    {submission.teacherFeedback && (
                                        <div className="teacher-feedback-box">
                                            <h4>Phản hồi từ giảng viên:</h4>
                                            <p>{submission.teacherFeedback}</p>
                                        </div>
                                    )}
                                    <button className="done-btn" onClick={() => navigate(`/course/${courseId}`)}>Hoàn thành xem lại</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseExam;
