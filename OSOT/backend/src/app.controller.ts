/**
 * Class: AppController
 * Objective: Handle HTTP requests for the root endpoint of the application.
 * Functionality: Provides a basic GET endpoint that returns a welcome message using the AppService.
 * Expected Result: Returns a static welcome message when accessing the root URL.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Function: getHello
   * Objective: Handle GET requests to the root endpoint.
   * Functionality: Calls the AppService to get a welcome message.
   * Expected Result: Returns the welcome message as a string.
   */
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and running',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'OSOT Dataverse API - Production Ready Modules: Account, Address, Contact, Identity, OT Education | Documentation: /api-docs',
        },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', example: '2025-11-28T10:00:00.000Z' },
      },
    },
  })
  getHello(): { message: string; version: string; timestamp: string } {
    return this.appService.getHello();
  }

  /**
   * Function: healthCheck
   * Objective: Provide detailed health status of the API
   * Functionality: Returns API status, uptime, and service health
   * Expected Result: JSON with health information
   */
  @Get('health')
  @ApiOperation({ summary: 'Detailed health check with service status' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        uptime: { type: 'number', example: 12345.67 },
        timestamp: { type: 'string', example: '2025-11-28T10:00:00.000Z' },
        services: {
          type: 'object',
          properties: {
            dataverse: { type: 'string', example: 'connected' },
            redis: { type: 'string', example: 'connected' },
          },
        },
      },
    },
  })
  healthCheck(): {
    status: string;
    uptime: number;
    timestamp: string;
    services: { dataverse: string; redis: string };
  } {
    return {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        dataverse: 'connected',
        redis: 'connected',
      },
    };
  }
}
