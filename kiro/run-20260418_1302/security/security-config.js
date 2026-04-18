// security/security-config.js
export const securityConfig = {
  // Authentication
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    }
  },

  // Rate limiting
  rateLimiting: {
    windowSize: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    maxLoginAttempts: 5,
    maxPasswordResets: 3
  },

  // File uploads
  fileUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain'
    ],
    scanForMalware: true
  },

  // Data classification
  dataClassification: {
    retentionPeriods: {
      personal: 365 * 24 * 60 * 60 * 1000, // 1 year
      sensitive: 90 * 24 * 60 * 60 * 1000, // 90 days
      public: 5 * 365 * 24 * 60 * 60 * 1000 // 5 years
    },
    encryptionRequired: ['personal', 'sensitive']
  },

  // Monitoring
  monitoring: {
    enableRealTimeAlerts: true,
    alertThresholds: {
      failedLogins: 5,
      suspiciousRequests: 10,
      dataExfiltration: 1
    },
    logRetention: 90 * 24 * 60 * 60 * 1000 // 90 days
  },

  // Compliance
  compliance: {
    gdprEnabled: true,
    hipaaEnabled: false,
    sox404Enabled: true,
    auditLogRetention: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
  }
};