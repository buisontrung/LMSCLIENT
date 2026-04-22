import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrangChu.css';
import axios from 'axios';
// Calendar helper
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Course data
const courses = [
  { id: 1, title: 'Mật mã phần mềm trong thái thường minh...', code: 'ATQT-1-22...', icon: '📚' },
  { id: 2, title: 'Kỹ thuật truyền số liệu - ATSVBV8-1-22...', code: 'ATSVBV8-1-22...', icon: '📡' },
  { id: 3, title: 'Nguyên lý hệ điều hành - ATCCHT7-1-22...', code: 'ATCCHT7-1-22...', icon: '💻' },
  { id: 4, title: 'Điện tử tương tự và điện tử số - ATDVK05-3-22...', code: 'ATDVK05-3-22...', icon: '⚡' },
  { id: 5, title: 'Điện tử tương tự và điện tự số - ATDVK26-3-22...', code: 'ATDVK26-3-22...', icon: '🔌' },
];

// Service data
const services = [
  { icon: '🛡️', label: 'Xác nhận sinh viên' },
  { icon: '📋', label: 'Đăng ký học phần' },
  { icon: '📊', label: 'Kết quả học tập' },
  { icon: '💳', label: 'Thanh toán học phí' },
  { icon: '📝', label: 'Đơn từ - Kiến nghị' },
  { icon: '🎓', label: 'Xét tốt nghiệp' },
];

// QA data
const qaItems = [
  { icon: '📞', title: 'Tuyển sinh', link: 'Xem chi tiết' },
  { icon: '📖', title: 'Chương trình Đào tạo', link: 'Xem chi tiết' },
  { icon: '📑', title: 'Quy chế tổ chức đào tạo, đánh giá và xếp loại học tập', link: 'Xem chi tiết' },
  { icon: '💰', title: 'Học phí và hỗ trợ sinh hoạt, ..', link: 'Xem chi tiết' },
];

function TrangChu() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [courses, setCourses] = useState<any[]>([]);

  // ===== Decode JWT =====
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

  // ===== Fetch Courses =====
  useEffect(() => {
    const fetchCourses = async () => {
      const userId = getUserIdFromToken();
      if (!userId) return;

      try {
        const res = await axios.get(
          `https://localhost:7134/api/Students/${userId}/courses`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        setCourses(res.data);
      } catch (err) {
        console.error("Fetch courses error:", err);
      }
    };

    fetchCourses();
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Build calendar days
  const calendarDays: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    calendarDays.push({ day: d, isCurrentMonth: true, isToday });
  }
  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, isToday: false });
  }

  return (
    <div className="trangchu" id="trangchu-page">
      {/* ===== Thời Khoá Biểu ===== */}
      <section className="tkb-section">
        <div className="tkb-header">
          <h2>Thời Khoá Biểu</h2>
        </div>
        <div className="tkb-content">
          {/* Calendar */}
          <div className="calendar-wrapper">
            <div className="calendar-nav">
              <button onClick={prevMonth} title="Tháng trước">‹</button>
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <button onClick={nextMonth} title="Tháng sau">›</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="day-header">{d}</div>
              ))}
              {calendarDays.map((cell, idx) => (
                <div
                  key={idx}
                  className={`day-cell${cell.isToday ? ' today' : ''}${!cell.isCurrentMonth ? ' other-month' : ''}`}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(cell.day)}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="tkb-detail">
            <h3>Thông tin chi tiết</h3>
            <div className="tkb-detail-content">
              <p>
                Ngày {selectedDate < 10 ? `0${selectedDate}` : selectedDate}/{(currentMonth + 1) < 10 ? `0${currentMonth + 1}` : currentMonth + 1}: Không có lớp Giảng dạy!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Dịch Vụ Công ===== */}
      <section className="dvc-section">
        <div className="section-title">
          <h2>Dịch Vụ Công</h2>
        </div>
        <p className="section-subtitle">Mang đến các dịch vụ giúp sinh viên tiết kiệm được thời gian công sức</p>
        <div className="dvc-grid">
          {services.map((svc, idx) => (
            <div key={idx} className="dvc-card">
              <div className="dvc-card-icon">{svc.icon}</div>
              <span className="dvc-card-label">{svc.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Khoá Học Của Tôi ===== */}
      <section className="courses-section">
        <h2>Khoá Học Của Tôi</h2>

        <div className="courses-grid">
          {courses.length === 0 ? (
            <p>Không có khóa học</p>
          ) : (
            courses.map((course) => (
              <div key={course.courseId} className="course-card">
                <div className="course-card-img">📚</div>
                <div className="course-card-body">
                  <div className="course-card-title">
                    {course.courseName + " - " + course.courseClassName || course.title}
                  </div>
                  <button
                    className="course-card-btn"
                    onClick={() => navigate(`/course/${course.courseId}`)}
                  >
                    Chi tiết →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== Q&A ===== */}
      <section className="qa-section">
        <div className="section-title">
          <h2>Q&A</h2>
        </div>
        <p className="section-subtitle">Giải đáp những thắc mắc và câu hỏi thường gặp</p>
        <div className="qa-grid">
          {qaItems.map((item, idx) => (
            <div key={idx} className="qa-card">
              <div className="qa-card-icon">{item.icon}</div>
              <div className="qa-card-title">{item.title}</div>
              <a href="#" className="qa-card-link">
                {item.link} →
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TrangChu;
