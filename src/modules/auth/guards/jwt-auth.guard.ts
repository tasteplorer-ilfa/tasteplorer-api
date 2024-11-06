import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { GraphQLError } from 'graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(`You're not authenticated.`);
    }

    try {
      const payload = await this.authService.validateToken(token);

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('JWT Malformed or Invalid');
      }

      throw new UnauthorizedException('JWT Invalid');
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const token = request.headers.authorization?.split(' ')[1];
    return token || null;
  }

  getRequest(context: ExecutionContext) {
    try {
      const ctx = GqlExecutionContext.create(context);
      const token = ctx.getContext().req.headers.authorization?.split(' ')[1];

      this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      });

      return ctx.getContext().req;
    } catch (error) {
      throw new GraphQLError(error);
    }
  }
}
