// src/hooks/useAuthService.js
import { useState } from 'react';
import { 
  signUp, 
  confirmSignUp, 
  signIn, 
  resetPassword, 
  confirmResetPassword,
  resendSignUpCode,
  updatePassword,
  updateUserAttributes
} from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';

export const useAuthService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { checkAuthState } = useAuth();

  const clearError = () => setError(null);

  const handleSignUp = async (email, password, attributes = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { user } = await signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: attributes.firstName || '',
          family_name: attributes.lastName || '',
          ...attributes
        }
      });

      return { success: true, user };
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (email, confirmationCode) => {
    try {
      setLoading(true);
      setError(null);

      await confirmSignUp({
        username: email,
        confirmationCode
      });

      return { success: true };
    } catch (err) {
      console.error('Confirm sign up error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password
      });

      if (isSignedIn) {
        await checkAuthState();
        return { success: true };
      } else {
        return { success: false, nextStep };
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      await resetPassword({ username: email });
      return { success: true };
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (email, confirmationCode, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword
      });

      return { success: true };
    } catch (err) {
      console.error('Confirm reset password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmationCode = async (email) => {
    try {
      setLoading(true);
      setError(null);

      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (err) {
      console.error('Resend confirmation code error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await updatePassword({
        oldPassword,
        newPassword
      });

      return { success: true };
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (attributes) => {
    try {
      setLoading(true);
      setError(null);

      await updateUserAttributes({
        userAttributes: attributes
      });

      await checkAuthState(); // Refresh user data
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signIn: handleSignIn,
    resetPassword: handleResetPassword,
    confirmResetPassword: handleConfirmResetPassword,
    resendConfirmationCode: handleResendConfirmationCode,
    updatePassword: handleUpdatePassword,
    updateProfile: handleUpdateProfile
  };
};