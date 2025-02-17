import { Recipe } from '@module/recipe/entities/recipe.entity';
import { AbstractEntity } from 'src/database/database.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User extends AbstractEntity<User> {
  @Column()
  fullname: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'date', name: 'birth_date' })
  birthDate: Date;

  @Column()
  image: string;

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
  // @OneToMany(() => Recipe, (recipe) => recipe.userId, { cascade: true })
  // recipes: Recipe[];

  @OneToMany(() => Recipe, (recipe) => recipe.user, {
    cascade: true,
  })
  recipes: Recipe[];
}
