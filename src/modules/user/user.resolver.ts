import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import {
  ProfileDTO,
  UpdateUserInput,
  UserDto,
  UserConnection,
  UsersQueryInput,
} from './dto/user.dto';
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

  @Query(() => ProfileDTO, { name: 'currentUser' })
  @UseGuards(JwtAuthGuard)
  async currentUser(@CurrentUser() user: TokenPayload) {
    return this.userService.findById(user.sub);
  }

  @Query(() => ProfileDTO, { name: 'userProfile' })
  @UseGuards(JwtAuthGuard)
  async userProfile(@Args('id', { type: () => ID }) id: number) {
    return this.userService.findById(id);
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

  // Handling User Follow
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async followUser(
    @Args('followerId', { type: () => Int }) followerId: number,
    @Args('followingId', { type: () => Int }) followingId: number,
  ) {
    await this.userService.followUser(followerId, followingId);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async unfollowUser(
    @Args('followerId', { type: () => Int }) followerId: number,
    @Args('followingId', { type: () => Int }) followingId: number,
  ) {
    await this.userService.unFollowUser(followerId, followingId);
    return true;
  }

  @Query(() => UserConnection, { name: 'users' })
  async users(@Args('input', { nullable: true }) input?: UsersQueryInput) {
    const { search, cursor, limit } = input || {};
    return this.userService.findUsersWithCursorPagination(
      search,
      cursor,
      limit,
    );
  }
}
