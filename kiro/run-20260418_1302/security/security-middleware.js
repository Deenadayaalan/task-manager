// security/security-middleware.js
import { AuthSecurity } from './auth-security';
import { InputValidator } from './input-validation';

export class SecurityMiddleware {
  static async authenticateRequest(req, res, next) {
    try {
      const isValidSession = await AuthSecurity.validateSession();
      if (!isValidSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }

  static validateCSRF(req, res, next) {
    const token = req.headers['x-csrf-token'];
    const storedToken = req.session?.csrfToken;
    
    if (!AuthSecurity.validateCSRFToken(token, storedToken)) {
      return res.status(403).json({ error: 'CSRF token validation failed' });
    }
    
    next();
  }

  static rateLimiter = (() => {
    const requests = new Map();
    const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
    const MAX_REQUESTS = 100;

    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!requests.has(clientId)) {
        requests.set(clientId, []);
      }
      
      const clientRequests = requests.get(clientId);
      
      // Remove old requests
      const validRequests = clientRequests.filter(
        timestamp => now - timestamp < WINDOW_SIZE
      );
      
      if (validRequests.length >= MAX_REQUESTS) {
        return res.status(429).json({ 
          error: 'Too many requests',
          retryAfter: Math.ceil(WINDOW_SIZE / 1000)
        });
      }
      
      validRequests.push(now);
      requests.set(clientId, validRequests);
      
      next();
    };
  })();

  static sanitizeInput(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }
    
    next();
  }

  static sanitizeObject(obj) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = InputValidator.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  static securityHeaders(req, res, next) {
    const { securityHeaders } = require('./security-headers');
    
    Object.entries(securityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
    
    next();
  }

  static validateFileUpload(req, res, next) {
    if (!req.file) return next();
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large' });
    }
    
    next();
  }
}