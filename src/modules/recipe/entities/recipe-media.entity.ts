import { AbstractEntity } from 'src/database/database.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_medias' })
export class RecipeMedia extends AbstractEntity<RecipeMedia> {
  @Column()
  url: string;

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

  @OneToOne(() => Recipe, (recipe) => recipe.image)
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  // ToDo: we will add recipe relationship OneToMany below
}
