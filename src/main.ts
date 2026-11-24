import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required: Better Auth handles its own body parsing
    bodyParser: false,
  });
  app.use(helmet());
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hackathon Management API')
    .setDescription(
      'API documentation for authentication, users, and Hackathon management.',
    )
    .setVersion('1.0')
    .addCookieAuth(
      'better-auth.session_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
      },
      'better-auth-cookie',
    )
    .addTag('Authentication', 'Better Auth session, signup, signin, signout, and health endpoints')
    .addTag('App', 'Public application endpoints')
    .addTag('Users', 'User lookup operations')
    .addTag('Hackathons', 'Hackathon CRUD, joining, leaving, filtering, and pagination')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const authPath = '/api/auth';
  document.paths ??= {};
  document.paths[`${authPath}/sign-up/email`] = {
    post: {
      tags: ['Authentication'],
      summary: 'Create an account',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password', minLength: 8 },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Account created and session cookie returned' },
        400: { description: 'Invalid signup data' },
      },
    },
  };
  document.paths[`${authPath}/sign-in/email`] = {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in with email and password',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Signed in and session cookie returned' },
        401: { description: 'Invalid credentials' },
      },
    },
  };
  document.paths[`${authPath}/session`] = {
    get: {
      tags: ['Authentication'],
      summary: 'Get the current Better Auth session',
      security: [{ 'better-auth-cookie': [] }],
      responses: {
        200: { description: 'Current session and user returned' },
        401: { description: 'No valid session' },
      },
    },
  };
  document.paths[`${authPath}/sign-out`] = {
    post: {
      tags: ['Authentication'],
      summary: 'Sign out the current session',
      security: [{ 'better-auth-cookie': [] }],
      responses: {
        200: { description: 'Session signed out' },
        401: { description: 'No valid session' },
      },
    },
  };
  document.paths[`${authPath}/ok`] = {
    get: {
      tags: ['Authentication'],
      summary: 'Better Auth health check',
      security: [],
      responses: {
        200: { description: 'Authentication service is available' },
      },
    },
  };

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
