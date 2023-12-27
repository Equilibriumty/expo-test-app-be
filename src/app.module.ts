import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port:
          process.env.NODE_ENV === 'test'
            ? configService.get('TEST_DB_PORT')
            : configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password:
          process.env.NODE_ENV === 'test'
            ? configService.get('TEST_DB_PASSWORD')
            : configService.get('DB_PASSWORD'),
        database:
          process.env.NODE_ENV === 'test'
            ? configService.get('TEST_DB_NAME')
            : configService.get('DB_NAME'),
        synchronize: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ProfileModule,
  ],
})
export class AppModule {}
