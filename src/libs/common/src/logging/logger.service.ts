import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  logQuery(query: string, variables?: any) {
    const dateTime = utcToAsiaJakarta(new Date());
    console.log(`[${dateTime}] GraphQL Query / Mutation hit: ${query}`);

    const sanitizedData = this.sanitizeSensitiveData(variables);

    if (variables) {
      console.log(
        `[${dateTime}] With Variables: ${JSON.stringify(sanitizedData)}`,
      );
    }
  }

  logError(logData: any) {
    const { query, variables, error } = logData;
    const dateTime = utcToAsiaJakarta(new Date());
    const sanitizedData = this.sanitizeSensitiveData(variables);

    console.error(`[${dateTime}] Error during GraphQL execution: ${query}, `, {
      variables: sanitizedData,
      message: error.message,
      stack: error.stack,
    });
  }

  private sanitizeSensitiveData(data: any) {
    // Defined which field that the sensitive data
    const sensitiveFields = ['password'];
    let sanitizedData = data;

    if (data.input) {
      const arrayKeys = Object.keys(data.input);

      const setKeys = new Set(arrayKeys);
      const hasSensitiveField = sensitiveFields.some((item) =>
        setKeys.has(item),
      );

      if (hasSensitiveField) {
        data = data.input;
        sanitizedData = { ...data };

        sensitiveFields.forEach((field) => {
          if (sanitizedData[field]) {
            sanitizedData[field] = '******'; // overwrite the sensitive data
          }
        });
      }
    }

    return sanitizedData;
  }
}
