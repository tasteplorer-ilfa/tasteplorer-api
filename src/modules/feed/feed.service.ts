import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GraphQLError } from 'graphql';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import {
  FeedService as GrpcFeedService,
  CreateFeedRequest,
  UpdateFeedRequest,
  ListHomeFeedRequest,
  ListUserFeedsRequest,
} from './grpc/feed.interface';
import {
  FeedDto,
  FeedImageDto,
  CreateFeedInput,
  UpdateFeedInput,
  FeedListDto,
  DeleteFeedResponseDto,
  FeedUserDto,
} from './dto/feed.dto';

@Injectable()
export class FeedService implements OnModuleInit {
  private feedService: GrpcFeedService;

  constructor(
    @Inject('FEED_SERVICE') private readonly feedClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.feedService =
      this.feedClient.getService<GrpcFeedService>('FeedService');
  }

  private createMetadata(userId: number): Metadata {
    const metadata = new Metadata();
    metadata.set('user-id', userId.toString());
    return metadata;
  }

  private mapFeedDto(feed: any): FeedDto {
    return {
      id: feed.id,
      user: this.mapFeedUserDto(feed.user),
      recipeId: feed.recipe_id === 0 ? null : feed.recipe_id,
      content: feed.content,
      createdAt: feed.created_at,
      updatedAt: feed.updated_at,
      images: feed.images.map((img: any) => this.mapFeedImageDto(img)),
    };
  }

  private mapFeedUserDto(user: any): FeedUserDto {
    return {
      id: user.id,
      username: user.username,
      profileImageUrl: user.profile_image_url,
    };
  }

  private mapFeedImageDto(image: any): FeedImageDto {
    return {
      id: image.id,
      imageUrl: image.image_url,
      position: image.position,
    };
  }

  async createFeed(input: CreateFeedInput, userId: number): Promise<FeedDto> {
    try {
      const request: CreateFeedRequest = {
        content: input.content,
        recipe_id: input.recipeId || 0,
        images:
          input.images?.map((img) => ({
            image_url: img.imageUrl,
            position: img.position,
          })) || [],
      };

      const metadata = this.createMetadata(userId);
      const response = await firstValueFrom(
        this.feedService.createFeed(request, metadata),
      );

      if (!response.success) {
        throw new GraphQLError(response.message || 'Failed to create feed');
      }

      return this.mapFeedDto(response.feed);
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while creating feed',
      );
    }
  }

  async getFeed(feedId: string): Promise<FeedDto> {
    try {
      const response = await firstValueFrom(
        this.feedService.getFeed({ feed_id: feedId }),
      );

      if (!response.success) {
        throw new GraphQLError(response.message || 'Feed not found');
      }

      return this.mapFeedDto(response.feed);
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while fetching feed',
      );
    }
  }

  async updateFeed(
    feedId: string,
    input: UpdateFeedInput,
    userId: number,
  ): Promise<FeedDto> {
    try {
      const request: UpdateFeedRequest = {
        feed_id: feedId,
        content: input.content,
      };

      const metadata = this.createMetadata(userId);
      const response = await firstValueFrom(
        this.feedService.updateFeed(request, metadata),
      );

      if (!response.success) {
        throw new GraphQLError(response.message || 'Failed to update feed');
      }

      return this.mapFeedDto(response.feed);
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while updating feed',
      );
    }
  }

  async deleteFeed(
    feedId: string,
    userId: number,
  ): Promise<DeleteFeedResponseDto> {
    try {
      const metadata = this.createMetadata(userId);
      const response = await firstValueFrom(
        this.feedService.deleteFeed({ feed_id: feedId }, metadata),
      );

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while deleting feed',
      );
    }
  }

  async listHomeFeeds(
    userId: number,
    cursor?: string,
    limit: number = 20,
  ): Promise<FeedListDto> {
    try {
      const request: ListHomeFeedRequest = {
        cursor: cursor || '',
        limit,
      };

      const metadata = this.createMetadata(userId);
      const response = await firstValueFrom(
        this.feedService.listHomeFeed(request, metadata),
      );

      return {
        feeds: response.feeds.map((feed) => this.mapFeedDto(feed)),
        nextCursor: response.next_cursor || null,
        hasMore: response.has_more,
      };
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while fetching home feeds',
      );
    }
  }

  async listUserFeeds(
    targetUserId: number,
    cursor?: string,
    limit: number = 20,
  ): Promise<FeedListDto> {
    try {
      const request: ListUserFeedsRequest = {
        target_user_id: targetUserId,
        cursor: cursor || '',
        limit,
      };

      // Send metadata with target_user_id for authentication bypass
      // This is a workaround as the engagement service expects metadata
      const metadata = this.createMetadata(targetUserId);
      const response = await firstValueFrom(
        this.feedService.listUserFeeds(request, metadata),
      );

      return {
        feeds: response.feeds.map((feed) => this.mapFeedDto(feed)),
        nextCursor: response.next_cursor || null,
        hasMore: response.has_more,
      };
    } catch (error) {
      throw new GraphQLError(
        error.message || 'An error occurred while fetching user feeds',
      );
    }
  }
}
