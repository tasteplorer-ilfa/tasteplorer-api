import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import {
  FeedDto,
  CreateFeedInput,
  UpdateFeedInput,
  FeedListDto,
  DeleteFeedResponseDto,
} from './dto/feed.dto';
import { JwtAuthGuard } from '@module/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@module/user/decorator/current-user.decorator';
import { TokenPayload } from '@common/dto/tokenPayload.dto';

@Resolver(() => FeedDto)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Mutation(() => FeedDto)
  @UseGuards(JwtAuthGuard)
  async createFeed(
    @Args('input') input: CreateFeedInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<FeedDto> {
    return this.feedService.createFeed(input, user.sub);
  }

  @Query(() => FeedDto, { name: 'feed' })
  async getFeed(@Args('id', { type: () => ID }) id: string): Promise<FeedDto> {
    return this.feedService.getFeed(id);
  }

  @Mutation(() => FeedDto)
  @UseGuards(JwtAuthGuard)
  async updateFeed(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeedInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<FeedDto> {
    return this.feedService.updateFeed(id, input, user.sub);
  }

  @Mutation(() => DeleteFeedResponseDto)
  @UseGuards(JwtAuthGuard)
  async deleteFeed(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<DeleteFeedResponseDto> {
    return this.feedService.deleteFeed(id, user.sub);
  }

  @Query(() => FeedListDto, { name: 'homeFeeds' })
  @UseGuards(JwtAuthGuard)
  async listHomeFeeds(
    @Args('cursor', { type: () => String, nullable: true }) cursor: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<FeedListDto> {
    return this.feedService.listHomeFeeds(user.sub, cursor, limit);
  }

  @Query(() => FeedListDto, { name: 'userFeeds' })
  async listUserFeeds(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<FeedListDto> {
    return this.feedService.listUserFeeds(userId, cursor, limit);
  }
}
