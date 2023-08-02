import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';
import { ProfileService } from '../profile/profile.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

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

  loginWithSocial(createAuthDto: SocialAuthDto) {
    return 'This action adds a new auth';
  }
}
