import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <main className="admin-content">
        <p>Welcome to the Admin Area. Here you can manage the application.</p>
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Users</h3>
            <p>Manage user accounts and roles.</p>
          </div>
          <div className="admin-card">
            <h3>Courses</h3>
            <p>Manage course content and assignments.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
