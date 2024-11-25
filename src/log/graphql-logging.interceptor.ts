import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { catchError, map, Observable } from 'rxjs';
import { SENSITIVE_FIELDS } from '@common/constants/sensitiveFields';

@Injectable()
export class GraphqlLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = GqlExecutionContext.create(context);
    const query = ctx.getArgs();
    const operationName = ctx.getInfo().fieldName;
    const startTime = Date.now();
    const sanitizedQuery = this.sanitizeQueryArgs(query);

    this.logger.log(`GraphQL operations: ${operationName}`);
    this.logger.log(
      `Query or Mutation Args: ${JSON.stringify(sanitizedQuery)}`,
    );

    return next.handle().pipe(
      map((response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        this.logger.log(
          `Response Time for ${operationName}: ${responseTime}ms`,
        );
        this.logger.log(`GraphQL response: ${JSON.stringify(response)}`);
        return response;
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        this.logger.log(
          `Response Time for ${operationName}: ${responseTime}ms`,
        );
        this.logger.error(
          `GraphQL error in ${operationName}: ${error.message}`,
          error.stack,
        );
        throw error;
      }),
    );
  }

  private sanitizeQueryArgs(query: any): any {
    let sanitizedQuery = { ...query };

    if (query.input) {
      sanitizedQuery = { ...query.input };
    }

    for (const key of Object.keys(sanitizedQuery)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        sanitizedQuery[key] = '[HIDDEN]';
      }
    }

    return sanitizedQuery;
  }
}
