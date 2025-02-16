import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { UserDto } from 'src/modules/user/dto/user.dto';

@InputType()
export class UserRegisterInput {
  @Field(() => String, { description: 'User Fullname Field' })
  fullname: string;

  @Field(() => String, { description: 'User Email Field' })
  email: string;

  @Field(() => String, { description: 'User Password Field' })
  password: string;


  @Field(() => String, { description: 'User BirthDate Field' })
  birthDate: string;

  @Field(() => String, { description: 'User Image Field', nullable: true })
  image?: string;
}

@InputType()
export class LoginInput {
  @Field(() => String, { description: 'User Email Field' })
  email: string;

  @Field(() => String, { description: 'User Password' })
  password: string;
}

@ObjectType()
export class AuthPayload {
  @Field(() => String, { description: 'Token authorization' })
  token: string;

  @Field(() => UserDto, { description: 'User object' })
  user: UserDto;
}
