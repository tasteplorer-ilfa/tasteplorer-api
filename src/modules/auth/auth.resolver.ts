import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload, LoginInput, UserRegisterInput } from './dto/auth.dto';
import { UsePipes } from '@nestjs/common';

import { LoginSchema, RegisterSchema } from './dto/auth.validation.schema';
import { InputValidationPipe } from '@common/middleware/auth/input-validation.pipe';

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @UsePipes(new InputValidationPipe(RegisterSchema))
  async register(
    @Args('input') userRegisterInput: UserRegisterInput,
  ): Promise<AuthPayload> {
    return this.authService.register(userRegisterInput);
  }

  @Mutation(() => AuthPayload)
  @UsePipes(new InputValidationPipe(LoginSchema))
  async login(@Args('input') loginInput: LoginInput): Promise<AuthPayload> {
    const { username, password } = loginInput;

    return this.authService.login(username, password);
  }
}
