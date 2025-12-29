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
}

@ObjectType()
export class ProfileDTO extends UserDto {
  @Field(() => UserFollowListData, {
    description: 'List of followers',
    nullable: true,
  })
  followers: () => UserFollowListData;

  @Field(() => UserFollowListData, { description: 'List of following users' })
  following: () => UserFollowListData;
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
