import { UserDto } from '@module/user/dto/user.dto';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { RecipeIngredientDto } from './recipe-ingredient.dto';
import { RecipeInstructionDto } from './recipe-instruction.dto';
import { RecipeMediaDto } from './recipe-media.dto';
import { MetaData } from '@common/dto/metaData.dto';

@ObjectType()
export class RecipeDto {
  constructor(entity: RecipeDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'Recipe ID' })
  id: number;

  @Field(() => String, { description: 'Recipe Title' })
  title: string;

  @Field(() => String, { description: 'Recipe Description', nullable: true })
  description: string;

  @Field(() => Boolean, { description: 'Is A Favorite Recipe', nullable: true })
  isFavorite: boolean;

  @Field(() => String, { description: 'Recipe Servings' })
  servings: string;

  @Field(() => String, { description: 'Recipe Cooking Time' })
  cookingTime: string;

  @Field(() => UserDto, { description: 'Recipe Author Detail' })
  author: UserDto;

  @Field(() => [RecipeIngredientDto], { description: 'Recipe Ingredient List' })
  ingredients: RecipeIngredientDto[];

  @Field(() => [RecipeInstructionDto], {
    description: 'Recipe Instruction List',
  })
  instructions: RecipeInstructionDto[];

  @Field(() => RecipeMediaDto, { description: 'Recipe Media Detail' })
  image: RecipeMediaDto;

  @Field(() => String, { description: 'Recipe Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Recipe Updated At' })
  updatedAt: string;

  @Field(() => Date, { description: 'Recipe Deleted At', nullable: true })
  deletedAt?: Date;
}

@ObjectType()
export class RecipeListDataDto {
  constructor(data: RecipeListDataDto) {
    Object.assign(this, data);
  }

  @Field(() => [RecipeDto], { description: 'List of Recipes' })
  recipes: RecipeDto[];

  @Field(() => MetaData, { description: 'Recipe List Metadata' })
  meta: MetaData;
}

@InputType()
export class RecipeInput {
  @Field(() => String, { description: 'The recipe title' })
  title: string;

  @Field(() => String, { description: 'The recipe description' })
  description: string;

  @Field(() => String, { description: 'The recipe image' })
  image: string;

  @Field(() => String, { description: 'The recipe servings' })
  servings: string;

  @Field(() => String, { description: 'The recipe cooking time' })
  cookingTime: string;

  @Field(() => [String], { description: 'The recipe ingredients' })
  ingredients: string[];

  @Field(() => [String], { description: 'The recipe instructions' })
  instructions: string[];
}
