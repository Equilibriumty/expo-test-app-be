import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateProfileDto } from '../src/profile/dto/create-profile.dto';
import { ProviderType } from '../src/profile/entities/profile.entity';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const mockUser: CreateProfileDto = {
    email: 'asdasd@gmail.com',
    password: 'test123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = app.get<JwtService>(JwtService);
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource) {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    }
    await app.close();
  });

  it('login with non-existent user: FAIL (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'non_existent@gmail.com',
        password: mockUser.password,
      })
      .expect(400)
      .expect({
        message: 'Can`t find user with this email',
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  it('login: SUCCESS (POST)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('access_token');
      });
  });

  it('register: SUCCESS (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'register@gmail.com',
        password: mockUser.password,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('providerType');
        expect(response.body.providerType).toBe(ProviderType.CLASSIC);
      });
  });
  it('register, user already exists: FAIL (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(400)
      .expect({
        message: 'Profile already exists',
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  it('social sign in, user already exists, should return user: SUCCESS (POST)', async () => {
    const userGoogle = {
      email: 'social_sign_in@gmail.com',
      password: 'test123',
      providerType: ProviderType.GOOGLE,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userGoogle)
      .expect(200);

    return request(app.getHttpServer())
      .post('/auth/login/social')
      .send({ providerType: ProviderType.GOOGLE })
      .set('Authorization', `Bearer ${response.body.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          email: userGoogle.email,
          providerType: ProviderType.GOOGLE,
          username: userGoogle.email.split('@')[0],
        });
      });
  });
  it('social sign in, invalid token: SUCCESS (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login/social')
      .send({ providerType: ProviderType.GOOGLE })
      .set('Authorization', 'Bearer mocked-token')
      .expect(401)
      .expect({
        message: 'Invalid token',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it('social sign in, user does not exist, should return created user: SUCCESS (POST)', async () => {
    const userNonExistentGoogle = {
      email: 'non_google@gmail.com',
      password: 'test123',
      providerType: ProviderType.GOOGLE,
    };

    const payload = { email: userNonExistentGoogle.email, sub: '1234567890' };

    const token = await jwtService.signAsync(payload);

    return request(app.getHttpServer())
      .post('/auth/login/social')
      .send({ providerType: ProviderType.GOOGLE })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) =>
        expect(response.body).toMatchObject({
          email: userNonExistentGoogle.email,
          providerType: ProviderType.GOOGLE,
          username: userNonExistentGoogle.email.split('@')[0],
        }),
      );
  });
});
