// security/auth-security.js
import { Auth } from 'aws-amplify';
import CryptoJS from 'crypto-js';

export class AuthSecurity {
  static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  static MAX_LOGIN_ATTEMPTS = 5;
  static LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  static async validateSession() {
    try {
      const session = await Auth.currentSession();
      const tokenExpiry = session.getAccessToken().getExpiration() * 1000;
      const now = Date.now();
      
      if (tokenExpiry - now < 5 * 60 * 1000) { // Refresh if expires in 5 minutes
        await Auth.currentAuthenticatedUser({ bypassCache: true });
      }
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  static async secureLogout() {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Sign out from Cognito
      await Auth.signOut({ global: true });
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Secure logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  }

  static encryptSensitiveData(data, key) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  }

  static decryptSensitiveData(encryptedData, key) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  static generateCSRFToken() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  static validateCSRFToken(token, storedToken) {
    return token && storedToken && token === storedToken;
  }

  static async checkLoginAttempts(username) {
    const key = `login_attempts_${username}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
    
    const now = Date.now();
    if (now - attempts.lastAttempt > this.LOCKOUT_DURATION) {
      attempts.count = 0;
    }
    
    return attempts.count < this.MAX_LOGIN_ATTEMPTS;
  }

  static recordLoginAttempt(username, success) {
    const key = `login_attempts_${username}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
    
    if (success) {
      localStorage.removeItem(key);
    } else {
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      localStorage.setItem(key, JSON.stringify(attempts));
    }
  }
}