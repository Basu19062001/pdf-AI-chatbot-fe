import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { InlineMessage } from '../components/common/InlineMessage';
import { TextField } from '../components/forms/TextField';
import { useAuth } from '../hooks/useAuth';
import { signupSchema } from '../utils/validation';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, getApiErrorMessage } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    },
  });

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
      <div className="auth-card__header">
        <p className="eyebrow">Signup</p>
        <h2>Create a secure account</h2>
        <p>
          Passwords must be at least 12 characters and include upper, lower, numeric,
          and special characters to match backend validation.
        </p>
      </div>

      {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Full name"
          name="full_name"
          register={register}
          error={errors.full_name}
          placeholder="Ava Sharma"
          autoComplete="name"
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="ava@example.com"
          autoComplete="email"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password}
          placeholder="Create a strong password"
          autoComplete="new-password"
        />

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-card__footer">
        Already have an account? <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

