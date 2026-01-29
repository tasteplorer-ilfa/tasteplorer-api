import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const token = request.headers?.authorization?.split(' ')[1];
    if (!token) return true; // no token => proceed as anonymous

    try {
      const payload = await this.authService.validateToken(token);
      request.user = payload;
    } catch (e) {
      // invalid token => ignore and continue as anonymous
    }

    return true;
  }
}
