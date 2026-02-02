import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class ToggleLikeRecipeInput {
  @Field(() => String, { description: 'Recipe ID to like/unlike' })
  recipeId: string;
}

@ObjectType()
export class EngagementResponseDto {
  @Field(() => Boolean, { description: 'Whether the operation was successful' })
  success: boolean;

  @Field(() => String, { description: 'Response message' })
  message: string;

  @Field(() => Boolean, {
    description: 'Current like status for the recipe (true = liked)',
    nullable: true,
  })
  isLiked?: boolean;
}
