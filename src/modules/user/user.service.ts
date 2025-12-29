import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRegisterInput } from 'src/modules/auth/dto/auth.dto';
import { GraphQLError } from 'graphql';
import {
  ProfileDTO,
  SuggestedUserDto,
  UpdateUserInput,
  UserDto,
  UserSuggestionListDto,
} from './dto/user.dto';
import {
  hashingPassword,
  validateEmail,
  validateUsername,
} from '@common/helpers/auth.helper';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { UserRepository } from './user.repository';
import { UserInputError } from '@nestjs/apollo';
import { UserFollow } from './entities/user-follow.entity';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import {
  GetSuggestedUsersRequest,
  UserSuggestionService,
} from './grpc/engagement.interface';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class UserService implements OnModuleInit {
  private userSuggestionService: UserSuggestionService;

  constructor(
    private userRepository: UserRepository,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitMQClient: ClientProxy,
    @Inject('ENGAGEMENT_SERVICE')
    private readonly engagementClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userSuggestionService =
      this.engagementClient.getService<UserSuggestionService>(
        'UserSuggestionService',
      );
  }

  async create(userRegisterInput: UserRegisterInput): Promise<UserDto> {
    try {
      const userEmail = await this.userRepository.findUserByEmail(
        userRegisterInput.email,
      );
      const existingUsername = await this.userRepository.findUserByUsername(
        userRegisterInput.username,
      );

      validateEmail(userEmail?.email);
      validateUsername(existingUsername?.username);

      const hashedPassword = await hashingPassword(userRegisterInput.password);

      const user: User = await this.userRepository.create(
        userRegisterInput,
        hashedPassword,
      );

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      const userDto: UserDto = new UserDto({
        ...user,
        createdAt,
        updatedAt,
      });

      return userDto;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw new UserInputError(error.message);
      }

      throw new GraphQLError(error.message);
    }
  }

  async update(id: number, userUpdateInput: UpdateUserInput): Promise<UserDto> {
    try {
      const existingUser =
        await this.userRepository.findUserByIdIgnoreDeletedAt(id);

      const existingUserEmail = await this.userRepository.findExistingUserEmail(
        id,
        userUpdateInput.email,
      );

      const existingUsername =
        await this.userRepository.findUserByIdAndUsername(
          id,
          userUpdateInput.username,
        );

      if (!existingUser) {
        throw new NotFoundException('User not found.');
      }

      if (!existingUserEmail) {
        const existingEmail = await this.userRepository.findUserByEmail(
          userUpdateInput.email,
        );

        if (existingEmail) {
          validateEmail(existingEmail.email);
        }
      }

      if (!existingUsername) {
        const user = await this.userRepository.findUserByUsername(
          userUpdateInput.username,
        );

        if (user) {
          validateUsername(user.username);
        }
      }

      Object.assign(existingUser, userUpdateInput);

      const result = await this.userRepository.update(existingUser);

      const createdAt: string = utcToAsiaJakarta(result.createdAt);
      const updatedAt: string = utcToAsiaJakarta(result.updatedAt);

      const userDto: UserDto = new UserDto({
        ...result,
        createdAt,
        updatedAt,
      });

      return userDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findById(id: number) {
    try {
      const user = await this.userRepository.findById(id);

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      const result: ProfileDTO = new ProfileDTO({
        ...user,
        createdAt,
        updatedAt,
      });

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findByUsername(username);
  }

  // Handling User Follow Logic
  async followUser(
    followerId: number,
    followingId: number,
  ): Promise<UserFollow> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const isAlreadyFollowing = await this.userRepository.isFollowing(
      followerId,
      followingId,
    );

    if (isAlreadyFollowing) {
      throw new ConflictException('You are already following this user.');
    }

    const existingUser = await this.userRepository.findById(followingId);

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    // 🔥 Send event to Notification Service through RabbitMQ
    this.rabbitMQClient.emit('user.followed', {
      followerId,
      followingId,
      message: `error User ${followerId} followed user ${followingId}`,
    });

    return this.userRepository.createUserFollow(followerId, followingId);
  }

  async unFollowUser(
    followerId: number,
    followingId: number,
  ): Promise<boolean> {
    const follow = await this.userRepository.findOneUserFollow(
      followerId,
      followingId,
    );

    if (!follow) {
      throw new NotFoundException('Follow relationship not found.');
    }

    await this.userRepository.removeFollowRelationship(follow);
    return true;
  }

  /**
   * Find users with cursor-based pagination and search
   * @param search - Search term for username or fullname
   * @param cursor - Cursor for pagination (last user ID)
   * @param limit - Number of results per page (default 20, max 50)
   */
  async findUsersWithCursorPagination(
    search?: string,
    cursor?: number,
    limit: number = 20,
  ) {
    try {
      // Enforce limit boundaries
      const effectiveLimit = Math.min(Math.max(limit || 20, 1), 50);

      // Fetch users and total count in parallel
      const { users, total } =
        await this.userRepository.findUsersWithCursorPagination(
          search,
          cursor,
          effectiveLimit,
        );

      // Determine if more results exist
      const hasMore = users.length > effectiveLimit;

      // Remove the extra item if it exists
      const data = hasMore ? users.slice(0, effectiveLimit) : users;

      // Extract nextCursor from the last item
      const nextCursor =
        hasMore && data.length > 0 ? data[data.length - 1].id : null;

      // Map to DTOs with timezone conversion
      const userDtos = data.map((user) => {
        const createdAt = utcToAsiaJakarta(user.createdAt);
        const updatedAt = utcToAsiaJakarta(user.updatedAt);

        return new UserDto({
          ...user,
          createdAt,
          updatedAt,
        });
      });

      return {
        data: userDtos,
        nextCursor,
        hasMore,
        total,
      };
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async getSuggestedUsers(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<UserSuggestionListDto> {
    try {
      // Validate limit
      if (limit > 100) {
        throw new BadRequestException('Limit cannot exceed 100');
      }

      const request: GetSuggestedUsersRequest = {
        limit,
        offset,
      };

      // Create metadata with user-id
      const metadata = new Metadata();
      metadata.set('user-id', userId.toString());

      console.log('🔍 Sending gRPC request with metadata:', {
        userId,
        limit,
        offset,
        metadataMap: metadata.getMap(),
      });

      // Call gRPC service with metadata directly as second parameter
      const response = await firstValueFrom(
        this.userSuggestionService.getSuggestedUsers(request, metadata),
      );

      console.log('✅ Received gRPC response:', {
        usersCount: response?.users?.length,
        totalCount: response?.total_count,
        hasMore: response?.has_more,
      });

      if (!response || !response.users) {
        return new UserSuggestionListDto({
          users: [],
          totalCount: 0,
          hasMore: false,
        });
      }

      // Map gRPC response to DTO
      const users = response.users.map(
        (user) =>
          new SuggestedUserDto({
            userId: user.user_id,
            username: user.username,
            fullName: user.full_name,
            profileImageUrl: user.profile_image_url || null,
            followerCount: user.follower_count,
            mutualFollowerCount: user.mutual_follower_count,
            mutualConnectionUsernames: user.mutual_connection_usernames,
            suggestionScore: user.suggestion_score,
            suggestionReason: user.suggestion_reason,
          }),
      );

      return new UserSuggestionListDto({
        users,
        totalCount: response.total_count,
        hasMore: response.has_more,
      });
    } catch (error) {
      console.error('❌ gRPC Error Details:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // Handle gRPC errors gracefully
      if (error.code === 'UNAVAILABLE' || error.code === 14) {
        throw new GraphQLError(
          'User suggestion service is currently unavailable',
        );
      }
      if (error.code === 'UNAUTHENTICATED' || error.code === 16) {
        throw new GraphQLError(
          'Failed to authenticate with user suggestion service: ' +
            error.message,
        );
      }
      throw new GraphQLError(
        error.message || 'Failed to fetch user suggestions',
      );
    }
  }
}
