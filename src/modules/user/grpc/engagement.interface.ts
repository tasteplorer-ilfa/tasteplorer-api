import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

// ============================================================================
// User Suggestion Interfaces
// ============================================================================

export interface GetSuggestedUsersRequest {
  limit: number;
  offset: number;
}

export interface SuggestedUser {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  follower_count: number;
  mutual_follower_count: number;
  mutual_connection_usernames: string[];
  suggestion_score: number;
  suggestion_reason: string;
}

export interface GetSuggestedUsersResponse {
  users: SuggestedUser[];
  total_count: number;
  has_more: boolean;
}

export interface UserSuggestionService {
  getSuggestedUsers(
    request: GetSuggestedUsersRequest,
    metadata?: Metadata,
  ): Observable<GetSuggestedUsersResponse>;
}

// ============================================================================
// Follow Service Interfaces
// ============================================================================

export interface ListFollowersRequest {
  user_id: number;
  viewer_id: number;
  limit: number;
  cursor: number;
}

export interface ListFollowingRequest {
  user_id: number;
  viewer_id: number;
  limit: number;
  cursor: number;
}

export interface UserSummary {
  id: number;
  username: string;
  fullname: string;
  image: string;
  is_followed_by_me: boolean;
  is_me: boolean;
}

export interface PageInfo {
  next_cursor: number;
  has_next: boolean;
}

export interface ListFollowersResponse {
  users: UserSummary[];
  page_info: PageInfo;
}

export interface ListFollowingResponse {
  users: UserSummary[];
  page_info: PageInfo;
}

export interface FollowService {
  listFollowers(
    request: ListFollowersRequest,
  ): Observable<ListFollowersResponse>;
  listFollowing(
    request: ListFollowingRequest,
  ): Observable<ListFollowingResponse>;
}
