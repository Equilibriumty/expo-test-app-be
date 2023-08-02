import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SocialAuthDto } from './dto/auth.dto';
import { Request } from 'express';

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
  loginWithSocial(@Body() createAuthDto: SocialAuthDto, @Req() req: Request) {
    return this.authService.loginWithSocial(createAuthDto, req);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() createAuthDto: AuthDto) {
    return this.authService.register(createAuthDto);
  }
}
