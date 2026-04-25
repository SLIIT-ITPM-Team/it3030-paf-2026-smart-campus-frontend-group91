import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function callbackToken(searchParams) {
  return (
    searchParams.get('accessToken') ||
    searchParams.get('token') ||
    searchParams.get('jwt') ||
    null
  );
}

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const complete = async () => {
      const providerError = searchParams.get('error');
      if (providerError) {
        if (mounted) {
          setError('Google sign-in was cancelled or failed.');
        }
        return;
      }

      try {
        await completeOAuthCallback(callbackToken(searchParams));
        navigate('/dashboard', { replace: true });
      } catch (callbackError) {
        if (mounted) {
          setError('Unable to complete Google login. Please use email login.');
        }
      }
    };

    complete();

    return () => {
      mounted = false;
    };
  }, [completeOAuthCallback, navigate, searchParams]);

  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100svh',
    gap: '20px',
    background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  };

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={{ fontSize: '40px' }}>⚠️</div>
        <p style={{ fontSize: '16px', fontWeight: 500, margin: 0, textAlign: 'center', maxWidth: '320px' }}>{error}</p>
        <a href="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}>Back to Login</a>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'oauth-spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '17px', fontWeight: 500, margin: 0 }}>Completing Google sign-in...</p>
      <style>{`@keyframes oauth-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OAuthCallbackPage;

