import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRegisterInput } from 'src/modules/auth/dto/auth.dto';
import { GraphQLError } from 'graphql';
import { ProfileDTO, UpdateUserInput, UserDto } from './dto/user.dto';
import {
  hashingPassword,
  validateEmail,
  validateUsername,
} from '@common/helpers/auth.helper';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { UserRepository } from './user.repository';
import { UserInputError } from '@nestjs/apollo';
import { UserFollow } from './entities/user-follow.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitMQClient: ClientProxy,
  ) {}

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

    console.log('success publish message rabbitmq yuhuu');

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
}
