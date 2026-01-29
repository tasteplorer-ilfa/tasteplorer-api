import { MetaData } from '@common/dto/metaData.dto';
import { ObjectType, Field, ID, InputType, Int } from '@nestjs/graphql';

@ObjectType()
export class UserDto {
  constructor(entity: UserDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'User ID' })
  id: number;

  @Field(() => String, { description: 'User Fullname', nullable: true })
  fullname?: string;

  @Field(() => String, { description: 'User Email' })
  email: string;

  @Field(() => String, { description: 'Username' })
  username: string;

  // ToDo: we need to add Scalar Date class custom
  @Field(() => Date, { description: 'User Birthdate' })
  birthDate: Date;

  @Field(() => String, { description: 'User Image', nullable: true })
  image?: string;

  @Field(() => String, { description: 'User Created At' })
  createdAt: string;

  @Field(() => String, { description: 'User Updated At' })
  updatedAt: string;

  @Field(() => Date, { description: 'User Deleted At', nullable: true })
  deletedAt?: Date;

  // Follow-state helpers for list view
  @Field(() => Boolean, {
    description: 'Whether the authenticated viewer follows this user',
    nullable: true,
  })
  isFollowedByMe?: boolean;

  @Field(() => Boolean, {
    description: 'Whether this user is the authenticated viewer',
    nullable: true,
  })
  isMe?: boolean;
}

@ObjectType()
export class UserFollowDTO {
  constructor(entity: Partial<UserFollowDTO>) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'User ID' })
  id: number;

  @Field(() => String, { description: 'Username' })
  username: string;

  @Field(() => String, { description: 'User Image', nullable: true })
  image?: string;
}

@ObjectType()
export class UserListData {
  @Field(() => [UserDto], { description: 'Users data' })
  users: UserDto[];

  @Field(() => MetaData, { description: 'metadata desc' })
  meta: MetaData;
}

@ObjectType()
export class UserFollowListData {
  constructor(entity: Partial<UserFollowListData>) {
    Object.assign(this, entity);
  }

  @Field(() => [UserFollowDTO], { description: 'Users Follow data' })
  data: UserFollowDTO[];

  @Field(() => Int, { description: 'Total of users' })
  total: number;
}

@ObjectType()
export class ProfileDTO extends UserDto {
  @Field(() => Int, { description: 'Total followers', nullable: true })
  totalFollowers?: number;

  @Field(() => Int, { description: 'Total following', nullable: true })
  totalFollowing?: number;

  // Keep legacy fields but mark as deprecated and nullable to avoid breaking changes.
  // Clients should migrate to totalFollowers / totalFollowing.
  @Field(() => UserFollowListData, {
    description: 'List of followers',
    nullable: true,
    deprecationReason:
      'Deprecated: use totalFollowers instead. This field will be removed in a future release.',
  })
  followers?: UserFollowListData;

  @Field(() => UserFollowListData, {
    description: 'List of following users',
    nullable: true,
    deprecationReason:
      'Deprecated: use totalFollowing instead. This field will be removed in a future release.',
  })
  following?: UserFollowListData;
}

@ObjectType()
export class UserConnection {
  @Field(() => [UserDto], { description: 'List of users' })
  data: UserDto[];

  @Field(() => ID, { nullable: true, description: 'Cursor for next page' })
  nextCursor?: number;

  @Field(() => Boolean, { description: 'Whether more results exist' })
  hasMore: boolean;

  @Field(() => Int, { description: 'Total number of users' })
  total: number;
}

@InputType()
export class UsersQueryInput {
  @Field(() => String, {
    nullable: true,
    description: 'Search by username or fullname',
  })
  search?: string;

  @Field(() => ID, { nullable: true, description: 'Cursor for pagination' })
  cursor?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Number of results to return (max 50)',
  })
  limit?: number;
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { description: 'User Fullname Field', nullable: true })
  fullname?: string;

  @Field(() => String, { description: 'User Email Field', nullable: true })
  email?: string;

  @Field(() => String, { description: 'Username Field', nullable: true })
  username?: string;

  @Field(() => String, { description: 'User BirthDate Field' })
  birthDate: string;

  @Field(() => String, { description: 'User Image Field', nullable: true })
  image?: string;
}

@ObjectType()
export class SuggestedUserDto {
  constructor(entity: Partial<SuggestedUserDto>) {
    Object.assign(this, entity);
  }

  @Field(() => String, { description: 'Suggested User ID' })
  userId: string;

  @Field(() => String, { description: 'Username' })
  username: string;

  @Field(() => String, { description: 'Full Name' })
  fullName: string;

  @Field(() => String, { description: 'Profile Image URL', nullable: true })
  profileImageUrl?: string;

  @Field(() => Int, { description: 'Follower Count' })
  followerCount: number;

  @Field(() => Int, { description: 'Mutual Follower Count' })
  mutualFollowerCount: number;

  @Field(() => [String], { description: 'Mutual Connection Usernames' })
  mutualConnectionUsernames: string[];

  @Field(() => Number, { description: 'Suggestion Score', nullable: true })
  suggestionScore?: number;

  @Field(() => String, { description: 'Suggestion Reason' })
  suggestionReason: string;
}

@ObjectType()
export class UserSuggestionListDto {
  constructor(entity: Partial<UserSuggestionListDto>) {
    Object.assign(this, entity);
  }

  @Field(() => [SuggestedUserDto], { description: 'List of suggested users' })
  users: SuggestedUserDto[];

  @Field(() => Int, { description: 'Total count of suggestions' })
  totalCount: number;

  @Field(() => Boolean, { description: 'Has more suggestions' })
  hasMore: boolean;
}

// ============================================================================
// Follow Feature DTOs
// ============================================================================

@ObjectType()
export class UserSummaryDto {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  fullname: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  isFollowedByMe: boolean;

  @Field({ description: 'Whether this user is the authenticated viewer' })
  isMe: boolean;
}

@ObjectType()
export class PageInfoDto {
  @Field(() => Int, { nullable: true })
  nextCursor?: number;

  @Field()
  hasNext: boolean;
}

@ObjectType()
export class FollowerListDto {
  @Field(() => [UserSummaryDto])
  users: UserSummaryDto[];

  @Field(() => PageInfoDto)
  pageInfo: PageInfoDto;
}

@ObjectType()
export class FollowingListDto {
  @Field(() => [UserSummaryDto])
  users: UserSummaryDto[];

  @Field(() => PageInfoDto)
  pageInfo: PageInfoDto;
}
