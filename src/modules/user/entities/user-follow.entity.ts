import { AbstractEntity } from '@database/database.entity';
import { Check, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_follows' })
@Unique(['follower', 'following']) // Prevent duplicate follows
@Check('"followerId" <> "followingId"') // Prevent self-follow
export class UserFollow extends AbstractEntity<UserFollow> {
  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;
}
