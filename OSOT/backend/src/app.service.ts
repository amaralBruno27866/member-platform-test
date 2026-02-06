/**
 * Class: AppService
 * Objective: Provide core application services and business logic for the root module.
 * Functionality: Contains methods that return basic responses or handle core logic for the application.
 * Expected Result: Supplies data and logic to the AppController and other parts of the application as needed.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Function: getHello
   * Objective: Return a welcome message for the root endpoint.
   * Functionality: Returns a static string with API information.
   * Expected Result: Returns welcome message with available modules.
   */
  getHello(): { message: string; version: string; timestamp: string } {
    return {
      message:
        'OSOT Dataverse API - Production Ready Modules: Account, Address, Contact, Identity, OT Education | Documentation: /api-docs',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
