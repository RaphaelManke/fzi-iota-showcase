import * as winston from 'winston';

const { combine, timestamp, printf, colorize, splat } = winston.format;

const myFormat = printf((message) => {
    return `${message.timestamp ? message.timestamp + ' ' : ''}${message.level}: ${message.message}`;
  });

function getFormat(enable: boolean) {
    return enable ? combine(colorize(), timestamp(), splat(), myFormat) : combine(colorize(), splat(), myFormat);
}

export function setTimestamp(enable: boolean) {
    log.format = getFormat(enable);
}

export const log = winston.createLogger({
  format: getFormat(true),
  level: 'debug',
  transports: [
      new winston.transports.Console(),
  ],
});
