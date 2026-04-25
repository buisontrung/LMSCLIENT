import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, User, Calendar, Award, CheckCircle, AlertCircle, Search, ArrowLeft } from 'lucide-react';
import './TeacherGrading.css';

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

const TeacherGrading: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const filterClassName = searchParams.get('className');

    const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState<ExamSubmission | null>(null);
    const [score, setScore] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get('https://localhost:7134/api/ExamSubmissions/teacher/list', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSubmissions(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleSelect = (sub: ExamSubmission) => {
        setSelectedSub(sub);
        setScore(sub.score?.toString() ?? '');
        setFeedback(sub.teacherFeedback ?? '');
        setMessage(null);
    };

    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;

        setSubmitting(true);
        setMessage(null);

        try {
            await axios.put(`https://localhost:7134/api/ExamSubmissions/${selectedSub.id}/grade`, {
                score: parseFloat(score),
                teacherFeedback: feedback
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setMessage({ type: 'success', text: 'Đã lưu điểm thành công!' });
            fetchSubmissions();
            setSelectedSub({ ...selectedSub, score: parseFloat(score), teacherFeedback: feedback });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi chấm điểm.' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSubmissions = submissions.filter(s => {
        if (filterClassName && s.courseClassName !== filterClassName) return false;
        
        return s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               s.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (s.courseClassName?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    if (loading) return <div className="loading-state">Đang tải danh sách bài nộp...</div>;

    return (
        <div className="teacher-grading-page">
            <header className="page-header" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <button 
                    onClick={() => navigate('/teacher')} 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontWeight: 600, padding: '8px 12px', borderRadius: 6 }}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <div>
                    <h1>Chấm điểm bài kiểm tra {filterClassName ? `- Lớp ${filterClassName}` : ''}</h1>
                    <p>Danh sách bài nộp từ các lớp bạn phụ trách</p>
                </div>
            </header>

            <div className="grading-grid">
                <aside className="sidebar-list">
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm sinh viên, bài thi..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="list-container">
                        {filteredSubmissions.length === 0 ? (
                            <div className="no-data">Không có dữ liệu phù hợp.</div>
                        ) : (
                            filteredSubmissions.map(s => (
                                <div 
                                    key={s.id} 
                                    className={`submission-card ${selectedSub?.id === s.id ? 'active' : ''} ${s.score !== null ? 'is-graded' : ''}`}
                                    onClick={() => handleSelect(s)}
                                >
                                    <div className="card-top">
                                        <span className="class-badge">{s.courseClassName ?? 'N/A'}</span>
                                        <span className="date-text">{new Date(s.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="user-info">
                                        <User size={14} />
                                        <strong>{s.userName}</strong>
                                    </div>
                                    <div className="exam-info">
                                        <FileText size={14} />
                                        <span>{s.examTitle}</span>
                                    </div>
                                    {s.score !== null && (
                                        <div className="score-display">Điểm: {s.score}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className="main-content">
                    {selectedSub ? (
                        <div className="grading-detail">
                            <section className="detail-header">
                                <h2>Chi tiết bài làm</h2>
                                <div className="meta-info">
                                    <div className="meta-item">
                                        <label>Sinh viên:</label>
                                        <span>{selectedSub.userName}</span>
                                    </div>
                                    <div className="meta-item">
                                        <label>Lớp:</label>
                                        <span>{selectedSub.courseClassName}</span>
                                    </div>
                                    <div className="meta-item">
                                        <label>Bài thi:</label>
                                        <span>{selectedSub.examTitle}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="submission-content">
                                <h3>Nội dung bài làm</h3>
                                {selectedSub.content && (
                                    <div className="text-content">
                                        {selectedSub.content}
                                    </div>
                                )}
                                {selectedSub.submissionFileUrl && (
                                    <div className="file-attachment">
                                        <a href={`https://localhost:7134${selectedSub.submissionFileUrl}`} target="_blank" rel="noreferrer">
                                            <FileText size={20} />
                                            <span>Xem file bài làm đính kèm</span>
                                        </a>
                                    </div>
                                )}
                                {!selectedSub.content && !selectedSub.submissionFileUrl && (
                                    <p className="no-content">Không có nội dung bài nộp.</p>
                                )}
                            </section>

                            <section className="grading-section">
                                <h3>Chấm điểm & Nhận xét</h3>
                                <form onSubmit={handleGrade}>
                                    {message && (
                                        <div className={`status-alert ${message.type}`}>
                                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                            {message.text}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Điểm số (0-10):</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            min="0" 
                                            max="10" 
                                            value={score}
                                            onChange={e => setScore(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nhận xét của giảng viên:</label>
                                        <textarea 
                                            rows={6}
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                            placeholder="Nhập nhận xét chi tiết cho sinh viên..."
                                        />
                                    </div>
                                    <button type="submit" className="save-btn" disabled={submitting}>
                                        <Award size={18} />
                                        {submitting ? 'Đang lưu...' : 'Lưu kết quả chấm điểm'}
                                    </button>
                                </form>
                            </section>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FileText size={64} />
                            <p>Chọn một bài nộp để bắt đầu chấm điểm</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TeacherGrading;
