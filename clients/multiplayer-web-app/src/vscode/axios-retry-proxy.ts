// Mock axios-retry functionality for VS Code environment
const mockAxiosRetry = (axiosInstance: any, config: any) => {
  // In VS Code environment, we don't need actual retry logic
  // since requests go through the VS Code extension
  // Just return the instance unchanged
  return axiosInstance;
};

// Mock axios-retry utilities
const mockAxiosRetryUtils = {
  exponentialDelay: (retryNumber: number = 0, error?: any, delay?: number) => {
    // Return a simple delay calculation
    return Math.min(1000 * Math.pow(2, retryNumber), 30000);
  },
  isNetworkOrIdempotentRequestError: (error: any) => {
    // Simple retry condition - retry on network errors
    return !error.response || (error.response.status >= 500);
  }
};

// Add axios-retry utilities to the mock function
(mockAxiosRetry as any).exponentialDelay = mockAxiosRetryUtils.exponentialDelay;
(mockAxiosRetry as any).isNetworkOrIdempotentRequestError = mockAxiosRetryUtils.isNetworkOrIdempotentRequestError;

// Export the mock as default (this is what axios-retry imports expect)
export default mockAxiosRetry;

// Also export named exports for compatibility
export const exponentialDelay = mockAxiosRetryUtils.exponentialDelay;
export const isNetworkOrIdempotentRequestError = mockAxiosRetryUtils.isNetworkOrIdempotentRequestError;
