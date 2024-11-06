import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRegisterInput } from 'src/modules/auth/dto/auth.dto';
import { GraphQLError } from 'graphql';
import { UpdateUserInput, UserDto } from './dto/user.dto';
import { hashingPassword, validateEmail } from '@common/helpers/auth.helper';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userRegisterInput: UserRegisterInput): Promise<UserDto> {
    try {
      const userEmail = await this.userRepository
        .createQueryBuilder('users')
        .select(['users.email'])
        .where('users.email = :email', { email: userRegisterInput.email })
        .getOne();

      validateEmail(userEmail?.email);

      const hashedPassword = await hashingPassword(userRegisterInput.password);

      const user: User = this.userRepository.create({
        fullname: userRegisterInput.fullname,
        email: userRegisterInput.email,
        image: userRegisterInput.image,
        gender: userRegisterInput.gender,
        birthDate: userRegisterInput.birthDate,
        password: hashedPassword,
      });

      const result = await this.userRepository.save(user);

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      const userDto: UserDto = {
        ...result,
        createdAt,
        updatedAt,
      };

      return userDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async update(id: number, userUpdateInput: UpdateUserInput): Promise<UserDto> {
    try {
      const existingUser = await this.userRepository
        .createQueryBuilder('users')
        .where('users.id = :id', { id: id })
        .getOne();

      const existingUserEmail = await this.userRepository
        .createQueryBuilder('users')
        .select(['users.id', 'users.email'])
        .where('users.id = :id', { id })
        .andWhere('users.email = :email', { email: userUpdateInput.email })
        .getOne();

      if (!existingUser) {
        throw new NotFoundException('User not found.');
      }

      if (!existingUserEmail) {
        const existingEmail = await this.userRepository
          .createQueryBuilder('users')
          .select(['users.id', 'users.email'])
          .where('users.email = :email', { email: userUpdateInput.email })
          .getOne();

        if (existingEmail) {
          validateEmail(existingEmail.email);
        }
      }

      Object.assign(existingUser, userUpdateInput);

      const result = await this.userRepository.save(existingUser);

      const createdAt: string = utcToAsiaJakarta(result.createdAt);
      const updatedAt: string = utcToAsiaJakarta(result.updatedAt);

      const userDto: UserDto = {
        ...result,
        createdAt,
        updatedAt,
      };

      return userDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findAll() {
    const data = await this.userRepository
      .createQueryBuilder('users')
      .where('deleted_at IS NULL')
      .orderBy('users.id', 'DESC')
      .skip(10 * 0)
      .take(10)
      .getManyAndCount();

    const metaData = {
      pageSize: 10,
      currentPage: 0,
      total: data[1],
      totalPage: Math.ceil(data[1] / 10),
    };

    const result = {
      users: data[0],
      meta: metaData,
    };

    return result;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository
      .createQueryBuilder('users')
      .where('users.email = :email', { email })
      .andWhere('users.deleted_at IS NULL')
      .getOne();
  }

  async findById(id: number): Promise<UserDto> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('users')
        .where('users.id = :id', { id: id })
        .andWhere('users.deleted_at IS NULL')
        .getOne();

      const createdAt: string = utcToAsiaJakarta(user.createdAt);
      const updatedAt: string = utcToAsiaJakarta(user.updatedAt);

      const userDto: UserDto = {
        ...user,
        createdAt,
        updatedAt,
      };

      return userDto;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}
