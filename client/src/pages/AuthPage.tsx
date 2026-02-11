import React from 'react';
import { Link } from 'react-router-dom';
import { AuthScreen } from '../components/auth/AuthScreen';

export const AuthPage: React.FC = () => {
  return (
    <div className="auth-page">
      <Link to="/" className="auth-logo">
        STREAM
      </Link>
      <AuthScreen />
    </div>
  );
};
