import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const configService = new ConfigService();

    const isProduction = configService.getOrThrow('NODE_ENV') === 'production';

    const transports: winston.transport[] = [];

    const timeStampFormat = () => {
      return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
      });
    };

    if (!isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.simple(),
            winston.format.timestamp({ format: timeStampFormat }),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} | ${level} - ${message}`;
            }),
          ),
        }),
      );
    } else {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: 'logs/%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp({ format: timeStampFormat }),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} ${level} ${message}`;
            }),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({ level: 'info', transports });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(`${message} - ${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }
  debug?(message: string) {
    this.logger.debug(message);
  }

  verbose?(message: string) {
    this.logger.verbose(message);
  }
}
