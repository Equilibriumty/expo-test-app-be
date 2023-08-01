import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { ProviderType } from 'src/profile/entities/profile.entity';

export class AuthDto {
  @IsEmail()
  @IsString()
  @ApiProperty({
    name: 'email',
    description: 'Email of the user',
    nullable: false,
  })
  email: string;

  @IsString()
  @ApiProperty({
    name: 'password',
    description: 'Password of the user',
    nullable: false,
  })
  password: string;
}

export class SocialAuthDto {
  @IsEnum(ProviderType)
  @ApiProperty({ enum: ProviderType })
  providerType: ProviderType;
}
