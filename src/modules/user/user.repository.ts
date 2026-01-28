import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRegisterInput } from '@module/auth/dto/auth.dto';
import { UserFollow } from './entities/user-follow.entity';

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
    // Avoid loading followers/following relations here to prevent heavy queries.
    // Return only user basic data; follower/following totals should be obtained via count helpers.
    const user = await this.repository
      .createQueryBuilder('users')
      .select([
        'users.id',
        'users.fullname',
        'users.email',
        'users.username',
        'users.image',
        'users.birthDate',
        'users.createdAt',
        'users.updatedAt',
        'users.deletedAt',
        'users.password',
      ])
      .where('users.id = :id', { id })
      .andWhere('users.deleted_at IS NULL')
      .getOne();

    if (!user) return null;

    // Remove password before returning
    delete user.password;

    return user;
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

  /**
   * Find users with cursor-based pagination and search
   * @param search - Search term for username or fullname (case-insensitive)
   * @param cursor - Last user ID from previous page
   * @param limit - Number of results to fetch (max 50)
   * @returns Object containing users array and total count
   */
  async findUsersWithCursorPagination(
    search?: string,
    cursor?: number,
    limit: number = 20,
  ): Promise<{ users: User[]; total: number }> {
    // Enforce max limit of 50
    const effectiveLimit = Math.min(limit, 50);

    const queryBuilder = this.repository
      .createQueryBuilder('users')
      .select([
        'users.id',
        'users.username',
        'users.fullname',
        'users.email',
        'users.image',
        'users.birthDate',
        'users.createdAt',
        'users.updatedAt',
      ])
      .where('users.deleted_at IS NULL');

    // Apply search filter if provided
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(users.username ILIKE :search OR users.fullname ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Count total users (without cursor, but with search filter)
    const countQueryBuilder = this.repository
      .createQueryBuilder('users')
      .where('users.deleted_at IS NULL');

    if (search && search.trim()) {
      countQueryBuilder.andWhere(
        '(users.username ILIKE :search OR users.fullname ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Execute count query in parallel with data query
    const totalPromise = countQueryBuilder.getCount();

    // Apply cursor-based pagination
    if (cursor) {
      queryBuilder.andWhere('users.id > :cursor', { cursor });
    }

    // Order by id ASC (deterministic ordering)
    queryBuilder.orderBy('users.id', 'ASC');

    // Fetch limit + 1 to detect if more results exist
    queryBuilder.limit(effectiveLimit + 1);

    const [users, total] = await Promise.all([
      queryBuilder.getMany(),
      totalPromise,
    ]);

    return { users, total };
  }

  // Return list of following_ids that viewerId follows among provided userIds
  async getFollowedUserIdsByViewer(
    viewerId: number,
    userIds: number[],
  ): Promise<number[]> {
    if (!userIds || userIds.length === 0) return [];

    const rows = await this.userFollowRepository
      .createQueryBuilder('uf')
      .select('uf.following_id', 'following_id')
      .where('uf.follower_id = :viewerId', { viewerId })
      .andWhere('uf.following_id IN (:...ids)', { ids: userIds })
      .getRawMany();

    return rows.map((r) => Number(r.following_id));
  }

  // Count followers where following_id = userId
  async countFollowers(userId: number): Promise<number> {
    return this.userFollowRepository
      .createQueryBuilder('uf')
      .where('uf.following_id = :userId', { userId })
      .getCount();
  }

  // Count following where follower_id = userId
  async countFollowing(userId: number): Promise<number> {
    return this.userFollowRepository
      .createQueryBuilder('uf')
      .where('uf.follower_id = :userId', { userId })
      .getCount();
  }
}
