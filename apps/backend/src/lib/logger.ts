import winston from 'winston';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'jobsearch-resumeanalyze-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add Sentry transport for error logging
class SentryTransport extends winston.Transport {
  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (info.level === 'error') {
      Sentry.withScope((scope) => {
        scope.setExtra('metadata', info);
        if (info.error instanceof Error) {
          Sentry.captureException(info.error);
        } else {
          Sentry.captureMessage(info.message, 'error');
        }
      });
    }

    callback();
  }
}

logger.add(new SentryTransport());

// Export a wrapper that includes Sentry context
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  error: (message: string, error?: Error, meta?: any) => {
    logger.error(message, { error, ...meta });
    if (error) {
      Sentry.captureException(error, {
        extra: meta,
      });
    }
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
};

// Export Sentry for direct use
export { Sentry }; 