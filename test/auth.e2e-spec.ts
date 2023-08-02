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
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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

  it('social sign in, user already exists, should return user: SUCCESS (POST)', async () => {
    const mockRepository = {
      findOne: jest.fn().mockResolvedValue({
        ...mockUser,
        providerType: ProviderType.GOOGLE,
      }),

      findOneBy: jest.fn().mockResolvedValue({
        ...mockUser,
        providerType: ProviderType.GOOGLE,
        username: mockUser.email.split('@')[0],
      }),
    };

    const jwtMock = {
      decode: jest
        .fn()
        .mockReturnValue({ sub: 'user_sub', email: mockUser.email }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository)

      .overrideProvider(JwtService)
      .useValue(jwtMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .post('/auth/login/social')
      .send({ providerType: ProviderType.GOOGLE })
      .set('Authorization', 'Bearer mocked-token')
      .expect(200)
      .expect({
        email: mockUser.email,
        providerType: ProviderType.GOOGLE,
        username: mockUser.email.split('@')[0],
      });
  });

  it('social sign in, user does not exist, should return created user: SUCCESS (POST)', async () => {
    const mockRepository = {
      findOne: jest.fn().mockResolvedValue({
        ...mockUser,
        providerType: ProviderType.GOOGLE,
      }),
      save: jest.fn().mockResolvedValue({
        ...mockUser,
        providerType: ProviderType.GOOGLE,
        username: mockUser.email.split('@')[0],
      }),
      findOneBy: jest.fn().mockResolvedValue(null),
    };

    const jwtMock = {
      decode: jest
        .fn()
        .mockReturnValue({ sub: 'user_sub', email: mockUser.email }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository)

      .overrideProvider(JwtService)
      .useValue(jwtMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .post('/auth/login/social')
      .send({ providerType: ProviderType.GOOGLE })
      .set('Authorization', 'Bearer mocked-token')
      .expect(200)
      .expect({
        email: mockUser.email,
        providerType: ProviderType.GOOGLE,
        username: mockUser.email.split('@')[0],
      });
  });

  it('social sign in, invalid token: SUCCESS (POST)', async () => {
    const jwtMock = {
      decode: jest.fn().mockReturnValue(null),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })

      .overrideProvider(JwtService)
      .useValue(jwtMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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
});
