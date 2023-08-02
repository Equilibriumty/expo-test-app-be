import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto) {
    const existingProfile = await this.profileRepository.findOne({
      where: {
        email: createProfileDto.email,
      },
    });
    if (existingProfile)
      throw new BadRequestException('Profile already exists');

    const user = await this.profileRepository.save({
      email: createProfileDto.email,
      password: await argon2.hash(createProfileDto.password),
      username: createProfileDto.email.split('@')[0],
      providerType: createProfileDto.providerType,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      providerType: user.providerType,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto) {
    const userToUpdate = await this.profileRepository.findOneBy({ id: id });

    if (userToUpdate) {
      const updatedUser = await this.profileRepository.save({
        ...userToUpdate,
        ...updateProfileDto,
      });
      return updatedUser;
    }
  }

  async getMyProfile(req: any) {
    const profile = await this.profileRepository.findOneBy({
      id: req.user.sub,
    });
    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      avatar: profile.avatar,
      providerType: profile.providerType,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async findOne(email: string) {
    const user = await this.profileRepository.findOneBy({ email });
    return user;
  }
}
