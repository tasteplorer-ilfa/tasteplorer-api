import { AbstractEntity } from 'src/database/database.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeInstruction } from './recipe-instruction.entity';
import { RecipeMedia } from './recipe-media.entity';
import { User } from '@module/user/entities/user.entity';

@Entity({ name: 'recipes' })
export class Recipe extends AbstractEntity<Recipe> {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  servings: string;

  @Column({ name: 'cooking_time' })
  cookingTime: string;

  @Column()
  isFavorite: boolean;

  @Column()
  userId: number;

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

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({
    name: 'hot_score',
    type: 'double precision',
    nullable: true,
    default: 0,
  })
  hotScore: number;

  // ToDo: we will add recipe relationship OneToMany below

  @ManyToOne(() => User, (user) => user.recipes)
  user: User;

  @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
    cascade: true,
  })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeInstruction, (instruction) => instruction.recipe, {
    cascade: true,
  })
  instructions: RecipeInstruction[];

  @OneToOne(() => RecipeMedia, (recipeMedia) => recipeMedia.recipe)
  image: RecipeMedia;

  // @ManyToOne(() => User, (user) => user.recipes)
  // user: User;
}
