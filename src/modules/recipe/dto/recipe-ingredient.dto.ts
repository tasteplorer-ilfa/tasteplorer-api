import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecipeIngredientDto {
  constructor(entity: RecipeIngredientDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'Recipe Ingredient ID' })
  id: number;

  @Field(() => String, { description: 'Recipe Ingredient' })
  ingredient: string;

  @Field(() => Int, { description: 'Recipe Ingredient Recipe ID' })
  recipeId: number;

  @Field(() => String, { description: 'Recipe Ingredient Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Recipe Ingredient Updated At' })
  updatedAt: string;

  @Field(() => Date, {
    description: 'Recipe Ingredient Deleted At',
    nullable: true,
  })
  deletedAt?: Date;
}
