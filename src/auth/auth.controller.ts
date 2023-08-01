import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() createAuthDto: AuthDto) {
    return this.authService.login(createAuthDto);
  }

  @Post('login/social')
  loginWithSocial(@Body() createAuthDto: SocialAuthDto) {
    return this.authService.loginWithSocial(createAuthDto);
  }

  @Post('register')
  register(@Body() createAuthDto: AuthDto) {
    return this.authService.register(createAuthDto);
  }
}
