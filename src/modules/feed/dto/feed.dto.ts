import { ObjectType, Field, Int, ID, InputType } from '@nestjs/graphql';

@ObjectType()
export class FeedUserDto {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  profileImageUrl: string;
}

@ObjectType()
export class FeedRecipeDto {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;
}

@ObjectType()
export class FeedImageDto {
  @Field(() => ID)
  id: string;

  @Field()
  imageUrl: string;

  @Field(() => Int)
  position: number;
}

@ObjectType()
export class FeedDto {
  @Field(() => ID)
  id: string;

  @Field(() => FeedUserDto)
  user: FeedUserDto;

  @Field(() => FeedRecipeDto, { nullable: true })
  recipe?: FeedRecipeDto;

  @Field()
  content: string;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;

  @Field(() => [FeedImageDto])
  images: FeedImageDto[];
}

@InputType()
export class FeedImageInput {
  @Field()
  imageUrl: string;

  @Field(() => Int)
  position: number;
}

@InputType()
export class CreateFeedInput {
  @Field()
  content: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  recipeId?: number;

  @Field(() => [FeedImageInput], { nullable: true, defaultValue: [] })
  images?: FeedImageInput[];
}

@InputType()
export class UpdateFeedInput {
  @Field()
  content: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  recipeId?: number;

  @Field(() => [FeedImageInput], { nullable: true, defaultValue: [] })
  images?: FeedImageInput[];
}

@ObjectType()
export class FeedListDto {
  @Field(() => [FeedDto])
  feeds: FeedDto[];

  @Field({ nullable: true })
  nextCursor?: string;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class DeleteFeedResponseDto {
  @Field()
  success: boolean;

  @Field()
  message: string;
}
