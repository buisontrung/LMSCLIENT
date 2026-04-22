import './Footer.css';

function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-main">
        {/* Column 1: Address */}
        <div className="footer-section">
          <h3>ĐỊA CHỈ LIÊN HỆ</h3>
          <div className="footer-logo-area">
            <div className="footer-logo">KMA</div>
          </div>
          <div className="footer-address">
            <p><strong>Cơ quan chủ quản:</strong> Học viện Kỹ thuật Mật mã</p>
            <p>Số 141 Đường Chiến Thắng - Phường Tân Triều</p>
            <p>Thanh Trì - Hà Nội</p>
            <p style={{ marginTop: '10px' }}><strong>Phân hiệu:</strong> Học viện Kỹ thuật Mật mã tại TP. Hồ Chí Minh</p>
            <p>Số 17A Công Lễ</p>
            <p>Phường Tân Sơn Nhất, TP. Hồ Chí Minh</p>
          </div>
        </div>

        {/* Column 2: Contact Info */}
        <div className="footer-section">
          <h3>THÔNG TIN LIÊN HỆ</h3>
          <div className="footer-contact">
            <p>Trụ sở chính: 024.38.543.254</p>
            <p>Fax: 024.38.543.854</p>
            <p style={{ marginTop: '10px' }}>Phân hiệu Hồ Chí Minh</p>
            <p>028.62.933.536 - Fax: 028.62.933.536</p>
            <p style={{ marginTop: '10px' }}>
              Website: <a href="https://actvn.edu.vn" target="_blank" rel="noopener noreferrer">https://actvn.edu.vn</a>
            </p>
            <p>
              Email: <a href="mailto:support@actvnedu.vn">support@actvnedu.vn</a>
            </p>
          </div>
        </div>

        {/* Column 3: Links */}
        <div className="footer-section">
          <h3>LIÊN KẾT</h3>
          <div className="footer-links-list">
            <a href="#">Cổng thông tin và Vận hành</a>
            <a href="#">Trung tâm Thông tin Thư viện</a>
          </div>
          <div className="footer-app-badges">
            <a href="#" className="app-badge">
              <span className="app-badge-icon">▶</span>
              <span className="app-badge-text">
                <small>GET IT ON</small>
                Google Play
              </span>
            </a>
            <a href="#" className="app-badge">
              <span className="app-badge-icon">🍎</span>
              <span className="app-badge-text">
                <small>Download on the</small>
                App Store
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>HỌC VIỆN KỸ THUẬT MẬT MÃ - ACADEMY OF CRYPTOGRAPHY TECHNIQUES</p>
      </div>
    </footer>
  );
}

export default Footer;
