import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProviderType } from '../entities/profile.entity';

export class CreateProfileDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsEnum(ProviderType)
  @IsOptional()
  providerType?: ProviderType;
}
