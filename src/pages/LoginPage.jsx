import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authErrorMessage, startGoogleSignIn } from '../api/authService';
import { useAuth } from '../auth/AuthContext';
import Footer from '../components/Footer';

function nextPathFromState(location) {
  const fromState = location.state?.from?.pathname;
  const queryNext = new URLSearchParams(location.search).get('next');
  return fromState || queryNext || '/dashboard';
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => nextPathFromState(location), [location]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      await login({
        // Backward-compatible with existing API payload expectation.
        email: form.username.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      navigate(nextPath, { replace: true });
    } catch (error) {
      setServerError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
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
          <Link to="/register" className="login-nav-link">Register</Link>
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
            <h2>Login</h2>
            <p>Enter your account details to continue.</p>
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
                  autoComplete="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username ? (
                <span className="field-error">{errors.username}</span>
              ) : null}
            </label>

            <label className="auth-field" htmlFor="password">
              Password
              <div className="auth-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Enter your password"
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

            {serverError ? <div className="auth-error">{serverError}</div> : null}

            <button className="login-submit-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Signing in...' : 'Login'}</span>
              <span aria-hidden="true">&rarr;</span>
            </button>

            <button
              className="login-google-btn"
              type="button"
              onClick={startGoogleSignIn}
            >
              Continue with Google
            </button>

            <p className="auth-bottom-text">
              Not Registered? <Link to="/register">Create an account</Link>.
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
