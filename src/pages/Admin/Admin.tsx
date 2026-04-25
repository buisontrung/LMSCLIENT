import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, Users, BookOpen, GraduationCap, Upload, Search, CheckSquare, Square, FolderTree } from 'lucide-react';
import './Admin.css';
import CourseContentManager from './CourseContentManager';

// --- Interfaces ---
interface Course {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

interface CourseClass {
    id: string;
    name: string;
    courseId: string;
    courseName: string;
    trainingProgramId: string;
    trainingProgramName: string;
    teacherId: string | null;
    teacherName: string;
}

interface TrainingProgram {
    id: string;
    name: string;
}

interface User {
    id: string;
    fullName: string;
    email: string;
    studentCode: string;
}

interface Enrollment {
    id: string;
    userId: string;
    userName: string;
    courseId: string;
    courseClassId: string;
    courseClassName: string;
    enrollmentDate: string;
}

const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Courses' | 'Classes' | 'Enrollments'>('Courses');
    const [managingCourse, setManagingCourse] = useState<Course | null>(null);

    // Data states
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<CourseClass[]>([]);
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

    const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    // Fetch initial data
    const fetchData = async () => {
        try {
            const [crsRes, clsRes, prgRes, tchRes, stdRes, enrRes] = await Promise.all([
                axios.get('https://localhost:7134/api/Courses', authHeaders),
                axios.get('https://localhost:7134/api/CourseClasses', authHeaders),
                axios.get('https://localhost:7134/api/TrainingPrograms', authHeaders),
                axios.get('https://localhost:7134/api/Users?role=Teacher', authHeaders),
                axios.get('https://localhost:7134/api/Users?role=Student', authHeaders),
                axios.get('https://localhost:7134/api/Enrollments', authHeaders)
            ]);
            setCourses(crsRes.data);
            setClasses(clsRes.data);
            setPrograms(prgRes.data);
            setTeachers(tchRes.data);
            setStudents(stdRes.data);
            setEnrollments(enrRes.data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Courses Logic ---
    const [isCourseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [courseFile, setCourseFile] = useState<File | null>(null);

    const openCourseModal = (course?: Course) => {
        setEditingCourse(course || null);
        setCourseTitle(course?.title || '');
        setCourseDesc(course?.description || '');
        setCourseFile(null);
        setCourseModalOpen(true);
    };

    const saveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('Title', courseTitle);
        formData.append('Description', courseDesc);
        if (courseFile) formData.append('ImageFile', courseFile);

        try {
            if (editingCourse) {
                await axios.put(`https://localhost:7134/api/Courses/${editingCourse.id}`, formData, authHeaders);
            } else {
                await axios.post('https://localhost:7134/api/Courses', formData, authHeaders);
            }
            fetchData();
            setCourseModalOpen(false);
        } catch (err) {
            alert('Lỗi lưu khóa học!');
        }
    };

    const deleteCourse = async (id: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa khóa học này? Mọi dữ liệu liên quan sẽ bị xóa!")) return;
        try {
            await axios.delete(`https://localhost:7134/api/Courses/${id}`, authHeaders);
            fetchData();
        } catch (err) {
            alert('Lỗi xóa khóa học!');
        }
    };

    // --- Course Classes Logic ---
    const [isClassModalOpen, setClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<CourseClass | null>(null);
    const [className, setClassName] = useState('');
    const [classCourseId, setClassCourseId] = useState('');
    const [classProgramId, setClassProgramId] = useState('');
    const [classTeacherId, setClassTeacherId] = useState('');

    const openClassModal = (cls?: CourseClass) => {
        setEditingClass(cls || null);
        setClassName(cls?.name || '');
        setClassCourseId(cls?.courseId || '');
        setClassProgramId(cls?.trainingProgramId || '');
        setClassTeacherId(cls?.teacherId || '');
        setClassModalOpen(true);
    };

    const saveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: className,
            courseId: classCourseId,
            trainingProgramId: classProgramId,
            teacherId: classTeacherId || null
        };

        try {
            if (editingClass) {
                await axios.put(`https://localhost:7134/api/CourseClasses/${editingClass.id}`, payload, authHeaders);
            } else {
                await axios.post('https://localhost:7134/api/CourseClasses', payload, authHeaders);
            }
            fetchData();
            setClassModalOpen(false);
        } catch (err) {
            alert('Lỗi lưu lớp học!');
        }
    };

    const deleteClass = async (id: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa lớp học này?")) return;
        try {
            await axios.delete(`https://localhost:7134/api/CourseClasses/${id}`, authHeaders);
            fetchData();
        } catch (err) {
            alert('Lỗi xóa lớp học!');
        }
    };

    // --- Enrollments Logic ---
    const [selectedClassForEnr, setSelectedClassForEnr] = useState<string>('');
    const [isBulkModalOpen, setBulkModalOpen] = useState(false);
    const [enrSearch, setEnrSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const filteredEnrollments = enrollments.filter(e => e.courseClassId === selectedClassForEnr);
    
    // Students NOT in the selected class
    const availableStudents = students.filter(s => 
        !filteredEnrollments.some(e => e.userId === s.id) &&
        (s.fullName.toLowerCase().includes(enrSearch.toLowerCase()) || s.studentCode.toLowerCase().includes(enrSearch.toLowerCase()))
    );

    const openBulkModal = () => {
        if (!selectedClassForEnr) {
            alert('Vui lòng chọn một lớp học trước!');
            return;
        }
        setSelectedStudents([]);
        setEnrSearch('');
        setBulkModalOpen(true);
    };

    const toggleStudentSelection = (id: string) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sid => sid !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const submitBulkEnroll = async () => {
        if (selectedStudents.length === 0) return;
        const cls = classes.find(c => c.id === selectedClassForEnr);
        if (!cls) return;

        try {
            await axios.post('https://localhost:7134/api/Enrollments/bulk', {
                userIds: selectedStudents,
                courseId: cls.courseId,
                courseClassId: cls.id
            }, authHeaders);
            fetchData();
            setBulkModalOpen(false);
            alert(`Đã thêm thành công ${selectedStudents.length} học viên!`);
        } catch (err) {
            alert('Lỗi khi thêm học viên!');
        }
    };

    const removeEnrollment = async (id: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa học viên khỏi lớp này?")) return;
        try {
            await axios.delete(`https://localhost:7134/api/Enrollments/${id}`, authHeaders);
            fetchData();
        } catch (err) {
            alert('Lỗi khi xóa!');
        }
    };

    // --- Render Helpers ---
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (managingCourse) {
        return <CourseContentManager 
            courseId={managingCourse.id} 
            courseTitle={managingCourse.title} 
            onBack={() => setManagingCourse(null)} 
        />;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-header-title">
                    <GraduationCap size={28} />
                    <h1>Hệ thống Quản lý (Admin)</h1>
                </div>
                <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </header>

            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <button className={`nav-btn ${activeTab === 'Courses' ? 'active' : ''}`} onClick={() => setActiveTab('Courses')}>
                        <BookOpen size={20} /> Khóa học
                    </button>
                    <button className={`nav-btn ${activeTab === 'Classes' ? 'active' : ''}`} onClick={() => setActiveTab('Classes')}>
                        <Users size={20} /> Lớp học & GV
                    </button>
                    <button className={`nav-btn ${activeTab === 'Enrollments' ? 'active' : ''}`} onClick={() => setActiveTab('Enrollments')}>
                        <GraduationCap size={20} /> Học viên
                    </button>
                </aside>

                <main className="admin-main">
                    {/* ===== TAB: KHOA HOC ===== */}
                    {activeTab === 'Courses' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h2>Danh sách Khóa học</h2>
                                <button className="add-btn" onClick={() => openCourseModal()}><Plus size={18}/> Thêm khóa học</button>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ảnh</th>
                                        <th>Tên khóa học</th>
                                        <th>Mô tả</th>
                                        <th className="actions-col">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.id}>
                                            <td>{c.imageUrl && <img src={`https://localhost:7134${c.imageUrl}`} alt={c.title} className="table-img" />}</td>
                                            <td className="fw-bold">{c.title}</td>
                                            <td className="text-truncate">{c.description}</td>
                                            <td className="actions-cell">
                                                <button className="icon-btn content" title="Quản lý Nội dung" onClick={() => setManagingCourse(c)}><FolderTree size={16}/></button>
                                                <button className="icon-btn edit" title="Sửa" onClick={() => openCourseModal(c)}><Edit2 size={16}/></button>
                                                <button className="icon-btn delete" title="Xóa" onClick={() => deleteCourse(c.id)}><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ===== TAB: LOP HOC ===== */}
                    {activeTab === 'Classes' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h2>Danh sách Lớp học</h2>
                                <button className="add-btn" onClick={() => openClassModal()}><Plus size={18}/> Thêm lớp học</button>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Tên lớp</th>
                                        <th>Thuộc Khóa học</th>
                                        <th>CT Đào tạo</th>
                                        <th>Giảng viên</th>
                                        <th className="actions-col">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map(c => (
                                        <tr key={c.id}>
                                            <td className="fw-bold">{c.name}</td>
                                            <td>{c.courseName}</td>
                                            <td><span className="badge-gray">{c.trainingProgramName}</span></td>
                                            <td>
                                                {c.teacherName ? (
                                                    <span className="badge-blue">{c.teacherName}</span>
                                                ) : (
                                                    <span className="text-muted">Chưa gán</span>
                                                )}
                                            </td>
                                            <td className="actions-cell">
                                                <button className="icon-btn edit" onClick={() => openClassModal(c)}><Edit2 size={16}/></button>
                                                <button className="icon-btn delete" onClick={() => deleteClass(c.id)}><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ===== TAB: HOC VIEN ===== */}
                    {activeTab === 'Enrollments' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h2>Quản lý Học viên</h2>
                            </div>
                            <div className="filter-bar">
                                <label>Chọn Lớp học:</label>
                                <select 
                                    value={selectedClassForEnr} 
                                    onChange={e => setSelectedClassForEnr(e.target.value)}
                                    className="class-selector"
                                >
                                    <option value="">-- Chọn một lớp học --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.courseName})</option>)}
                                </select>

                                {selectedClassForEnr && (
                                    <button className="add-btn bulk-add" onClick={openBulkModal}>
                                        <Users size={18}/> Thêm nhiều học viên
                                    </button>
                                )}
                            </div>

                            {selectedClassForEnr ? (
                                <table className="admin-table mt-4">
                                    <thead>
                                        <tr>
                                            <th>Tên Học viên</th>
                                            <th>Ngày tham gia</th>
                                            <th className="actions-col">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEnrollments.length === 0 ? (
                                            <tr><td colSpan={3} className="text-center text-muted">Chưa có học viên nào trong lớp này.</td></tr>
                                        ) : (
                                            filteredEnrollments.map(e => (
                                                <tr key={e.id}>
                                                    <td className="fw-bold">{e.userName}</td>
                                                    <td>{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                                                    <td className="actions-cell">
                                                        <button className="icon-btn delete" onClick={() => removeEnrollment(e.id)}><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="empty-selection">
                                    <p>Vui lòng chọn một lớp học để xem và thêm học viên.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* MODALS */}
            {isCourseModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingCourse ? 'Sửa Khóa học' : 'Thêm Khóa học mới'}</h3>
                        <form onSubmit={saveCourse}>
                            <div className="form-group">
                                <label>Tên khóa học *</label>
                                <input required value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea rows={4} value={courseDesc} onChange={e => setCourseDesc(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Ảnh đại diện (Tùy chọn)</label>
                                <div className="file-input-wrapper">
                                    <Upload size={18} />
                                    <input type="file" onChange={e => setCourseFile(e.target.files?.[0] || null)} accept="image/*" />
                                </div>
                                {editingCourse?.imageUrl && !courseFile && <small>Đã có ảnh. Chọn file mới để thay thế.</small>}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setCourseModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isClassModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingClass ? 'Sửa Lớp học' : 'Thêm Lớp học mới'}</h3>
                        <form onSubmit={saveClass}>
                            <div className="form-group">
                                <label>Tên lớp *</label>
                                <input required value={className} onChange={e => setClassName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Khóa học *</label>
                                <select required value={classCourseId} onChange={e => setClassCourseId(e.target.value)}>
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Chương trình đào tạo *</label>
                                <select required value={classProgramId} onChange={e => setClassProgramId(e.target.value)}>
                                    <option value="">-- Chọn CTĐT --</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Giảng viên phụ trách</label>
                                <select value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)}>
                                    <option value="">-- Không có --</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setClassModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBulkModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content bulk-modal">
                        <h3>Thêm học viên vào lớp</h3>
                        
                        <div className="search-student">
                            <Search size={18} />
                            <input 
                                placeholder="Tìm theo tên hoặc mã SV..." 
                                value={enrSearch}
                                onChange={e => setEnrSearch(e.target.value)}
                            />
                        </div>

                        <div className="student-list-container">
                            {availableStudents.length === 0 ? (
                                <p className="text-muted text-center p-3">Không có học viên nào phù hợp hoặc tất cả đã tham gia.</p>
                            ) : (
                                availableStudents.map(s => {
                                    const isSelected = selectedStudents.includes(s.id);
                                    return (
                                        <div 
                                            key={s.id} 
                                            className={`student-select-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleStudentSelection(s.id)}
                                        >
                                            {isSelected ? <CheckSquare className="checkbox-icon checked" /> : <Square className="checkbox-icon" />}
                                            <div className="student-info">
                                                <strong>{s.fullName}</strong>
                                                <span>{s.studentCode}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="modal-actions mt-3">
                            <span className="selected-count">Đã chọn: {selectedStudents.length}</span>
                            <div className="action-btns">
                                <button type="button" className="btn-cancel" onClick={() => setBulkModalOpen(false)}>Hủy</button>
                                <button type="button" className="btn-save" onClick={submitBulkEnroll} disabled={selectedStudents.length === 0}>
                                    Thêm vào lớp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Admin;
