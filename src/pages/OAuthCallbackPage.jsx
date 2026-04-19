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

  if (error) {
    return (
      <section id="center">
        <div className="status-card">{error}</div>
      </section>
    );
  }

  return (
    <section id="center">
      <div className="status-card">Completing Google sign-in...</div>
    </section>
  );
};

export default OAuthCallbackPage;

