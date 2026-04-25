import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

interface AuthResponse {
  token: string;
  expiration: string;
  fullName: string;
  email: string;
  roles: string[];
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post<AuthResponse>('https://localhost:7134/api/Users/login', {
        email,
        password
      });

      // Handle both camelCase and PascalCase (just in case .NET serializers differ)
      const data: any = response.data;
      const token = data.token || data.Token;
      const fullName = data.fullName || data.FullName;
      const userEmail = data.email || data.Email;
      const roles = data.roles || data.Roles || [];

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userFullName', fullName || '');
        localStorage.setItem('userEmail', userEmail || '');
        localStorage.setItem('userRoles', JSON.stringify(roles));

        // Navigate based on roles
        if (roles.includes('Admin')) {
          navigate('/admin');
        } else if (roles.includes('Teacher')) {
          navigate('/teacher');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg('Invalid response from server.');
      }
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 401) {
          setErrorMsg('Invalid credentials. Please check your email and password.');
        } else {
          setErrorMsg(error.response.data?.message || 'Server error occurred during login.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        setErrorMsg('Cannot reach the server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setErrorMsg('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to LMS</p>
        </div>

        {errorMsg && (
          <div className="login-error-alert">
            {errorMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? <span className="login-loader"></span> : 'Sign In'}
          </button>
        </form>

        <div className="back-to-home">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
