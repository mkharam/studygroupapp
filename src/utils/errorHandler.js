/**
 * Error handling utility functions for StudyGroupApp
 */

/**
 * Handles errors consistently across the application
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @param {Function} setError - Optional state setter for error display
 * @returns {void}
 */
export const handleError = (error, context, setError = null) => {
  // In production, we wouldn't log to console, but send to a monitoring service
  // For development, log with context for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    // This will be removed in production builds
    console.warn(`Error in ${context}:`, error);
  }

  // If a setter is provided, use it to display the error in the UI
  if (setError && typeof setError === 'function') {
    setError(`${context}: ${error.message || 'An unknown error occurred'}`);
  }
  
  // Optionally send to an error reporting service like Sentry
  // reportErrorToService(error, context);
};

/**
 * Format a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} A user-friendly error message
 */
export const formatErrorMessage = (error) => {
  // Common Firebase error codes that we can make more user-friendly
  const errorMap = {
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'permission-denied': 'You don\'t have permission to perform this action',
    'resource-exhausted': 'The service is currently experiencing high load. Please try again later.'
  };
  
  const errorCode = error.code || '';
  return errorMap[errorCode] || error.message || 'An unexpected error occurred';
};

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {any} defaultValue - Default value to return if parsing fails
 * @param {string} context - Context for error reporting
 * @returns {any} Parsed object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null, context = 'JSON parsing') => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    handleError(error, context);
    return defaultValue;
  }
};