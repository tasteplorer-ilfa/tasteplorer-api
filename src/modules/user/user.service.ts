import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRegisterInput } from 'src/modules/auth/dto/auth.dto';
import { GraphQLError } from 'graphql';
import { UpdateUserInput, UserDto } from './dto/user.dto';
import { hashingPassword, validateEmail } from '@common/helpers/auth.helper';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(userRegisterInput: UserRegisterInput): Promise<UserDto> {
    try {
      const userEmail = await this.userRepository.findUserByEmail(
        userRegisterInput.email,
      );

      validateEmail(userEmail?.email);

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

  async findById(id: number): Promise<UserDto> {
    try {
      const user = await this.userRepository.findById(id);

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      const userDto: UserDto = new UserDto({
        ...user,
        createdAt,
        updatedAt,
      });

      return userDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }
}
