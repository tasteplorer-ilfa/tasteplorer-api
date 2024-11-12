import { AbstractEntity } from 'src/database/database.entity';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'favorite_recipes' })
export class FavoriteRecipe extends AbstractEntity<FavoriteRecipe> {
  @Column()
  userId: number;

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

  // ToDo: we will add recipe relationship OneToMany below
}
