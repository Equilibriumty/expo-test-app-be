import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateProfileDto } from '../src/profile/dto/create-profile.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile, ProviderType } from '../src/profile/entities/profile.entity';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUser: CreateProfileDto = {
    email: 'asdasd@gmail.com',
    password: 'test123',
  };
  const mockRepository = {
    find: jest.fn(async () => [
      {
        ...mockUser,
        password: await argon2.hash(mockUser.password),
      },
    ]),
    findOneBy: jest.fn(async () => ({
      ...mockUser,
      password: await argon2.hash(mockUser.password),
    })),
  };

  const mockRepository1 = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockReturnValue('mocked-token'),
          },
        },
      ],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('login with non-existent user: FAIL (POST)', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository1)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(400)
      .expect({
        message: 'Can`t find user with this email',
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  it('login: SUCCESS (POST)', () => {
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
    const mockRepository1 = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockReturnValue({
        id: 1,
        email: mockUser.email,
        username: mockUser.email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        providerType: ProviderType.CLASSIC,
        password: await argon2.hash(mockUser.password),
      }),
      findOneBy: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository1)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: mockUser.email,
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
    const mockRepository1 = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({
        ...mockUser,
        id: 1,
      }),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository1)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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
});
