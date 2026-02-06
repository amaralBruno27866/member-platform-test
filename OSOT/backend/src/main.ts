/**
 * File: main.ts
 * Objective: Bootstrap and configure the NestJS application, including Swagger documentation and CORS settings.
 * Functionality: Initializes the app, enables CORS for the frontend, sets up Swagger for API documentation, and starts the server.
 * Expected Result: The API is available with proper documentation and CORS enabled, ready to receive requests.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import { BootstrapService } from './bootstrap/bootstrap.service';

async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // FIRST-TIME SETUP: Check if system needs initialization (no orgs exist)
  // This runs BEFORE the server starts listening
  const bootstrapService = app.get(BootstrapService);
  await bootstrapService.checkAndInitialize();

  // Add body parser BEFORE the logging middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Enable global validation pipe for DTOs (class-validator)
  // This ensures all incoming requests are validated and sanitized
  // Validation pipe configuration
  // NOTE: whitelist temporarily disabled to allow null values for clearing fields
  const { ValidationPipe, BadRequestException } = await import(
    '@nestjs/common'
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // TODO: Re-enable after fixing all DTOs to accept null
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: false,
      skipNullProperties: false, // Allow null values to pass through
      skipUndefinedProperties: false,
      exceptionFactory: (errors) => {
        // If the error is for osot_password, return a custom English message
        const passwordError = errors.find(
          (err) => err.property === 'osot_password',
        );
        if (passwordError) {
          return new BadRequestException(
            'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
          );
        }
        // Default error handling
        return new BadRequestException(errors);
      },
    }),
  );

  // Register global exception filter (centralized error handling)
  const { HttpExceptionFilter } = await import(
    './common/errors/http-exception.filter'
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for frontend applications
  const isDevelopment = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: isDevelopment
      ? [
          'http://localhost:3000', // Swagger UI (same server)
          'http://127.0.0.1:3000', // Swagger UI alternative
          'http://localhost:5173', // Vite dev server
          'http://127.0.0.1:5173', // Localhost alternativo
          // Network IPs para teste mobile (aceita qualquer IP 192.168.x.x)
          ...(process.env.WP_FRONTEND_URL?.split(',').map((url) =>
            url.trim(),
          ) || []),
        ].filter(Boolean) // Remove undefined/null
      : [
          process.env.WP_FRONTEND_URL,
          process.env.FRONTEND_URL,
          // Adicionar domínios de produção aqui quando disponíveis
        ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Permite cookies e headers de autenticação (JWT)
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'], // Headers que o frontend pode ler
    maxAge: 3600, // Cache do preflight por 1 hora
  });

  // Global middleware to log the body of all requests before validation
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH'
    ) {
      // Body logging removed for cleaner console output
    }
    next();
  });

  // Configure Swagger for API documentation
  const config = new DocumentBuilder()
    .setTitle('OSOT Dataverse API')
    .setDescription('API for integration with Dataverse and WordPress')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('http://127.0.0.1:3000', 'Local Development (127.0.0.1)')
    .addServer(
      process.env.API_URL ||
        `http://${process.env.NETWORK_IP || '192.168.1.1'}:3000`,
      'Network (Mobile Testing)',
    )
    .addTag('Health Check', 'API health and status endpoints')
    .addTag('Authentication', 'Login, logout, token management')
    .addTag('Public Enums', 'Public enum values for frontend dropdowns')
    .addTag('Public Management Operations', 'Public user account operations')
    .addTag('Private Management Operations', 'Private user account operations')
    .addTag('Membership', 'Membership management endpoints')
    .addTag('Public Product Operations', 'Public product catalog and search')
    .addTag('Private Product Operations', 'Admin product management (CRUD)')
    .addTag(
      'Public Organization Operations',
      'Public organization lookup (white-label login)',
    )
    .addTag(
      'Private Organization Operations',
      'Organization management (CRUD, Main privilege)',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Force inclusion of all optional properties in the schema
    ignoreGlobalPrefix: false,
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api-docs', app, document);

  // Expose OpenAPI JSON for frontend consumption
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/openapi.json',
  });

  // Start the server on the specified port or default to 3000
  // Listen on 0.0.0.0 to accept connections from network (mobile testing)
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (isDevelopment) {
    const networkIp = process.env.NETWORK_IP || '0.0.0.0';
    console.log(`📱 Mobile access: http://${networkIp}:${port}`);
    console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
    console.log(`🌐 Network Swagger: http://${networkIp}:${port}/api-docs`);
  }
}

// Start the application
void bootstrap();
