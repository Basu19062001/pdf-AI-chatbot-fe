import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { InlineMessage } from '../components/common/InlineMessage';
import { TextField } from '../components/forms/TextField';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from '../utils/validation';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, getApiErrorMessage } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fromPath = location.state?.from || '/app';
  const showRegisteredMessage = searchParams.get('registered') === '1';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values) {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await login(values);
      navigate(fromPath, { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to sign you in right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__topbar">
        <span className="auth-card__badge">Member access</span>
        <span className="auth-card__microcopy">PDF workspace login</span>
      </div>
      <div className="auth-card__header">
        <p className="eyebrow">Login</p>
        <h2>Open your document workspace</h2>
        <p>Pick up where you left off with your PDFs, extracted notes, and secured sessions.</p>
      </div>

      <div className="auth-card__meta">
        <span className="auth-chip">PDF sessions</span>
        <span className="auth-chip">Token protected</span>
      </div>

      {showRegisteredMessage ? (
        <InlineMessage tone="success">
          Your account is ready. Sign in to start using the app.
        </InlineMessage>
      ) : null}

      {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="Enter your email address"
          autoComplete="email"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password}
          placeholder="Enter your account password"
          autoComplete="current-password"
        />

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-card__hint">
        Secure access is tied to your current device so you can review documents with confidence.
      </p>

      <div className="auth-card__footer auth-card__footer--row">
        <p>New here? <Link to="/signup">Create an account</Link></p>
        <span className="auth-card__footer-meta">Secure workspace access</span>
      </div>
    </div>
  );
}
