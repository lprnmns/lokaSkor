/**
 * Error Logging and Monitoring System
 * Provides comprehensive error logging, monitoring, and analytics
 */

import { ApiError, ErrorType } from '../types';
import { ErrorContext, ErrorClassificationResult } from './ErrorClassification';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  error?: ApiError;
  context?: ErrorContext;
  classification?: ErrorClassificationResult;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorRate: number;
  averageResolutionTime: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: ErrorMetrics, recentErrors: LogEntry[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // minutes
  lastTriggered?: Date;
  enabled: boolean;
}

export class ErrorLogger {
  private static logs: LogEntry[] = [];
  private static maxLogSize = 10000;
  private static alertRules: AlertRule[] = [];
  private static listeners: Array<(entry: LogEntry) => void> = [];

  // Initialize default alert rules
  static {
    this.initializeDefaultAlertRules();
  }

  private static initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.errorRate > 0.1, // 10% error rate
        severity: 'high',
        cooldown: 15,
        enabled: true
      },
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        condition: (_, recentErrors) => 
          recentErrors.some(e => e.classification?.severity === 'critical'),
        severity: 'critical',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'network_errors_spike',
        name: 'Network Errors Spike',
        condition: (metrics) => 
          metrics.errorsByType[ErrorType.NETWORK_ERROR] > 10,
        severity: 'medium',
        cooldown: 10,
        enabled: true
      },
      {
        id: 'server_errors_pattern',
        name: 'Server Errors Pattern',
        condition: (metrics) => 
          metrics.errorsByType[ErrorType.SERVER_ERROR] > 5,
        severity: 'high',
        cooldown: 10,
        enabled: true
      },
      {
        id: 'location_errors_frequent',
        name: 'Frequent Location Errors',
        condition: (metrics) => 
          metrics.errorsByType[ErrorType.LOCATION_ERROR] > 20,
        severity: 'medium',
        cooldown: 30,
        enabled: true
      }
    ];
  }

  static log(
    level: LogEntry['level'],
    message: string,
    error?: ApiError,
    context?: ErrorContext,
    classification?: ErrorClassificationResult,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      error,
      context,
      classification,
      stackTrace: error ? this.getStackTrace(error) : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: context?.userId,
      sessionId: context?.sessionId,
      tags: this.generateTags(error, context, classification),
      metadata
    };

    this.addLogEntry(entry);
    this.notifyListeners(entry);
    this.checkAlertRules();

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  static debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, undefined, undefined, undefined, metadata);
  }

  static info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, undefined, undefined, undefined, metadata);
  }

  static warn(message: string, error?: ApiError, context?: ErrorContext): void {
    this.log('warn', message, error, context);
  }

  static error(
    message: string,
    error?: ApiError,
    context?: ErrorContext,
    classification?: ErrorClassificationResult
  ): void {
    this.log('error', message, error, context, classification);
  }

  static fatal(
    message: string,
    error?: ApiError,
    context?: ErrorContext,
    classification?: ErrorClassificationResult
  ): void {
    this.log('fatal', message, error, context, classification);
  }

  static logApiError(
    error: ApiError,
    context: ErrorContext,
    classification: ErrorClassificationResult
  ): void {
    const level = this.mapSeverityToLogLevel(classification.severity);
    this.log(
      level,
      `API Error: ${error.message}`,
      error,
      context,
      classification
    );
  }

  private static addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  private static notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  private static checkAlertRules(): void {
    const now = new Date();
    const recentErrors = this.getRecentErrors(60); // Last 60 minutes
    const metrics = this.getMetrics(60);

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown * 60 * 1000) {
          return;
        }
      }

      // Check condition
      if (rule.condition(metrics, recentErrors)) {
        this.triggerAlert(rule, metrics, recentErrors);
        rule.lastTriggered = now;
      }
    });
  }

  private static triggerAlert(
    rule: AlertRule,
    metrics: ErrorMetrics,
    recentErrors: LogEntry[]
  ): void {
    const alertMessage = `Alert: ${rule.name} (${rule.severity})`;
    
    this.log('error', alertMessage, undefined, undefined, undefined, {
      alertRule: rule.id,
      metrics,
      recentErrorCount: recentErrors.length
    });

    // Send alert to external monitoring service
    this.sendAlert(rule, metrics, recentErrors);
  }

  private static sendAlert(
    rule: AlertRule,
    metrics: ErrorMetrics,
    recentErrors: LogEntry[]
  ): void {
    // This would integrate with external alerting services
    // For now, just console log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 ALERT: ${rule.name}`, {
        severity: rule.severity,
        metrics,
        recentErrorCount: recentErrors.length
      });
    }
  }

  static getMetrics(timeRangeMinutes: number = 60): ErrorMetrics {
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRangeMinutes * 60 * 1000);
    
    const relevantLogs = this.logs.filter(log => 
      log.timestamp >= startTime && log.error
    );

    const totalErrors = relevantLogs.length;
    const totalRequests = this.getTotalRequests(timeRangeMinutes);
    
    const errorsByType: Record<ErrorType, number> = {
      [ErrorType.NETWORK_ERROR]: 0,
      [ErrorType.SERVER_ERROR]: 0,
      [ErrorType.VALIDATION_ERROR]: 0,
      [ErrorType.TIMEOUT_ERROR]: 0,
      [ErrorType.LOCATION_ERROR]: 0,
      [ErrorType.UNKNOWN_ERROR]: 0
    };

    const errorsBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const errorsByCategory: Record<string, number> = {
      user: 0,
      system: 0,
      network: 0,
      business: 0,
      security: 0
    };

    const errorCounts: Record<string, number> = {};

    relevantLogs.forEach(log => {
      if (log.error) {
        errorsByType[log.error.type]++;
      }
      
      if (log.classification) {
        errorsBySeverity[log.classification.severity]++;
        errorsByCategory[log.classification.category]++;
      }

      const errorKey = log.error?.message || log.message;
      errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({
        message,
        count,
        lastOccurrence: relevantLogs
          .filter(log => (log.error?.message || log.message) === message)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
          ?.timestamp || now
      }));

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      errorsByCategory,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      averageResolutionTime: this.calculateAverageResolutionTime(relevantLogs),
      topErrors,
      timeRange: {
        start: startTime,
        end: now
      }
    };
  }

  static getRecentErrors(timeRangeMinutes: number = 60): LogEntry[] {
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRangeMinutes * 60 * 1000);
    
    return this.logs.filter(log => 
      log.timestamp >= startTime && 
      (log.level === 'error' || log.level === 'fatal')
    );
  }

  static getLogs(
    filters?: {
      level?: LogEntry['level'];
      timeRange?: { start: Date; end: Date };
      errorType?: ErrorType;
      userId?: string;
      tags?: string[];
    }
  ): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      
      if (filters.timeRange) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filters.timeRange!.start && 
          log.timestamp <= filters.timeRange!.end
        );
      }
      
      if (filters.errorType) {
        filteredLogs = filteredLogs.filter(log => 
          log.error?.type === filters.errorType
        );
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => 
          log.userId === filters.userId
        );
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.tags?.some(tag => filters.tags!.includes(tag))
        );
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static addListener(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv();
    }
    return JSON.stringify(this.logs, null, 2);
  }

  private static exportToCsv(): string {
    const headers = [
      'timestamp', 'level', 'message', 'errorType', 'errorCode',
      'userId', 'sessionId', 'url', 'tags'
    ];
    
    const rows = this.logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.message,
      log.error?.type || '',
      log.error?.code || '',
      log.userId || '',
      log.sessionId || '',
      log.url || '',
      log.tags?.join(';') || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getStackTrace(error: any): string | undefined {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    if (error.stack) {
      return error.stack;
    }
    return undefined;
  }

  private static generateTags(
    error?: ApiError,
    context?: ErrorContext,
    classification?: ErrorClassificationResult
  ): string[] {
    const tags: string[] = [];

    if (error) {
      tags.push(`error:${error.type}`);
      tags.push(`code:${error.code}`);
    }

    if (context) {
      tags.push(`operation:${context.operation}`);
      if (context.retryCount) {
        tags.push(`retry:${context.retryCount}`);
      }
    }

    if (classification) {
      tags.push(`severity:${classification.severity}`);
      tags.push(`category:${classification.category}`);
      if (classification.retryable) {
        tags.push('retryable');
      }
    }

    return tags;
  }

  private static mapSeverityToLogLevel(severity: string): LogEntry['level'] {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  private static consoleLog(entry: LogEntry): void {
    const logMethod = entry.level === 'debug' ? console.debug :
                     entry.level === 'info' ? console.info :
                     entry.level === 'warn' ? console.warn :
                     console.error;

    logMethod(`[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`, {
      error: entry.error,
      context: entry.context,
      classification: entry.classification,
      metadata: entry.metadata
    });
  }

  private static sendToExternalService(entry: LogEntry): void {
    // This would send logs to external services like Sentry, LogRocket, etc.
    // For now, just a placeholder
    if (entry.level === 'error' || entry.level === 'fatal') {
      // Send to error tracking service
    }
  }

  private static getTotalRequests(timeRangeMinutes: number): number {
    // This would track total API requests
    // For now, estimate based on error logs
    return this.logs.filter(log => 
      log.timestamp >= new Date(Date.now() - timeRangeMinutes * 60 * 1000)
    ).length * 10; // Rough estimate
  }

  private static calculateAverageResolutionTime(logs: LogEntry[]): number {
    // This would calculate actual resolution times
    // For now, return a placeholder
    return 5000; // 5 seconds average
  }
}