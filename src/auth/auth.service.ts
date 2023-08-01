import { Injectable } from '@nestjs/common';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  login(createAuthDto: AuthDto) {
    return 'This action adds a new auth';
  }
  register(createAuthDto: AuthDto) {
    return 'This action adds a new auth';
  }

  loginWithSocial(createAuthDto: SocialAuthDto) {
    return 'This action adds a new auth';
  }
}
