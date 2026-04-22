import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Footer from '../components/Footer';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    }

    if (!form.role) {
      nextErrors.role = 'Role is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setApiError('');
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/login');
      }, 900);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please try again.';
      setApiError(message);
    }
  };

  return (
    <div className="login-page auth-page">
      <header className="login-navbar">
        <div className="login-brand">
          <span className="login-brand-mark">SC</span>
          <Link to="/" className="login-brand-name brand-link">
            Smart Campus Hub
          </Link>
        </div>

        <nav className="login-nav-links" aria-label="Public navigation">
          <Link to="/" className="login-nav-link">Home</Link>
          <Link to="/login" className="login-nav-link">Login</Link>
        </nav>

        <div className="login-nav-actions">
          <Link to="/register" className="login-btn login-btn-primary">
            Register
          </Link>
          <Link to="/login" className="login-btn login-btn-outline">
            Login
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-page-card fade-in">
          <div className="login-heading">
            <h2>Create Account</h2>
            <p>Register your smart campus profile to get started.</p>
            <span className="login-heading-accent" />
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="auth-field" htmlFor="username">
              Username
              <div className="auth-input-wrap">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={onChange}
                  placeholder="Choose a username"
                />
              </div>
              {errors.username ? (
                <span className="field-error">{errors.username}</span>
              ) : null}
            </label>

            <label className="auth-field" htmlFor="email">
              Email
              <div className="auth-input-wrap">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@campus.edu"
                />
              </div>
              {errors.email ? (
                <span className="field-error">{errors.email}</span>
              ) : null}
            </label>

            <label className="auth-field" htmlFor="password">
              Password
              <div className="auth-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="password-visibility-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? (
                <span className="field-error">{errors.password}</span>
              ) : null}
            </label>

            {/* <label className="auth-field" htmlFor="role">
              Role
              <div className="auth-input-wrap">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  className="auth-select"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TECHNICIAN">TECHNICIAN</option>
                </select>
              </div>
              {errors.role ? <span className="field-error">{errors.role}</span> : null}
            </label> */}

            {submitted ? (
              <div className="auth-success">
                Account created! Redirecting to login...
              </div>
            ) : null}

            {apiError ? (
              <div className="field-error" style={{ marginBottom: '8px' }}>{apiError}</div>
            ) : null}

            <button className="login-submit-btn" type="submit">
              <span>Register</span>
              <span aria-hidden="true">&rarr;</span>
            </button>

            <p className="auth-bottom-text">
              Already have an account? <Link to="/login">Login</Link>.
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
