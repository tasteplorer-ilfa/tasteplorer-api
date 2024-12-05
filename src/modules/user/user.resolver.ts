import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UpdateUserInput, UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@module/auth/guards/jwt-auth.guard';
import { InputValidationPipe } from '@common/middleware/auth/input-validation.pipe';
import { UserValidationSchema } from './dto/user.validation.schema';
import { CurrentUser } from './decorator/current-user.decorator';
import { TokenPayload } from '@common/dto/tokenPayload.dto';

@Resolver(() => UserDto)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserDto, { name: 'currentUser' })
  @UseGuards(JwtAuthGuard)
  currentUser(@CurrentUser() user: TokenPayload): Promise<UserDto> {
    return this.userService.findById(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserDto)
  async updateUser(
    @Args('id', { type: () => ID }) id: number,
    @Args('input', new InputValidationPipe(UserValidationSchema))
    updateUserInput: UpdateUserInput,
  ): Promise<UserDto> {
    return this.userService.update(id, updateUserInput);
  }
}
