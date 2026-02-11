import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OAuthButtons } from './OAuthButtons';
import { clearError, fetchUser } from '../../redux/slices/authSlice';
import { RootState } from '../../store';

type Tab = 'login' | 'register';

export const AuthScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState<Tab>('login');

  useEffect(() => {
    dispatch(fetchUser() as any);
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, tab]);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (loading && !user) {
    return (
      <div className="auth-card">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <p>Welcome back, {user.displayName || user.email}</p>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => setTab('login')}
          disabled={tab === 'login'}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
          onClick={() => setTab('register')}
          disabled={tab === 'register'}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {tab === 'login' ? <LoginForm /> : <RegisterForm />}

      <div className="auth-divider">or continue with</div>
      <OAuthButtons />
    </div>
  );
};
