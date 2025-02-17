import { AuthenticationError, UserInputError } from '@nestjs/apollo';
import { User } from 'src/modules/user/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export function validateEmail(email: string) {
  if (email) {
    throw new Error('Email already registered!');
  }
}

export function validateUsername(username: string) {
  if (username) {
    throw new UserInputError('Username already registered!');
  }
}

export async function validateExistUser(user: User, password: string) {
  if (!user) {
    throw new AuthenticationError('Invalid credentials.');
  }

  const isPasswordValid = await bcrypt.compare(password, user?.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid credentials.');
  }
}

export async function hashingPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainText, salt);

  return hashedPassword;
}
