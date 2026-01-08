/**
 * Extended type definitions for internal request/response tracking
 * These interfaces extend Axios types with additional metadata used for
 * performance monitoring, caching, and developer tools.
 */

import { RequestConfig, ResponseData } from './types';

/**
 * Extended request config with timing and identification metadata
 */
export interface ExtendedRequestConfig extends RequestConfig {
  /** Unique identifier for request tracking */
  requestId?: string;
  /** Request start time for duration calculation */
  startTime?: number;
  /** Original URL before any transformations */
  originalUrl?: string;
  /** Whether this request should bypass cache */
  bypassCache?: boolean;
}

/**
 * Extended response data with cache metadata
 */
export interface ExtendedResponseData<T = unknown> extends ResponseData<T> {
  /** Whether this response came from cache */
  cacheHit?: boolean;
  /** Cache key used for this response */
  cacheKey?: string;
  /** Time the response was cached */
  cachedAt?: number;
}

/**
 * Type guard to check if config is extended
 */
export function isExtendedRequestConfig(config: RequestConfig): config is ExtendedRequestConfig {
  return 'requestId' in config || 'startTime' in config;
}

/**
 * Type guard to check if response is extended
 */
export function isExtendedResponseData(response: ResponseData): response is ExtendedResponseData {
  return 'cacheHit' in response || 'cacheKey' in response;
}

/**
 * Safely get extended config properties
 */
export function getExtendedConfigData(config: RequestConfig): {
  requestId?: string;
  startTime?: number;
} {
  const extended = config as ExtendedRequestConfig;
  return {
    requestId: extended.requestId,
    startTime: extended.startTime,
  };
}

/**
 * Safely set extended config properties
 */
export function setExtendedConfigData(
  config: RequestConfig,
  data: { requestId?: string; startTime?: number }
): ExtendedRequestConfig {
  const extended = config as ExtendedRequestConfig;
  if (data.requestId !== undefined) extended.requestId = data.requestId;
  if (data.startTime !== undefined) extended.startTime = data.startTime;
  return extended;
}
