import { secureStorage } from './secureStorage';
import ApiService from '../services/api';

// API Interceptor for automatic token refresh
class ApiInterceptor {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Process the failed queue after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Intercept API calls and handle token refresh
  async interceptRequest(originalRequest) {
    try {
      // Get current token
      const { accessToken } = await secureStorage.getAuthTokens();
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Add token to request headers
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        originalRequest.headers = {
          'Authorization': `Bearer ${accessToken}`
        };
      }

      return originalRequest;
    } catch (error) {
      console.error('Request interceptor error:', error);
      throw error;
    }
  }

  // Intercept API responses and handle 401 errors
  async interceptResponse(response, originalRequest) {
    // If response is successful, return as is
    if (response.ok) {
      return response;
    }

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
      return this.handleTokenRefresh(response, originalRequest);
    }

    // For other errors, return the response
    return response;
  }

  // Handle token refresh when 401 is received
  async handleTokenRefresh(originalResponse, originalRequest) {
    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then(token => {
        // Retry the original request with new token
        return this.retryRequest(originalRequest, token);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    this.isRefreshing = true;

    try {
      // Get refresh token
      const { refreshToken } = await secureStorage.getAuthTokens();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Attempt to refresh the token
      const refreshResponse = await ApiService.refreshToken(refreshToken);
      
      if (refreshResponse.success) {
        // Store new tokens
        await secureStorage.setAuthTokens(
          refreshResponse.accessToken, 
          refreshResponse.refreshToken
        );

        // Process queued requests
        this.processQueue(null, refreshResponse.accessToken);

        // Retry the original request with new token
        return this.retryRequest(originalRequest, refreshResponse.accessToken);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Process queued requests with error
      this.processQueue(error, null);
      
      // Clear stored tokens and redirect to login
      await secureStorage.clear();
      
      // You might want to emit an event here to notify the app to redirect to login
      // For now, we'll throw the error
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Retry the original request with new token
  async retryRequest(originalRequest, newToken) {
    try {
      // Update the request with new token
      const retryRequest = {
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          'Authorization': `Bearer ${newToken}`
        }
      };

      // Make the retry request
      const response = await fetch(retryRequest.url, {
        method: retryRequest.method,
        headers: retryRequest.headers,
        body: retryRequest.body
      });

      return response;
    } catch (error) {
      console.error('Retry request error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiInterceptor = new ApiInterceptor();

export default apiInterceptor;
