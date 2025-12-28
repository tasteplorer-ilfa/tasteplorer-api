import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

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
