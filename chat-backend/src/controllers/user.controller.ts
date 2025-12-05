import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  requestBody,
  response,
  HttpErrors,
  SchemaObject,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate, TokenService} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {CustomUserService, Credentials} from '../services/user.service';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 6,
    },
  },
};

const UserRegistrationSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password', 'username'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 6,
    },
    username: {
      type: 'string',
      minLength: 3,
    },
  },
};

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('services.CustomUserService')
    public userService: CustomUserService,
    @inject('services.JWTService')
    public jwtService: TokenService,
  ) {}

  @post('/users/register')
  @response(200, {
    description: 'User registration',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            token: {type: 'string'},
            user: getModelSchemaRef(User, {exclude: ['password']}),
          },
        },
      },
    },
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: UserRegistrationSchema,
        },
      },
    })
    userData: {email: string; password: string; username: string},
  ): Promise<{token: string; user: Omit<User, 'password'>}> {
    const user = await this.userService.createUser(userData);
    const userProfile = this.userService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile);

    const {password, ...userWithoutPassword} = user;
    return {token, user: userWithoutPassword as Omit<User, 'password'>};
  }

  @post('/users/login')
  @response(200, {
    description: 'User login',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            token: {type: 'string'},
            user: getModelSchemaRef(User, {exclude: ['password']}),
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: CredentialsSchema,
        },
      },
    })
    credentials: Credentials,
  ): Promise<{token: string; user: Omit<User, 'password'>}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile);

    const {password, ...userWithoutPassword} = user;
    return {token, user: userWithoutPassword as Omit<User, 'password'>};
  }

  @authenticate('jwt')
  @get('/users/me')
  @response(200, {
    description: 'Current user profile',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {exclude: ['password']}),
      },
    },
  })
  async getCurrentUser(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Omit<User, 'password'>> {
    const userId = currentUserProfile[securityId];
    const user = await this.userRepository.findById(userId);
    const {password, ...userWithoutPassword} = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  @authenticate('jwt')
  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {exclude: ['password']}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Omit<User, 'password'>[]> {
    const currentUserId = currentUserProfile[securityId];
    const users = await this.userRepository.find({
      where: {id: {neq: currentUserId}},
    });
    return users.map(user => {
      const {password, ...userWithoutPassword} = user;
      return userWithoutPassword as Omit<User, 'password'>;
    });
  }

  @authenticate('jwt')
  @get('/users/search')
  @response(200, {
    description: 'Search users by username or email',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {exclude: ['password']}),
        },
      },
    },
  })
  async search(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('q') query: string,
  ): Promise<Omit<User, 'password'>[]> {
    const currentUserId = currentUserProfile[securityId];
    
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    // Escape special regex characters for safe use in regexp
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = new RegExp(escapedTerm, 'i');
    
    // Use database-level filtering with regexp for better scalability
    const matchingUsers = await this.userRepository.find({
      where: {
        and: [
          {id: {neq: currentUserId}},
          {
            or: [
              {username: {regexp: regexPattern}},
              {email: {regexp: regexPattern}},
            ],
          },
        ],
      },
    });

    return matchingUsers.map(user => {
      const {password, ...userWithoutPassword} = user;
      return userWithoutPassword as Omit<User, 'password'>;
    });
  }

  @authenticate('jwt')
  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {exclude: ['password']}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    const {password, ...userWithoutPassword} = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}
