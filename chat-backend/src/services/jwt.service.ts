import {TokenService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {sign, verify} from 'jsonwebtoken';

export class JWTService implements TokenService {
  constructor(
    @inject('authentication.jwt.secret')
    private jwtSecret: string,
    @inject('authentication.jwt.expiresIn')
    private jwtExpiresIn: string,
  ) {}

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let userProfile: UserProfile;

    try {
      const decodedToken = verify(token, this.jwtSecret) as {
        id: string;
        email: string;
        username: string;
      };
      userProfile = {
        [securityId]: decodedToken.id,
        id: decodedToken.id,
        email: decodedToken.email,
        username: decodedToken.username,
      };
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }

    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error generating token : userProfile is null',
      );
    }

    let token: string;
    try {
      token = sign(
        {
          id: userProfile[securityId],
          email: userProfile.email,
          username: userProfile.username,
        },
        this.jwtSecret,
        {
          expiresIn: Number(this.jwtExpiresIn),
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
