import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';
import {
  consumeGoogleAuthReturnTo,
  getGoogleAuthErrorMessage,
} from '../utils/googleAuth';

export function GoogleAuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin, getApiErrorMessage } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    async function finishGoogleLogin() {
      const errorCode = searchParams.get('error');

      if (errorCode) {
        setErrorMessage(getGoogleAuthErrorMessage(errorCode));
        return;
      }

      try {
        await completeGoogleLogin();
        const returnTo = consumeGoogleAuthReturnTo('/app');

        if (isActive) {
          navigate(returnTo, { replace: true });
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(error, getGoogleAuthErrorMessage('missing_google_session')),
          );
        }
      }
    }

    finishGoogleLogin();

    return () => {
      isActive = false;
    };
  }, [completeGoogleLogin, getApiErrorMessage, navigate, searchParams]);

  return (
    <div className="auth-card">
      <div className="auth-card__topbar">
        <span className="auth-card__badge">Google login</span>
        <span className="auth-card__microcopy">Securing workspace</span>
      </div>
      <div className="auth-card__header">
        <p className="eyebrow">Google</p>
        <h2>Finishing sign-in</h2>
        <p>Hang tight while your Google session is connected to PDF Atlas.</p>
      </div>

      {errorMessage ? (
        <>
          <InlineMessage tone="error">{errorMessage}</InlineMessage>
          <div className="auth-card__footer auth-card__footer--row">
            <p><Link to="/login">Return to login</Link></p>
            <span className="auth-card__footer-meta">Try Google again from the login page</span>
          </div>
        </>
      ) : (
        <div className="auth-progress" aria-live="polite" role="status">
          <span className="auth-progress__spinner" aria-hidden="true" />
          <span>Verifying your Google session...</span>
        </div>
      )}
    </div>
  );
}
