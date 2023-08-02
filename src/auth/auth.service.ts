import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';
import { ProfileService } from '../profile/profile.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
  ) {}
  async validateUser(email: string, password: string) {
    const user = await this.profileService.findOne(email);

    if (!user) {
      throw new BadRequestException('Can`t find user with this email');
    }
    const isPasswordMatches = await argon2.verify(user.password, password);

    if (user && isPasswordMatches) {
      const payload = { sub: user.id, email: user.email };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    }

    throw new BadRequestException('Incorrect email or password');
  }

  login(createAuthDto: AuthDto) {
    return this.validateUser(createAuthDto.email, createAuthDto.password);
  }

  async register(createAuthDto: AuthDto) {
    const createdUser = await this.profileService.createProfile(createAuthDto);

    const payload = { sub: createdUser.id, email: createdUser.email };
    return { ...createdUser, token: await this.jwtService.signAsync(payload) };
  }

  async loginWithSocial(socialAuthDto: SocialAuthDto, req: Request) {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    const decodedData = this.jwtService.decode(token);

    if (!decodedData) throw new UnauthorizedException('Invalid token');

    const localUser = await this.profileService.findOne(decodedData['email']);

    if (!localUser) {
      const newUser = await this.profileService.createSocialProfile({
        email: decodedData['email'] ?? '',
        password: '',
        avatar: decodedData['picture'] ?? '',
        providerType: socialAuthDto.providerType,
      });

      return newUser;
    } else {
      delete localUser.password;

      return localUser;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
