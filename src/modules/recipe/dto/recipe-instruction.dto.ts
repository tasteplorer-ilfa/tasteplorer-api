import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecipeInstructionDto {
  constructor(entity: RecipeInstructionDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'Recipe Instruction ID' })
  id: number;

  @Field(() => String, { description: 'Recipe Instruction' })
  instruction: string;

  @Field(() => Int, { description: 'Recipe Instruction Recipe ID' })
  recipeId: number;

  @Field(() => String, { description: 'Recipe Instruction Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Recipe Instruction Updated At' })
  updatedAt: string;

  @Field(() => Date, {
    description: 'Recipe Instruction Deleted At',
    nullable: true,
  })
  deletedAt?: Date;
}
