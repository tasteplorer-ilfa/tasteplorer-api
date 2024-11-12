import { AbstractEntity } from 'src/database/database.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_instructions' })
export class RecipeInstruction extends AbstractEntity<RecipeInstruction> {
  @Column()
  instruction: string;

  @Column()
  recipeId: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Recipe, (recipe) => recipe.instructions)
  recipe: Recipe;

  // ToDo: we will add recipe relationship OneToMany below
}
