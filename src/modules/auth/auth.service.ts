import { Injectable } from '@nestjs/common';
import { AuthPayload, UserRegisterInput } from './dto/auth.dto';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { GraphQLError } from 'graphql';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { validateExistUser } from '@common/helpers/auth.helper';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userRegisterInput: UserRegisterInput): Promise<AuthPayload> {
    const user = await this.userService.create(userRegisterInput);
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const authPayloadDto: AuthPayload = {
      user,
      token,
    };

    return authPayloadDto;
  }

  async login(username: string, password: string): Promise<AuthPayload> {
    try {
      const user = await this.userService.findByUsername(username);

      await validateExistUser(user, password);

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      delete user.password;

      const userDto: UserDto = {
        ...user,
        createdAt,
        updatedAt,
      };

      const authPayloadDto: AuthPayload = {
        user: userDto,
        token,
      };

      return authPayloadDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async validateToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }
}
