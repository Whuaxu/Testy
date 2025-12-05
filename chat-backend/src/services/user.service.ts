import {UserService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {compare, hash} from 'bcryptjs';
import {User} from '../models';
import {UserRepository} from '../repositories';

export type Credentials = {
  email: string;
  password: string;
};

export class CustomUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const invalidCredentialsError = 'Invalid email or password.';

    const foundUser = await this.userRepository.findByEmail(credentials.email);
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = await compare(
      credentials.password,
      foundUser.password,
    );
    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user.id!,
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  async createUser(userData: Partial<User>): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email!);
    if (existingUser) {
      throw new HttpErrors.Conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hash(userData.password!, 10);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user;
  }
}
