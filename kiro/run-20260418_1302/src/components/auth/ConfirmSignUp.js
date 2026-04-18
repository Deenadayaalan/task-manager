// src/components/auth/ConfirmSignUp.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AuthForms.css';

const ConfirmSignUp = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const { confirmSignUp, signUp, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const username = location.state?.username;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await confirmSignUp(username, code);
      navigate('/login', { 
        state: { message: 'Account confirmed! Please sign in.' } 
      });
    } catch (error) {
      console.error('Confirmation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // Resend confirmation code by attempting signup again
      // This will trigger a new code to be sent
      await signUp(username, 'temp', 'temp', 'temp', 'temp');
    } catch (error) {
      // Expected error, but code should be resent
      console.log('Code resent');
    } finally {
      setIsResending(false);
    }
  };

  if (!username) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="error-message">
            No username provided. Please <Link to="/signup">sign up</Link> again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Confirm Your Account</h2>
          <p>We've sent a confirmation code to your email</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="code">Confirmation Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || !code}
          >
            {isLoading ? 'Confirming...' : 'Confirm Account'}
          </button>
        </form>

        <div className="auth-links">
          <button
            type="button"
            className="link-button"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? 'Resending...' : 'Resend Code'}
          </button>
          <span>•</span>
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSignUp;