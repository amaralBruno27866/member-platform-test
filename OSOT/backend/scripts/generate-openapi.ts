/**
 * Script to generate OpenAPI/Swagger JSON schema
 * 
 * Usage: npm run openapi:generate
 * Output: openapi.json in project root
 * 
 * This script bootstraps the NestJS app in test mode,
 * generates the complete OpenAPI document, and saves it to a file.
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenApiSpec() {
  console.log('🚀 Starting OpenAPI generation...');

  // Create NestJS application in silent mode
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  // Configure Swagger document (same as main.ts)
  const config = new DocumentBuilder()
    .setTitle('OSOT Dataverse API')
    .setDescription('API for integration with Dataverse and WordPress')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.osot.com', 'Production')
    .addTag('Authentication', 'Login, logout, token management')
    .addTag('Public Management Operations', 'Public user account operations')
    .addTag('Private Management Operations', 'Private user account operations')
    .addTag('Membership', 'Membership management endpoints')
    .build();

  // Generate the OpenAPI document
  const document = SwaggerModule.createDocument(app, config);

  // Save to file
  const outputPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  console.log('✅ OpenAPI specification generated successfully!');
  console.log(`📄 File saved to: ${outputPath}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Review the generated openapi.json file');
  console.log('   2. Use it with frontend code generators (e.g., openapi-generator)');
  console.log('   3. Share with frontend team for API integration');

  // Close app gracefully (ignore Redis errors on shutdown)
  try {
    await app.close();
  } catch (error) {
    // Suppress shutdown errors (e.g., Redis disconnect)
  }
  
  process.exit(0);
}

generateOpenApiSpec().catch((error) => {
  console.error('❌ Error generating OpenAPI spec:', error);
  process.exit(1);
});
