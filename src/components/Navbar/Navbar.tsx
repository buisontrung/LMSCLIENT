import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const navTabs = [
  { label: 'TRANG CHỦ', path: '/' },
  { label: 'HỌC TẬP', path: '/hoc-tap' },
  { label: 'ĐỒ ÁN', path: '/do-an' },
  { label: 'NGHỈ/VẮNG/PHÉP', path: '/nghi-vang-phep' },
  { label: 'ĐIỀU MẪU', path: '/dieu-mau' },
  { label: 'HỌC BỔNG', path: '/hoc-bong' },
  { label: 'HỢP TÁC QT', path: '/hop-tac-qt' },
  { label: 'LIÊN KẾT', path: '/lien-ket' },
];

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar" id="main-navbar">
      {/* Top Bar */}
      <div className="navbar-top">
        <div className="navbar-brand">
          <div className="navbar-logo">
            KMA
          </div>
          <div className="navbar-title">
            <span className="navbar-title-main">HỆ THỐNG QUẢN TRỊ ĐẠI HỌC TRỰC TUYẾN</span>
            <span className="navbar-title-sub">HỌC VIỆN KỸ THUẬT MẬT MÃ · KHOA CÔNG NGHỆ THÔNG TIN</span>
          </div>
        </div>

        <div className="navbar-actions">
          <button className="navbar-icon-btn" title="Thông báo">
            🔔
            <span className="badge">2</span>
          </button>
          <div className="navbar-avatar-container">
            <div className="navbar-avatar" title="Tài khoản">
              SV
            </div>
            <div className="navbar-dropdown">
              <button onClick={() => navigate('/profile')} className="dropdown-item">Profile</button>
              <button onClick={handleLogout} className="dropdown-item text-danger">Logout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navbar-nav">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
        {(JSON.parse(localStorage.getItem('userRoles') || '[]').includes('Teacher') || 
          JSON.parse(localStorage.getItem('userRoles') || '[]').includes('Admin')) && (
          <NavLink
            to="/teacher/grading"
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', marginLeft: '10px', paddingLeft: '15px' }}
          >
            CHẤM ĐIỂM
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
