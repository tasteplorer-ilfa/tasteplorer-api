import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRegisterInput } from '@module/auth/dto/auth.dto';
import { UserFollow } from './entities/user-follow.entity';
import { UserFollowDTO, UserFollowListData } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,

    @InjectRepository(UserFollow)
    private readonly userFollowRepository: Repository<UserFollow>,
  ) {}

  async create(input: UserRegisterInput, hashedPassword: string) {
    const { fullname, email, username, image, birthDate } = input;

    const user = this.repository.create({
      fullname,
      email,
      username,
      image,
      birthDate,
      password: hashedPassword,
    });

    return await this.repository.save(user);
  }

  async update(existingUser: User) {
    return this.repository.save(existingUser);
  }

  async findUserByIdIgnoreDeletedAt(id: number) {
    return this.repository
      .createQueryBuilder('users')
      .where('users.id = :id', { id: id })
      .getOne();
  }

  async findExistingUserEmail(id: number, email: string) {
    return this.repository
      .createQueryBuilder('users')
      .select(['users.id', 'users.email'])
      .where('users.id = :id', { id })
      .andWhere('users.email = :email', { email })
      .getOne();
  }

  async findUserByEmail(email: string) {
    return this.repository
      .createQueryBuilder('users')
      .select(['users.email'])
      .where('users.email = :email', { email })
      .getOne();
  }

  async findById(id: number) {
    const result = await this.repository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.followers', 'followers')
      .leftJoinAndSelect('followers.follower', 'followerUser')
      .leftJoinAndSelect('users.following', 'following')
      .leftJoinAndSelect('following.following', 'followingUser')
      .where('users.id = :id', { id: id })
      .andWhere('users.deleted_at IS NULL')
      .getOne();

    if (!result) return null;

    delete result.password;

    return {
      ...result,
      followers: new UserFollowListData({
        total: result.followers.length,
        data: result.followers.map((f) => new UserFollowDTO(f.follower)),
      }),
      following: new UserFollowListData({
        total: result.following.length,
        data: result.following.map((f) => new UserFollowDTO(f.following)),
      }),
    };
  }

  async findByEmail(email: string) {
    return this.repository
      .createQueryBuilder('users')
      .where('users.email = :email', { email })
      .andWhere('users.deleted_at IS NULL')
      .getOne();
  }

  // Find user by username with user.deleted_at is null restriction
  async findByUsername(username: string): Promise<User> {
    return this.repository
      .createQueryBuilder('users')
      .where('users.username = :username', { username })
      .andWhere('users.deleted_at IS NULL')
      .getOne();
  }

  // Find user by username without user.deleted_at is null restriction
  async findUserByUsername(username: string): Promise<User> {
    return this.repository
      .createQueryBuilder('users')
      .select(['users.username'])
      .where('users.username = :username', { username })
      .getOne();
  }

  async findUserByIdAndUsername(id: number, username: string): Promise<User> {
    return this.repository
      .createQueryBuilder('users')
      .select(['users.id', 'users.username'])
      .where('users.id = :id', { id })
      .andWhere('users.username = :username', { username })
      .getOne();
  }

  /**
   * Handling User Follow
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const count = await this.userFollowRepository
      .createQueryBuilder('uf')
      .where('uf.follower_id = :followerId', { followerId })
      .andWhere('uf.following_id = :followingId', { followingId })
      .getCount();

    return count > 0;
  }

  async createUserFollow(followerId: number, followingId: number) {
    const follow = this.userFollowRepository.create({
      follower: { id: followerId },
      following: { id: followingId },
    });

    return this.userFollowRepository.save(follow);
  }

  async findOneUserFollow(followerId: number, followingId: number) {
    return this.userFollowRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
  }

  async removeFollowRelationship(user: UserFollow) {
    return this.userFollowRepository.remove(user);
  }
}
