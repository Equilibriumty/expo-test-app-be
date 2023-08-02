import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';
import { ProfileService } from 'src/profile/profile.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() createAuthDto: AuthDto) {
    return this.authService.login(createAuthDto);
  }

  @Post('login/social')
  @HttpCode(HttpStatus.OK)
  loginWithSocial(@Body() createAuthDto: SocialAuthDto) {
    return this.authService.loginWithSocial(createAuthDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() createAuthDto: AuthDto) {
    return this.authService.register(createAuthDto);
  }
}
