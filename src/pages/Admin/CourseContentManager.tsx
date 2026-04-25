import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Edit2, Trash2, Video, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import './CourseContentManager.css';

interface Lesson {
    id: string;
    title: string;
    fileUrl: string;
    order: number;
    chapterId: string;
}

interface Chapter {
    id: string;
    title: string;
    order: number;
    courseId: string;
    lessons: Lesson[];
}

interface CourseContentManagerProps {
    courseId: string;
    courseTitle: string;
    onBack: () => void;
}

const CourseContentManager: React.FC<CourseContentManagerProps> = ({ courseId, courseTitle, onBack }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchContent = async () => {
        try {
            const res = await axios.get(`https://localhost:7134/api/Courses/${courseId}`, authHeaders);
            setChapters(res.data.chapters || []);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu khóa học:", err);
            alert("Không thể tải nội dung khóa học.");
        }
    };

    useEffect(() => {
        fetchContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const toggleChapter = (chapterId: string) => {
        const newSet = new Set(expandedChapters);
        if (newSet.has(chapterId)) newSet.delete(chapterId);
        else newSet.add(chapterId);
        setExpandedChapters(newSet);
    };

    // --- CHAPTER CRUD ---
    const [isChapterModalOpen, setChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [chapterTitle, setChapterTitle] = useState('');
    const [chapterOrder, setChapterOrder] = useState<number>(1);

    const openChapterModal = (chapter?: Chapter) => {
        setEditingChapter(chapter || null);
        setChapterTitle(chapter?.title || '');
        setChapterOrder(chapter?.order || chapters.length + 1);
        setChapterModalOpen(true);
    };

    const saveChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { title: chapterTitle, order: chapterOrder, courseId };
        try {
            if (editingChapter) {
                await axios.put(`https://localhost:7134/api/Chapters/${editingChapter.id}`, payload, authHeaders);
            } else {
                await axios.post('https://localhost:7134/api/Chapters', payload, authHeaders);
            }
            fetchContent();
            setChapterModalOpen(false);
        } catch (err) {
            alert('Lỗi lưu chương học!');
        }
    };

    const deleteChapter = async (id: string, title: string) => {
        if (!window.confirm(`CẢNH BÁO NGUY HIỂM: Bạn sắp xóa chương "${title}". TOÀN BỘ bài học bên trong chương này cũng sẽ bị xóa theo! Bạn có chắc chắn không?`)) return;
        try {
            await axios.delete(`https://localhost:7134/api/Chapters/${id}`, authHeaders);
            fetchContent();
        } catch (err) {
            alert('Lỗi xóa chương!');
        }
    };

    // --- LESSON CRUD ---
    const [isLessonModalOpen, setLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessonChapterId, setLessonChapterId] = useState<string>('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonOrder, setLessonOrder] = useState<number>(1);
    const [lessonFile, setLessonFile] = useState<File | null>(null);

    const openLessonModal = (chapterId: string, lesson?: Lesson) => {
        setEditingLesson(lesson || null);
        setLessonChapterId(chapterId);
        setLessonTitle(lesson?.title || '');
        
        // Auto increment order for new lessons
        const chapter = chapters.find(c => c.id === chapterId);
        setLessonOrder(lesson?.order || (chapter?.lessons.length ? chapter.lessons.length + 1 : 1));
        
        setLessonFile(null);
        setLessonModalOpen(true);
    };

    const saveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingLesson && !lessonFile) {
            alert('Vui lòng chọn file video cho bài học mới!');
            return;
        }

        const formData = new FormData();
        formData.append('Title', lessonTitle);
        formData.append('Order', lessonOrder.toString());
        formData.append('ChapterId', lessonChapterId);
        if (lessonFile) formData.append('VideoFile', lessonFile);

        try {
            if (editingLesson) {
                await axios.put(`https://localhost:7134/api/Lessons/${editingLesson.id}`, formData, authHeaders);
            } else {
                await axios.post('https://localhost:7134/api/Lessons', formData, authHeaders);
            }
            fetchContent();
            setLessonModalOpen(false);
        } catch (err: any) {
            alert(err.response?.data || 'Lỗi lưu bài học! Vui lòng kiểm tra định dạng file (chỉ nhận .mp4, .webm, .mov, .avi, .mkv)');
        }
    };

    const deleteLesson = async (id: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa bài học này?")) return;
        try {
            await axios.delete(`https://localhost:7134/api/Lessons/${id}`, authHeaders);
            fetchContent();
        } catch (err) {
            alert('Lỗi xóa bài học!');
        }
    };

    return (
        <div className="content-manager-container">
            <header className="cm-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <div className="cm-title">
                    <h2>Quản lý Nội dung Khóa học</h2>
                    <p>{courseTitle}</p>
                </div>
                <button className="add-chapter-btn" onClick={() => openChapterModal()}>
                    <Plus size={18} /> Thêm Chương mới
                </button>
            </header>

            <main className="cm-main">
                {chapters.length === 0 ? (
                    <div className="empty-content">
                        <p>Khóa học này chưa có nội dung nào.</p>
                        <button className="add-chapter-btn" onClick={() => openChapterModal()}><Plus size={18} /> Bắt đầu tạo Chương</button>
                    </div>
                ) : (
                    <div className="chapters-list">
                        {chapters.map(chapter => {
                            const isExpanded = expandedChapters.has(chapter.id);
                            return (
                                <div key={chapter.id} className="chapter-item">
                                    <div className="chapter-header">
                                        <div className="ch-left" onClick={() => toggleChapter(chapter.id)}>
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            <span className="ch-title">Chương {chapter.order}: {chapter.title}</span>
                                            <span className="ch-count">({chapter.lessons.length} bài học)</span>
                                        </div>
                                        <div className="ch-actions">
                                            <button className="icon-btn edit" title="Sửa chương" onClick={(e) => { e.stopPropagation(); openChapterModal(chapter); }}><Edit2 size={16} /></button>
                                            <button className="icon-btn delete" title="Xóa chương" onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id, chapter.title); }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="lessons-container">
                                            {chapter.lessons.length === 0 ? (
                                                <p className="empty-lessons">Chưa có bài học nào trong chương này.</p>
                                            ) : (
                                                chapter.lessons.map(lesson => (
                                                    <div key={lesson.id} className="lesson-item">
                                                        <div className="les-left">
                                                            <Video size={16} className="vid-icon" />
                                                            <span className="les-title">Bài {lesson.order}: {lesson.title}</span>
                                                        </div>
                                                        <div className="les-actions">
                                                            <button className="icon-btn edit" title="Sửa bài học" onClick={() => openLessonModal(chapter.id, lesson)}><Edit2 size={14} /></button>
                                                            <button className="icon-btn delete" title="Xóa bài học" onClick={() => deleteLesson(lesson.id)}><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <button className="add-lesson-btn" onClick={() => openLessonModal(chapter.id)}>
                                                <Plus size={16} /> Thêm bài học
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal Chapter */}
            {isChapterModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingChapter ? 'Sửa Chương' : 'Thêm Chương mới'}</h3>
                        <form onSubmit={saveChapter}>
                            <div className="form-group">
                                <label>Tiêu đề chương *</label>
                                <input required value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Thứ tự *</label>
                                <input type="number" min="1" required value={chapterOrder} onChange={e => setChapterOrder(Number(e.target.value))} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setChapterModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Lesson */}
            {isLessonModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingLesson ? 'Sửa Bài học' : 'Thêm Bài học mới'}</h3>
                        <form onSubmit={saveLesson}>
                            <div className="form-group">
                                <label>Tiêu đề bài học *</label>
                                <input required value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Thứ tự *</label>
                                <input type="number" min="1" required value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                                <label>File Video {editingLesson ? '(Tùy chọn, để trống nếu không đổi)' : '*'}</label>
                                <div className="file-input-wrapper">
                                    <Upload size={18} />
                                    <input 
                                        type="file" 
                                        onChange={e => setLessonFile(e.target.files?.[0] || null)} 
                                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska" 
                                    />
                                </div>
                                <small className="text-muted">Định dạng hỗ trợ: MP4, WEBM, MOV, AVI, MKV.</small>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setLessonModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseContentManager;
