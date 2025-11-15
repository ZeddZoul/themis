import { ComplianceError, ComplianceErrorType } from './compliance';

/**
 * User-friendly error message with actionable guidance
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  actionableGuidance?: string;
  retryInfo?: string;
}

/**
 * Maps a ComplianceError to a user-friendly error message with actionable guidance
 */
export function getErrorMessage(error: ComplianceError): UserFriendlyError {
  switch (error.type) {
    case ComplianceErrorType.MISSING_FILE:
      return {
        title: 'Required File Missing',
        message: error.file 
          ? `The file '${error.file}' was not found in your repository.`
          : 'A required file was not found in your repository.',
        actionableGuidance: error.file
          ? `Please add the '${error.file}' file to your repository and try again.`
          : 'Please ensure all required files are present in your repository.',
      };

    case ComplianceErrorType.GITHUB_API_ERROR:
      if (error.message?.includes('Permission denied') || error.details?.includes('403')) {
        return {
          title: 'Permission Denied',
          message: 'Unable to access your repository due to insufficient permissions.',
          actionableGuidance: 'Please check that the GitHub App has the necessary permissions to read repository contents. You may need to reinstall the app or grant additional permissions.',
        };
      }
      
      if (error.details?.includes('500') || error.details?.includes('502') || error.details?.includes('503')) {
        return {
          title: 'GitHub Service Error',
          message: 'GitHub is experiencing technical difficulties.',
          actionableGuidance: 'This is a temporary issue with GitHub\'s servers. Please try again in a few minutes.',
        };
      }
      
      if (error.message?.includes('Network error')) {
        return {
          title: 'Connection Error',
          message: 'Unable to connect to GitHub.',
          actionableGuidance: 'Please check your internet connection and try again. If the problem persists, GitHub may be experiencing an outage.',
        };
      }
      
      return {
        title: 'GitHub API Error',
        message: 'An error occurred while accessing your repository.',
        actionableGuidance: 'Please try again. If the problem persists, contact support with the error details.',
      };

    case ComplianceErrorType.RATE_LIMIT:
      const retryMinutes = error.retryAfter 
        ? Math.ceil(error.retryAfter / 60)
        : 60;
      
      return {
        title: 'Rate Limit Exceeded',
        message: 'GitHub API rate limit has been reached.',
        actionableGuidance: 'We\'ve made too many requests to GitHub. Please wait before trying again.',
        retryInfo: `You can retry in approximately ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}.`,
      };

    case ComplianceErrorType.INVALID_CONTENT:
      return {
        title: 'Invalid Content',
        message: error.file
          ? `The file '${error.file}' contains invalid or malformed content.`
          : 'Invalid or malformed content was detected.',
        actionableGuidance: error.file
          ? `Please check the '${error.file}' file for syntax errors or formatting issues.`
          : 'Please check your repository files for syntax errors or formatting issues.',
      };

    case ComplianceErrorType.AI_SERVICE_ERROR:
      return {
        title: 'Analysis Service Unavailable',
        message: 'The compliance analysis service is temporarily unavailable.',
        actionableGuidance: 'This is a temporary issue with our analysis service. Please try again in a few minutes.',
      };

    case ComplianceErrorType.UNKNOWN:
    default:
      return {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred during the compliance check.',
        actionableGuidance: 'Please try again. If the problem persists, contact support with the error details.',
      };
  }
}

/**
 * Gets a user-friendly error message from a CheckRun's error fields
 */
export function getCheckRunErrorMessage(
  errorType: string | null,
  errorMessage: string | null,
  errorDetails: string | null
): UserFriendlyError | null {
  if (!errorType || !errorMessage) {
    return null;
  }

  // Parse error details if available
  let parsedErrors: ComplianceError[] = [];
  if (errorDetails) {
    try {
      parsedErrors = JSON.parse(errorDetails);
    } catch (e) {
      // If parsing fails, continue with basic error info
      console.warn('Failed to parse error details:', e);
    }
  }

  // Create a ComplianceError object from the stored fields
  const error: ComplianceError = {
    type: errorType as ComplianceErrorType,
    message: errorMessage,
    details: errorDetails || undefined,
  };

  // If we have parsed errors, use the first one with retry info if available
  if (parsedErrors.length > 0) {
    const primaryError = parsedErrors[0];
    if (primaryError.retryAfter) {
      error.retryAfter = primaryError.retryAfter;
    }
    if (primaryError.file) {
      error.file = primaryError.file;
    }
  }

  return getErrorMessage(error);
}

/**
 * Formats multiple errors into a summary message
 */
export function formatMultipleErrors(errors: ComplianceError[]): UserFriendlyError {
  if (errors.length === 0) {
    return {
      title: 'Unknown Error',
      message: 'An error occurred but no details are available.',
    };
  }

  if (errors.length === 1) {
    return getErrorMessage(errors[0]);
  }

  // Multiple errors - prioritize the most critical
  const rateLimitError = errors.find(e => e.type === ComplianceErrorType.RATE_LIMIT);
  if (rateLimitError) {
    return getErrorMessage(rateLimitError);
  }

  const apiError = errors.find(e => e.type === ComplianceErrorType.GITHUB_API_ERROR);
  if (apiError) {
    return getErrorMessage(apiError);
  }

  const aiError = errors.find(e => e.type === ComplianceErrorType.AI_SERVICE_ERROR);
  if (aiError) {
    return getErrorMessage(aiError);
  }

  // Return the first error if no critical errors found
  return getErrorMessage(errors[0]);
}
