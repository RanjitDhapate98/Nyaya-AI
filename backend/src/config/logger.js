const winston = require('winston');

const level = process.env.LOG_LEVEL || 'info';
const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level,
  format: isProd
    ? winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level: lvl, message, stack, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${lvl}: ${stack || message}${extra}`;
        }),
      ),
  defaultMeta: isProd ? { service: 'nyaya-backend' } : undefined,
  transports: [new winston.transports.Console()],
});

// Stream for morgan HTTP logs.
logger.stream = { write: (msg) => logger.info(msg.trim()) };

module.exports = logger;
