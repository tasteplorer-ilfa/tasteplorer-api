import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecipeMediaDto {
  constructor(entity: RecipeMediaDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'Recipe Media ID' })
  id: number;

  @Field(() => String, { description: 'Recipe Media Url' })
  url: string;

  @Field(() => Int, { description: 'Recipe Media Recipe ID' })
  recipeId: number;

  @Field(() => String, { description: 'Recipe Media Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Recipe Media Updated At' })
  updatedAt: string;

  @Field(() => Date, {
    description: 'Recipe Media Deleted At',
    nullable: true,
  })
  deletedAt?: Date;
}
