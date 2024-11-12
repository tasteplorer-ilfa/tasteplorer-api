import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const query = gqlContext.getInfo().fieldName;
    const variables = gqlContext.getArgs();

    this.loggerService.logQuery(query, variables);

    return next.handle().pipe(
      catchError((error) => {
        this.loggerService.logError({
          query,
          variables,
          error,
        });
        throw error;
      }),
    );
  }
}
