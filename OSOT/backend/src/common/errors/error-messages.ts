import { ErrorCodes } from './error-codes';

export const ErrorMessages: Record<
  ErrorCodes,
  { publicMessage: string; logMessage?: string }
> = {
  [ErrorCodes.GENERIC]: { publicMessage: 'An unexpected error occurred.' },

  // Account errors
  [ErrorCodes.ACCOUNT_NOT_FOUND]: {
    publicMessage: 'Account not found. Please verify the provided information.',
    logMessage: 'Account not found for id={id}',
  },
  [ErrorCodes.ACCOUNT_DUPLICATE]: {
    publicMessage: 'An account with this information already exists.',
    logMessage: 'Duplicate account detected for email={email}',
  },
  [ErrorCodes.INVALID_CREDENTIALS]: {
    publicMessage: 'Invalid credentials.',
    logMessage: 'Invalid credentials for identifier={identifier}',
  },
  [ErrorCodes.ACCOUNT_EMAIL_EXISTS]: {
    publicMessage: 'This email is already in use.',
    logMessage: 'Email already exists: {email}',
  },
  [ErrorCodes.ACCOUNT_PHONE_EXISTS]: {
    publicMessage: 'This phone number is already in use.',
    logMessage: 'Phone number already exists: {phone}',
  },
  [ErrorCodes.ACCOUNT_LOCKED]: {
    publicMessage: 'Account locked. Please contact support.',
    logMessage: 'Account locked for user={userId}',
  },
  [ErrorCodes.ACCOUNT_SESSION_EXPIRED]: {
    publicMessage: 'Session expired. Please log in again.',
    logMessage: 'Session expired for session={sessionId}',
  },
  [ErrorCodes.ACCOUNT_INSUFFICIENT_PRIVILEGE]: {
    publicMessage: 'Insufficient privileges for this action.',
    logMessage:
      'Insufficient privilege: required={required}, current={current}',
  },
  [ErrorCodes.ACCOUNT_INVALID_STATUS]: {
    publicMessage: 'Invalid account status.',
    logMessage: 'Invalid account status: {status}',
  },
  [ErrorCodes.ACCOUNT_REGISTRATION_EXPIRED]: {
    publicMessage: 'Registration expired. Please start the process again.',
    logMessage: 'Registration expired for session={sessionId}',
  },

  // Input validation errors
  [ErrorCodes.INVALID_INPUT]: {
    publicMessage: 'Invalid data. Please check and try again.',
    logMessage: 'Invalid input: {details}',
  },
  [ErrorCodes.INVALID_EMAIL_FORMAT]: {
    publicMessage: 'Invalid email format.',
    logMessage: 'Invalid email format: {email}',
  },
  [ErrorCodes.INVALID_PHONE_FORMAT]: {
    publicMessage: 'Invalid phone format. Please use Canadian format.',
    logMessage: 'Invalid phone format: {phone}',
  },
  [ErrorCodes.INVALID_POSTAL_CODE]: {
    publicMessage: 'Invalid postal code. Please use Canadian format (A1A 1A1).',
    logMessage: 'Invalid postal code format: {postalCode}',
  },
  [ErrorCodes.INVALID_PASSWORD_STRENGTH]: {
    publicMessage:
      'Password must contain uppercase, lowercase, number and special character.',
    logMessage: 'Password does not meet strength requirements',
  },
  [ErrorCodes.INVALID_NAME_FORMAT]: {
    publicMessage: 'Name contains invalid characters.',
    logMessage: 'Invalid name format: {name}',
  },
  [ErrorCodes.INVALID_SEARCH_QUERY]: {
    publicMessage: 'Invalid search query.',
    logMessage: 'Invalid search query: {query}',
  },

  // Permission errors
  [ErrorCodes.PERMISSION_DENIED]: {
    publicMessage: 'Permission denied.',
    logMessage: 'Permission denied for user={userId}',
  },
  [ErrorCodes.CONFLICT]: {
    publicMessage:
      'Data conflict. The resource already exists or is being used.',
    logMessage: 'Data conflict: {details}',
  },
  [ErrorCodes.VALIDATION_ERROR]: {
    publicMessage: 'Validation error. Please check the provided data.',
    logMessage: 'Validation error: {details}',
  },
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: {
    publicMessage: 'Business rule violation.',
    logMessage: 'Business rule violation: {rule} {details}',
  },

  // External service errors
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: {
    publicMessage: 'External service error. Please try again later.',
    logMessage: 'External service error: {service} {details}',
  },
  [ErrorCodes.DATAVERSE_SERVICE_ERROR]: {
    publicMessage: 'Data service error. Please try again.',
    logMessage: 'Dataverse service error: {operation} {details}',
  },
  [ErrorCodes.REDIS_SERVICE_ERROR]: {
    publicMessage: 'Cache error. Please try again.',
    logMessage: 'Redis service error: {operation} {details}',
  },
  [ErrorCodes.EMAIL_SERVICE_ERROR]: {
    publicMessage: 'Email sending error. Please try again.',
    logMessage: 'Email service error: {recipient} {details}',
  },

  // Application errors
  [ErrorCodes.NOT_FOUND]: {
    publicMessage: 'Resource not found.',
    logMessage: 'Resource not found: {resource} {id}',
  },
  [ErrorCodes.INTERNAL_ERROR]: {
    publicMessage: 'Internal system error. Please try again later.',
    logMessage: 'Internal system error: {details}',
  },
  [ErrorCodes.FORBIDDEN]: {
    publicMessage:
      'Access forbidden. You do not have permission for this action.',
    logMessage: 'Forbidden access: user={userId} resource={resource}',
  },

  // Education errors
  [ErrorCodes.EDUCATION_DATA_NOT_FOUND]: {
    publicMessage: 'Education data not found for this user.',
    logMessage:
      'Education data not found for user={userId}, table={educationTable}',
  },
  [ErrorCodes.INVALID_EDUCATION_CATEGORY]: {
    publicMessage: 'Invalid education category.',
    logMessage:
      'Invalid education category: {category} for accountGroup={accountGroup}',
  },
  [ErrorCodes.EDUCATION_DATA_INCOMPLETE]: {
    publicMessage: 'Education data is incomplete.',
    logMessage: 'Education data incomplete for user={userId}: {details}',
  },
};
