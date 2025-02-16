import { MetaData } from '@common/dto/metaData.dto';
import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';

@ObjectType()
export class UserDto {
  constructor(entity: UserDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'User ID' })
  id: number;

  @Field(() => String, { description: 'User Fullname', nullable: true })
  fullname?: string;

  @Field(() => String, { description: 'User Email' })
  email: string;

  // ToDo: we need to add Scalar Date class custom
  @Field(() => Date, { description: 'User Birthdate' })
  birthDate: Date;

  @Field(() => String, { description: 'User Image', nullable: true })
  image?: string;

  @Field(() => String, { description: 'User Created At' })
  createdAt: string;

  @Field(() => String, { description: 'User Updated At' })
  updatedAt: string;

  @Field(() => Date, { description: 'User Deleted At', nullable: true })
  deletedAt?: Date;
}

@ObjectType()
export class UserListData {
  @Field(() => [UserDto], { description: 'Users data' })
  users: UserDto[];

  @Field(() => MetaData, { description: 'metadata desc' })
  meta: MetaData;
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { description: 'User Fullname Field', nullable: true })
  fullname?: string;

  @Field(() => String, { description: 'User Email Field', nullable: true })
  email?: string;

  // @Field(() => String, { description: 'User Gender Field', nullable: true })
  // gender?: string;

  @Field(() => String, { description: 'User BirthDate Field' })
  birthDate: string;

  @Field(() => String, { description: 'User Image Field', nullable: true })
  image?: string;
}
