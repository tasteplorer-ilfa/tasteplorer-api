import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRegisterInput } from '@module/auth/dto/auth.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(input: UserRegisterInput, hashedPassword: string) {
    const { fullname, email, image, birthDate } = input;

    const user = this.repository.create({
      fullname,
      email,
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
    return this.repository
      .createQueryBuilder('users')
      .where('users.id = :id', { id: id })
      .andWhere('users.deleted_at IS NULL')
      .getOne();
  }

  async findByEmail(email: string) {
    return this.repository
      .createQueryBuilder('users')
      .where('users.email = :email', { email })
      .andWhere('users.deleted_at IS NULL')
      .getOne();
  }
}
