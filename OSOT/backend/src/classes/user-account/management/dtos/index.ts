/**
 * Management DTOs Index
 * Centralized exports for all Management Data Transfer Objects
 *
 * This file provides a single import point for all Management DTOs,
 * following the established pattern from other modules in the project.
 * All DTOs are designed for seamless Dataverse integration and include
 * comprehensive validation, business rule enforcement, and API documentation.
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// ========================================
// CORE DTOs
// ========================================

/**
 * ManagementBasicDto - Base DTO with all management fields
 * - Complete field structure for management accounts
 * - Comprehensive validation decorators
 * - Business rule enforcement through validators
 * - Swagger API documentation
 */
export { ManagementBasicDto } from './management-basic.dto';

/**
 * CreateManagementDto - DTO for creating new management accounts
 * - Extends ManagementBasicDto with creation-specific rules
 * - Required field validation for user business ID
 * - Default value handling for optional fields
 * - Business rule validation for initial setup
 */
export { CreateManagementDto } from './create-management.dto';

/**
 * UpdateManagementDto - DTO for updating existing management accounts
 * - Partial type of ManagementBasicDto for flexible updates
 * - All fields optional for granular modifications
 * - Maintains business rule validation for changes
 * - Excludes system-generated fields from updates
 */
export { UpdateManagementDto } from './update-management.dto';

/**
 * ManagementResponseDto - DTO for API responses with computed fields
 * - Extends ManagementBasicDto with additional display fields
 * - Formatted enum values for user-friendly display
 * - Business status summaries and service lists
 * - Access control information and security levels
 */
export { ManagementResponseDto } from './management-response.dto';

// ========================================
// QUERY DTOs
// ========================================

/**
 * ListManagementQueryDto - DTO for filtering and pagination
 * - Comprehensive filtering options for all management fields
 * - Pagination and sorting support
 * - Date range filtering capabilities
 * - Business service and access control filters
 */
export { ListManagementQueryDto } from './list-management.query.dto';

// ========================================
// INTEGRATION DTOs
// ========================================

/**
 * CreateManagementForAccountDto - Simplified DTO for Account integration
 * - Minimal required fields for automatic management record creation
 * - Safe defaults for all optional fields
 * - Designed for system-to-system integration during account registration
 * - Bypasses complex validation for internal workflow efficiency
 */
export { CreateManagementForAccountDto } from './create-management-for-account.dto';
