/**
 * Configuration Controller
 *
 * Provides runtime configuration to frontend clients.
 * Enables automatic backend URL discovery for cross-machine deployments.
 *
 * Use Case: Frontend running on 192.168.10.50, Backend on 192.168.10.66
 * Frontend calls: http://192.168.10.66:3000/config
 * Response: { apiUrl: "http://192.168.10.66:3000" }
 *
 * @author OSOT Development Team
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Configuration')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get backend configuration for frontend
   *
   * Returns the backend's own API URL so frontend can discover it.
   * This endpoint must be called with the actual backend IP.
   *
   * @returns Backend configuration including API URL
   */
  @Get()
  @ApiOperation({
    summary: 'Get backend configuration',
    description:
      'Returns backend API URL for frontend discovery. Frontend must know backend IP to call this endpoint initially.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        apiUrl: {
          type: 'string',
          example: 'http://192.168.10.66:3000',
          description: 'Complete backend API URL',
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: 'Backend API version',
        },
        environment: {
          type: 'string',
          example: 'development',
          description: 'Current environment',
        },
      },
    },
  })
  getConfig(): {
    apiUrl: string;
    version: string;
    environment: string;
  } {
    const apiUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3000';

    return {
      apiUrl,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
