import winston from 'winston';
import 'winston-daily-rotate-file';
BigInt.prototype.toJSON = function () {
  return this.toString();
};
const { format } = winston;
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    // winston.format.timestamp(),
    // // winston.format.label({ label: 'CUSTOM', message: true }),
    // winston.format.splat()
    format.timestamp(),
    format.prettyPrint(),
    // format.splat(),
    format.printf((info) => {
      if (typeof info.message === 'object') {
        info.message = JSON.stringify(info.message, null, 3);
      }

      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  //winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production1') {
  logger.add(new winston.transports.Console());
}

export default logger;
