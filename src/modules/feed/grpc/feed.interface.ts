import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

// Request interfaces
export interface CreateFeedRequest {
  content: string;
  recipe_id: number;
  images: FeedImageInput[];
}

export interface FeedImageInput {
  image_url: string;
  position: number;
}

export interface GetFeedRequest {
  feed_id: string;
}

export interface UpdateFeedRequest {
  feed_id: string;
  content: string;
  recipe_id: number;
  images: FeedImageInput[];
}

export interface DeleteFeedRequest {
  feed_id: string;
}

export interface ListHomeFeedRequest {
  cursor: string;
  limit: number;
}

export interface ListUserFeedsRequest {
  target_user_id: number;
  cursor: string;
  limit: number;
}

// Response interfaces
export interface CreateFeedResponse {
  success: boolean;
  message: string;
  feed: Feed;
}

export interface GetFeedResponse {
  success: boolean;
  message: string;
  feed: Feed;
}

export interface UpdateFeedResponse {
  success: boolean;
  message: string;
  feed: Feed;
}

export interface DeleteFeedResponse {
  success: boolean;
  message: string;
}

export interface ListHomeFeedResponse {
  success: boolean;
  feeds: Feed[];
  next_cursor: string;
  has_more: boolean;
}

export interface ListUserFeedsResponse {
  success: boolean;
  feeds: Feed[];
  next_cursor: string;
  has_more: boolean;
}

// Entity interfaces
export interface FeedUser {
  id: number;
  username: string;
  profile_image_url: string;
}

export interface FeedRecipe {
  id: number;
  title: string;
}

export interface Feed {
  id: string;
  user: FeedUser;
  recipe: FeedRecipe;
  content: string;
  created_at: string;
  updated_at: string;
  images: FeedImage[];
}

export interface FeedImage {
  id: string;
  image_url: string;
  position: number;
}

// gRPC Service interface
export interface FeedService {
  createFeed(
    request: CreateFeedRequest,
    metadata?: Metadata,
  ): Observable<CreateFeedResponse>;

  getFeed(
    request: GetFeedRequest,
    metadata?: Metadata,
  ): Observable<GetFeedResponse>;

  updateFeed(
    request: UpdateFeedRequest,
    metadata?: Metadata,
  ): Observable<UpdateFeedResponse>;

  deleteFeed(
    request: DeleteFeedRequest,
    metadata?: Metadata,
  ): Observable<DeleteFeedResponse>;

  listHomeFeed(
    request: ListHomeFeedRequest,
    metadata?: Metadata,
  ): Observable<ListHomeFeedResponse>;

  listUserFeeds(
    request: ListUserFeedsRequest,
    metadata?: Metadata,
  ): Observable<ListUserFeedsResponse>;
}
