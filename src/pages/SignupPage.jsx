import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { InlineMessage } from '../components/common/InlineMessage';
import { TextField } from '../components/forms/TextField';
import { useAuth } from '../hooks/useAuth';
import { signupSchema } from '../utils/validation';

function getPasswordChecks(password) {
  return [
    {
      label: 'At least 12 characters',
      passed: password.length >= 12,
    },
    {
      label: 'Uppercase and lowercase letters',
      passed: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      label: 'One number and one special character',
      passed: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, getApiErrorMessage } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    },
  });
  const passwordValue = watch('password', '');
  const passwordChecks = getPasswordChecks(passwordValue);
  const hasStartedTypingPassword = passwordValue.length > 0;

  async function onSubmit(values) {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await signup(values);
      navigate('/login?registered=1', { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to create your account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__topbar">
        <span className="auth-card__badge">New account</span>
        <span className="auth-card__microcopy">Secure onboarding</span>
      </div>
      <div className="auth-card__header">
        <p className="eyebrow">Signup</p>
        <h2>Create your PDF workspace account</h2>
        <p>
          Set up a secure account before you start uploading, organizing, and discussing documents.
        </p>
      </div>

      <div className="auth-card__meta">
        <span className="auth-chip">12+ char password</span>
        <span className="auth-chip">Session tracking</span>
      </div>

      {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Full name"
          name="full_name"
          register={register}
          error={errors.full_name}
          placeholder="Enter your full name"
          autoComplete="name"
        />
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
          placeholder="Create a secure password"
          autoComplete="new-password"
        />

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-card__hint auth-card__hint--list">
        <span>Password checklist</span>
        <ul className="auth-checklist">
          {passwordChecks.map((item) => (
            <li
              key={item.label}
              className={`auth-checklist__item ${
                item.passed
                  ? 'auth-checklist__item--passed'
                  : hasStartedTypingPassword
                    ? 'auth-checklist__item--pending'
                    : 'auth-checklist__item--idle'
              }`}
            >
              <span className="auth-checklist__icon" aria-hidden="true">
                {item.passed ? '✓' : '•'}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="auth-card__footer auth-card__footer--row">
        <p>Have an account? <Link to="/login">Sign in</Link></p>
        <span className="auth-card__footer-meta">Private account protection</span>
      </div>
    </div>
  );
}
