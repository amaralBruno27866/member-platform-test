/**
 * Class: DataverseService
 * Objective: Provide a flexible and secure integration layer for Microsoft Dataverse API using multiple app credentials.
 * Functionality: Handles authentication, token management, and generic CRUD requests to Dataverse, supporting different app contexts.
 * Expected Result: Allows any module to communicate with Dataverse using the correct credentials and robust error handling.
 */
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { createAppError } from '../common/errors/error.factory';
import { ErrorCodes } from '../common/errors/error-codes';

/**
 * Interface: TokenResponse
 * Objective: Define the expected structure of the Azure AD token response.
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  ext_expires_in: number;
}

/**
 * Interface: DataverseCredentials
 * Objective: Represent a set of credentials for authenticating with Dataverse.
 */
export interface DataverseCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  dataverseUrl: string;
}

@Injectable()
export class DataverseService {
  private readonly logger = new Logger(DataverseService.name);

  // Rate limiting: track requests per minute per app context
  private requestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 100; // Configurable limit

  /**
   * Function: constructor
   * Objective: Initialize the service with required dependencies and validate critical env vars.
   * Functionality: Receives HttpService, ConfigService and RedisService for HTTP requests, config access and persistent caching.
   * Expected Result: Service is ready to use for Dataverse operations with validated configuration.
   */
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.validateConfiguration();
  }

  /**
   * Function: validateConfiguration
   * Objective: Validate that all required environment variables are properly configured.
   * Functionality: Checks for critical env vars and logs clear error messages if missing.
   * Expected Result: Throws descriptive errors for missing configuration or logs success.
   */
  private validateConfiguration(): void {
    const requiredVars = [
      'MAIN_CLIENT_ID',
      'MAIN_CLIENT_SECRET',
      'MAIN_TENANT_ID',
      'OWNER_CLIENT_ID',
      'OWNER_CLIENT_SECRET',
      'ADMIN_CLIENT_ID',
      'ADMIN_CLIENT_SECRET',
      'DYNAMICS_URL',
    ];

    const missing = requiredVars.filter(
      (varName) => !this.configService.get(varName),
    );

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
      this.logger.error(errorMsg);
      throw createAppError(
        ErrorCodes.DATAVERSE_SERVICE_ERROR,
        { missingVars: missing },
        HttpStatus.INTERNAL_SERVER_ERROR,
        errorMsg,
      );
    }

    this.logger.log('DataverseService: Configuration validated successfully');
  }

  /**
   * Function: checkRateLimit
   * Objective: Implement basic rate limiting to prevent API overload.
   * Functionality: Tracks requests per app context and enforces per-minute limits.
   * Expected Result: Throws exception if rate limit exceeded, otherwise allows request.
   */
  private checkRateLimit(appContext: string): void {
    const now = Date.now();
    const key = appContext || 'default';
    const current = this.requestCounts.get(key);

    // Reset counter if minute has passed
    if (!current || now >= current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
      return;
    }

    if (current.count >= this.MAX_REQUESTS_PER_MINUTE) {
      throw createAppError(
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        {
          appContext: key,
          currentCount: current.count,
          maxAllowed: this.MAX_REQUESTS_PER_MINUTE,
          resetTime: new Date(current.resetTime).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
        `Rate limit exceeded for app context '${key}'. Max ${this.MAX_REQUESTS_PER_MINUTE} requests per minute.`,
      );
    }

    current.count++;
  }

  /**
   * Function: getDefaultCredentials
   * Objective: Retrieve the default (main app) credentials from environment variables.
   * Functionality: Reads MAIN_CLIENT_ID, MAIN_CLIENT_SECRET, MAIN_TENANT_ID, DYNAMICS_URL from .env.
   * Expected Result: Returns a DataverseCredentials object for the main app.
   */
  getDefaultCredentials(): DataverseCredentials {
    return {
      clientId: this.getEnvOrThrow('MAIN_CLIENT_ID'), // Main app client ID
      clientSecret: this.getEnvOrThrow('MAIN_CLIENT_SECRET'), // Main app client secret
      tenantId: this.getEnvOrThrow('MAIN_TENANT_ID'), // Main app tenant ID
      dataverseUrl: this.getEnvOrThrow('DYNAMICS_URL'), // Dataverse base URL
    };
  }

  /**
   * Function: getCredentialsByApp
   * Objective: Retrieve credentials for a specific app context (main, owner, admin).
   * Functionality: Selects the correct set of credentials based on the app argument.
   * Expected Result: Returns a DataverseCredentials object for the requested app.
   *
   * IMPORTANT: This method does NOT validate business permissions! The responsibility to ensure the correct app context
   * (main, owner, admin) is being used for each operation is EXTERNAL to this service.
   * Use helpers like getAppForOperation/canCreate/canWrite/etc to ensure the correct app is being passed.
   *
   * Example of correct usage:
   *   if (!canDelete(userRole)) throw new ForbiddenException();
   *   const app = getAppForOperation('delete', userRole);
   *   dataverseService.request('DELETE', endpoint, undefined, dataverseService.getCredentialsByApp(app));
   */
  getCredentialsByApp(app: 'main' | 'owner' | 'admin'): DataverseCredentials {
    switch (app) {
      case 'owner':
        return {
          clientId: this.getEnvOrThrow('OWNER_CLIENT_ID'),
          clientSecret: this.getEnvOrThrow('OWNER_CLIENT_SECRET'),
          tenantId: this.getEnvOrThrow('MAIN_TENANT_ID'),
          dataverseUrl: this.getEnvOrThrow('DYNAMICS_URL'),
        };
      case 'admin':
        return {
          clientId: this.getEnvOrThrow('ADMIN_CLIENT_ID'),
          clientSecret: this.getEnvOrThrow('ADMIN_CLIENT_SECRET'),
          tenantId: this.getEnvOrThrow('MAIN_TENANT_ID'),
          dataverseUrl: this.getEnvOrThrow('DYNAMICS_URL'),
        };
      case 'main':
        return {
          clientId: this.getEnvOrThrow('MAIN_CLIENT_ID'),
          clientSecret: this.getEnvOrThrow('MAIN_CLIENT_SECRET'),
          tenantId: this.getEnvOrThrow('MAIN_TENANT_ID'),
          dataverseUrl: this.getEnvOrThrow('DYNAMICS_URL'),
        };
      default:
        throw createAppError(
          ErrorCodes.DATAVERSE_SERVICE_ERROR,
          { invalidApp: app },
          HttpStatus.BAD_REQUEST,
          `Unknown Dataverse app context: ${String(app)}`,
        );
    }
  }

  /**
   * Function: getEnvOrThrow
   * Objective: Retrieve an environment variable or throw an error if not set.
   * Functionality: Uses ConfigService to get the value and validates its presence.
   * Expected Result: Returns the value or throws an error with a clear message.
   */
  private getEnvOrThrow(key: string): string {
    const value = this.configService.get<string>(key); // Get value from env
    if (!value) {
      throw createAppError(
        ErrorCodes.DATAVERSE_SERVICE_ERROR,
        { envVar: key },
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Environment variable not set: ${key}`,
      );
    }
    return value;
  }

  /**
   * Function: getAccessToken
   * Objective: Obtain an OAuth2 access token for Dataverse using the provided credentials with persistent Redis cache.
   * Functionality: Checks Redis cache first, then requests new token from Azure AD if needed.
   * Expected Result: Returns a valid access token string or throws an HttpException on failure.
   */
  private async getAccessToken(
    credentials?: DataverseCredentials,
  ): Promise<string> {
    const creds = credentials || this.getDefaultCredentials(); // Use provided or default credentials
    const cacheKey = `dataverse:token:${creds.clientId}:${creds.tenantId}`;

    // Try to get cached token from Redis
    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData) as {
          token: string;
          expiresAt: number;
        };
        const now = Math.floor(Date.now() / 1000);
        if (cached.expiresAt > now + 60) {
          // Return cached token if it expires in more than 60 seconds
          // Using cached token
          return cached.token;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to retrieve cached token from Redis:', error);
      // Continue to request new token
    }

    const url = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`; // Azure AD token endpoint
    const params = new URLSearchParams();
    params.append('client_id', creds.clientId); // Add client ID
    params.append('client_secret', creds.clientSecret); // Add client secret
    params.append('grant_type', 'client_credentials'); // Grant type
    params.append('scope', `${creds.dataverseUrl}/.default`); // Scope for Dataverse

    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(url, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Set content type
        }),
      );
      if (!response.data || typeof response.data.access_token !== 'string') {
        throw new Error('Access token not found in response'); // Validate token
      }

      // Store in Redis cache with safety margin (expires_in is seconds)
      const expiresAt =
        Math.floor(Date.now() / 1000) + response.data.expires_in;
      const tokenData = {
        token: response.data.access_token,
        expiresAt,
      };

      try {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(tokenData),
          { EX: response.data.expires_in - 60 }, // Cache with 60s safety margin
        );
        // Token cached
      } catch (error) {
        this.logger.warn('Failed to cache token in Redis:', error);
        // Continue without caching
      }

      return response.data.access_token; // Return token
    } catch (error) {
      // Log detailed error for debugging
      let errorDetails: unknown = error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: unknown }).response !== null
      ) {
        const resp = (error as { response?: { data?: unknown } }).response;
        if (resp && 'data' in resp) {
          errorDetails = (resp as { data: unknown }).data;
        }
      }

      this.logger.error('Failed to obtain Dataverse token:', {
        clientId: creds.clientId,
        tenantId: creds.tenantId,
        errorDetails,
      });

      throw createAppError(
        ErrorCodes.DATAVERSE_SERVICE_ERROR,
        {
          operation: 'getAccessToken',
          clientId: creds.clientId,
          tenantId: creds.tenantId,
          errorDetails,
        },
        HttpStatus.UNAUTHORIZED,
        'Failed to obtain Dataverse access token',
      );
    }
  }

  /**
   * Function: request
   * Objective: Perform a generic HTTP request to the Dataverse Web API using the correct credentials.
   * Functionality: Obtains a token, builds the request, sends it, and returns the response data.
   * Expected Result: Returns the response data from Dataverse or throws an HttpException on failure.
   */
  /**
   * Function: request
   * Objective: Perform a generic HTTP request to the Dataverse Web API using the correct credentials.
   * Functionality: Obtains a token, builds the request, sends it, and returns the response data.
   * Expected Result: Returns the response data from Dataverse or throws an HttpException on failure.
   *
   * CRITICAL SECURITY NOTICE:
   * This method does NOT validate business permissions! It only executes operations with provided credentials.
   *
   * MANDATORY VALIDATION STEPS BEFORE CALLING:
   * 1. Validate user has permission for the operation (canRead/canWrite/canDelete helpers)
   * 2. Determine correct app context (getAppForOperation helper)
   * 3. Validate input data and sanitize dangerous fields
   * 4. Log the operation for audit purposes
   *
   * Example of CORRECT usage:
   *   if (!canDelete(userRole)) throw new ForbiddenException();
   *   const app = getAppForOperation('delete', userRole);
   *   await this.auditService.log('account.delete', userId, accountId);
   *   const result = await dataverseService.request('DELETE', endpoint, undefined,
   *     dataverseService.getCredentialsByApp(app), app);
   */
  async request(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE', // HTTP method
    endpoint: string, // API endpoint (e.g., Table_Account)
    data?: unknown, // Optional payload
    credentials?: DataverseCredentials, // Optional credentials
    appContext?: string, // Optional app context for logging and rate limiting
    suppressNotFound?: boolean, // Optional: suppress 404 errors from logs (for expected not-found scenarios)
  ): Promise<unknown> {
    // Apply rate limiting before processing request
    this.checkRateLimit(appContext || 'default');

    const creds = credentials || this.getDefaultCredentials(); // Use provided or default credentials
    const token = await this.getAccessToken(creds); // Get access token
    // Build full Dataverse API URL (always append /api/data/v9.2/)
    const url = `${creds.dataverseUrl}/api/data/v9.2/${endpoint}`;
    const maxRetries = 3;
    let attempt = 0;

    // Log request details
    if (method === 'POST' || method === 'PATCH') {
      this.logger.debug(`📋 ${method} Request to: ${endpoint}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);
    }

    while (true) {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        };
        // Add Prefer header for POST requests to return created entity
        if (method === 'POST') {
          headers['Prefer'] = 'return=representation';
        }

        this.logger.debug(`🌐 Making HTTP request: ${method} ${url}`);

        const response = await firstValueFrom(
          this.httpService.request({
            method,
            url,
            data,
            headers,
          }),
        );

        this.logger.debug(
          `✅ Dataverse response received with status: ${response.status}`,
        );

        return response.data;
      } catch (error) {
        // Log detailed error for debugging, including app context and endpoint
        // Skip logging for expected 404s (e.g., checking if user is affiliate)
        let errorDetails: unknown = error;
        let status: number | undefined = undefined;

        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: unknown }).response === 'object' &&
          (error as { response?: unknown }).response !== null
        ) {
          const resp = (
            error as { response?: { data?: unknown; status?: number } }
          ).response;
          if (resp && 'data' in resp) {
            errorDetails = (resp as { data: unknown }).data;
          }
          if (resp && 'status' in resp) {
            status = (resp as { status: number }).status;
          }
        }

        // Only log error if it's not a suppressed 404
        const is404 = status === 404;
        const shouldSuppress = suppressNotFound && is404;

        if (!shouldSuppress) {
          this.logger.error(
            `Dataverse request failed (attempt ${attempt + 1}/${maxRetries})`,
            {
              method,
              endpoint,
              appContext: appContext || 'unknown',
              status,
              errorDetails,
            },
          );
        }

        // Retry logic for transient errors (HTTP 5xx or network errors)
        if (
          attempt < maxRetries - 1 &&
          (status === 502 ||
            status === 503 ||
            status === 504 ||
            status === 500 ||
            status === undefined)
        ) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt)); // Exponential backoff
          continue;
        }

        throw createAppError(
          ErrorCodes.DATAVERSE_SERVICE_ERROR,
          {
            operation: 'request',
            method,
            endpoint,
            appContext: appContext || 'unknown',
            attempts: attempt + 1,
            status,
            errorDetails,
          },
          status || HttpStatus.BAD_GATEWAY,
          'Failed to communicate with Dataverse',
        );
      }
    }
  }
}
