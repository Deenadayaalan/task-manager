// security/security-monitor.js
export class SecurityMonitor {
  static THREAT_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  static suspiciousPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i, // SQL injection
    /(\bUNION\b.*\bSELECT\b)/i,
    /(<script[^>]*>.*?<\/script>)/i, // XSS
    /(\bon\w+\s*=)/i, // Event handlers
    /(\bjavascript:)/i, // JavaScript protocol
    /(\.\.\/){2,}/i, // Path traversal
    /(\beval\s*\()/i, // Code injection
    /(\bexec\s*\()/i
  ];

  static async detectThreat(request, response) {
    const threats = [];
    
    // Check for suspicious patterns
    const suspiciousContent = this.checkSuspiciousPatterns(request);
    if (suspiciousContent.length > 0) {
      threats.push({
        type: 'SUSPICIOUS_CONTENT',
        level: this.THREAT_LEVELS.HIGH,
        details: suspiciousContent
      });
    }

    // Check for unusual request patterns
    const unusualPatterns = await this.checkUnusualPatterns(request);
    if (unusualPatterns.length > 0) {
      threats.push({
        type: 'UNUSUAL_PATTERNS',
        level: this.THREAT_LEVELS.MEDIUM,
        details: unusualPatterns
      });
    }

    // Check for brute force attempts
    const bruteForce = await this.checkBruteForce(request);
    if (bruteForce) {
      threats.push({
        type: 'BRUTE_FORCE',
        level: this.THREAT_LEVELS.HIGH,
        details: bruteForce
      });
    }

    if (threats.length > 0) {
      await this.handleThreats(threats, request);
    }

    return threats;
  }

  static checkSuspiciousPatterns(request) {
    const suspicious = [];
    const content = JSON.stringify(request.body) + JSON.stringify(request.query);
    
    this.suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        suspicious.push({
          pattern: pattern.source,
          match: content.match(pattern)?.[0]
        });
      }
    });

    return suspicious;
  }

  static async checkUnusualPatterns(request) {
    const unusual = [];
    const clientId = request.ip;
    
    // Check request frequency
    const requestCount = await this.getRequestCount(clientId, 60000); // 1 minute
    if (requestCount > 60) {
      unusual.push({
        type: 'HIGH_FREQUENCY',
        count: requestCount
      });
    }

    // Check for unusual user agents
    const userAgent = request.headers['user-agent'];
    if (!userAgent || this.isUnusualUserAgent(userAgent)) {
      unusual.push({
        type: 'UNUSUAL_USER_AGENT',
        userAgent
      });
    }

    return unusual;
  }

  static async checkBruteForce(request) {
    if (request.path !== '/login') return null;
    
    const clientId = request.ip;
    const failedAttempts = await this.getFailedLoginAttempts(clientId, 300000); // 5 minutes
    
    if (failedAttempts > 5) {
      return {
        attempts: failedAttempts,
        timeWindow: '5 minutes'
      };
    }

    return null;
  }

  static async handleThreats(threats, request) {
    const highestThreat = threats.reduce((max, threat) => 
      this.getThreatScore(threat.level) > this.getThreatScore(max.level) ? threat : max
    );

    const incident = {
      id: this.generateIncidentId(),
      timestamp: new Date().toISOString(),
      clientId: request.ip,
      userAgent: request.headers['user-agent'],
      path: request.path,
      method: request.method,
      threats,
      severity: highestThreat.level
    };

    // Log incident
    await this.logSecurityIncident(incident);

    // Take action based on severity
    switch (highestThreat.level) {
      case this.THREAT_LEVELS.CRITICAL:
        await this.blockClient(request.ip, 3600000); // 1 hour
        await this.sendCriticalAlert(incident);
        break;
      case this.THREAT_LEVELS.HIGH:
        await this.blockClient(request.ip, 900000); // 15 minutes
        await this.sendHighAlert(incident);
        break;
      case this.THREAT_LEVELS.MEDIUM:
        await this.increaseMonitoring(request.ip);
        break;
    }
  }

  static getThreatScore(level) {
    const scores = {
      [this.THREAT_LEVELS.LOW]: 1,
      [this.THREAT_LEVELS.MEDIUM]: 2,
      [this.THREAT_LEVELS.HIGH]: 3,
      [this.THREAT_LEVELS.CRITICAL]: 4
    };
    return scores[level] || 0;
  }

  static isUnusualUserAgent(userAgent) {
    const commonBots = [
      'curl', 'wget', 'python', 'java', 'go-http-client',
      'scanner', 'bot', 'crawler', 'spider'
    ];
    
    return commonBots.some(bot => 
      userAgent.toLowerCase().includes(bot)
    );
  }

  static generateIncidentId() {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async logSecurityIncident(incident) {
    console.log('SECURITY INCIDENT:', JSON.stringify(incident, null, 2));
    // Send to CloudWatch or security service
  }

  static async blockClient(clientId, duration) {
    // Implement client blocking logic
    console.log(`Blocking client ${clientId} for ${duration}ms`);
  }

  static async sendCriticalAlert(incident) {
    // Send to SNS or alerting service
    console.log('CRITICAL SECURITY ALERT:', incident.id);
  }

  static async sendHighAlert(incident) {
    // Send to SNS or alerting service
    console.log('HIGH SECURITY ALERT:', incident.id);
  }

  static async increaseMonitoring(clientId) {
    // Implement enhanced monitoring
    console.log(`Increased monitoring for client ${clientId}`);
  }

  // Placeholder methods
  static async getRequestCount(clientId, timeWindow) { return 0; }
  static async getFailedLoginAttempts(clientId, timeWindow) { return 0; }
}