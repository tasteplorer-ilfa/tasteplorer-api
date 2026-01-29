import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import {
  ProfileDTO,
  UpdateUserInput,
  UserDto,
  UserConnection,
  UsersQueryInput,
  UserSuggestionListDto,
  FollowerListDto,
  FollowingListDto,
} from './dto/user.dto';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@module/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@module/auth/guards/optional-jwt-auth.guard';
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
    const profile = await this.userService.findById(user.sub, Number(user.sub));
    // Remove follower lists from currentUser response as they're not needed on profile page
    if (profile) {
      // delete properties if present to avoid breaking schema elsewhere
      // keep totalFollowers/totalFollowing in place
      // cast to any to allow deleting optional or missing properties
      delete (profile as any).followers;
      delete (profile as any).following;
    }
    return profile;
  }

  @Query(() => ProfileDTO, { name: 'userProfile' })
  @UseGuards(JwtAuthGuard)
  async userProfile(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() viewer: TokenPayload,
  ) {
    const viewerId = viewer ? Number(viewer.sub) : undefined;
    const profile = await this.userService.findById(id, viewerId);
    if (!profile) return null;

    // Work with a shallow copy to avoid mutating underlying object
    const copy: any = { ...(profile as any) };

    // Compute totals in a safe, optimized way:
    // If service already provides counts (totalFollowers/totalFollowing), use them.
    // Otherwise, derive counts from arrays if present.
    const totalFollowers =
      typeof copy.totalFollowers === 'number'
        ? copy.totalFollowers
        : Array.isArray(copy.followers)
          ? copy.followers.length
          : 0;

    const totalFollowing =
      typeof copy.totalFollowing === 'number'
        ? copy.totalFollowing
        : Array.isArray(copy.following)
          ? copy.following.length
          : 0;

    // Remove potentially large arrays from response to avoid sending unnecessary data
    // and to keep response payload small and consistent for the profile page.
    // Use delete to avoid unused variable linter/compile warnings.
    if (copy.followers) delete copy.followers;
    if (copy.following) delete copy.following;

    return {
      ...copy,
      totalFollowers,
      totalFollowing,
    };
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
  @UseGuards(OptionalJwtAuthGuard)
  async users(
    @Args('input', { nullable: true }) input?: UsersQueryInput,
    @CurrentUser() viewer?: TokenPayload,
  ) {
    const { search, cursor, limit } = input || {};
    const viewerId = viewer ? Number(viewer.sub) : undefined;
    return this.userService.findUsersWithCursorPagination(
      search,
      cursor,
      limit,
      viewerId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserSuggestionListDto, { name: 'userSuggestionList' })
  async userSuggestionList(
    @CurrentUser() user: TokenPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<UserSuggestionListDto> {
    return this.userService.getSuggestedUsers(user.sub, limit, offset);
  }

  // ============================================================================
  // Follow Feature Queries
  // ============================================================================

  @Query(() => FollowerListDto, { name: 'followers' })
  @UseGuards(JwtAuthGuard)
  async listFollowers(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('cursor', { type: () => Int, nullable: true }) cursor: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @CurrentUser() viewer: TokenPayload,
  ): Promise<FollowerListDto> {
    return this.userService.listFollowers(userId, viewer.sub, cursor, limit);
  }

  @Query(() => FollowingListDto, { name: 'following' })
  @UseGuards(JwtAuthGuard)
  async listFollowing(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('cursor', { type: () => Int, nullable: true }) cursor: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @CurrentUser() viewer: TokenPayload,
  ): Promise<FollowingListDto> {
    return this.userService.listFollowing(userId, viewer.sub, cursor, limit);
  }
}
