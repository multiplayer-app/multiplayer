import { AxiosDefaults, CreateAxiosDefaults, AxiosResponse, AxiosRequestConfig, HeadersDefaults } from './axios-types';

import { apiClient, ProxyRequestOptions } from './VsCodeApiClient';
import { config } from '../config';



const baseConfig = {
  baseURL: config.REACT_APP_API_BASE_URL, //"http://localhost",
};


class axios {
  defaults: AxiosDefaults;

  constructor(defaultConfig: CreateAxiosDefaults = {}) {
    this.defaults = {
      ...defaultConfig,
      headers: {
        common: {},
        delete: {},
        get: {},
        head: {},
        post: {},
        put: {},
        patch: {},
        ...defaultConfig.headers,
      },
    };
  }

  // Create a new isolated instance
  static create(defaultConfig: CreateAxiosDefaults = {}): axios {
    return new axios(defaultConfig);
  }

  // Static methods for direct usage
  static async get(url: string, config?: any): Promise<any> {
    const instance = new axios(baseConfig);
    return instance.get(url, config);
  }

  static async post(url: string, data?: any, config?: any): Promise<any> {
    const instance = new axios(baseConfig);
    return instance.post(url, data, config);
  }

  static async patch(url: string, data?: any, config?: any): Promise<any> {
    const instance = new axios(baseConfig);
    return instance.patch(url, data, config);
  }

  static async delete(url: string, config?: any): Promise<any> {
    const instance = new axios(baseConfig);
    return instance.delete(url, config);
  }

  static async put(url: string, data?: any, config?: any): Promise<any> {
    const instance = new axios(baseConfig);
    return instance.put(url, data, config);
  }

  // Resolve baseURL + url just like axios does
  private buildFullURL(options: ProxyRequestOptions): string {
    const baseURL = options.config?.baseURL ?? this.defaults.baseURL ?? '';
    const url = options.url ?? '';
    if (!baseURL) return url;
    if (/^https?:\/\//i.test(url)) return url; // already absolute
    return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }

  async request<T = any>(
    options: ProxyRequestOptions
  ): Promise<AxiosResponse<T>> {
    // apply request interceptors

    const config = options.config || {};
    const mergedConfig: AxiosRequestConfig = {
      ...this.defaults,
      ...config,
      headers: {
        ...this.defaults.headers.common,
        ...((config?.method && this.defaults.headers[config.method.toLowerCase()]) || {}),
        ...(config?.headers || {}),
      },
    };

    options.config = mergedConfig;
    options.url = this.buildFullURL(options);
    try {
      const response = await apiClient.request(options);

      const axiosResponse: AxiosResponse<T> = {
        data: response.data,
        status: response.status,
        headers: response.headers,
        statusText: response.statusText,
        config: response.config,
      };

      return this.applyResponseInterceptors(axiosResponse);
    } catch (error: any) {
      const axiosError: any = new Error(
        error.message || 'Request failed'
      ) as any;

      axiosError.config = options.config;
      axiosError.code = 'NETWORK_ERROR';
      axiosError.isAxiosError = true;
      axiosError.toJSON = () => ({
        message: axiosError.message,
        name: axiosError.name,
        code: axiosError.code,
        config: axiosError.config,
      });

      throw axiosError;
    }
  }

  async get(url: string, config?: any): Promise<any> {
    return this.request({ url, method: 'GET', config });
  }

  async post(url: string, data?: any, config?: any): Promise<any> {
    return this.request({ url, method: 'POST', data, config });
  }

  async patch(url: string, data?: any, config?: any): Promise<any> {
    return this.request({ url, method: 'PATCH', data, config });
  }

  async put(url: string, data?: any, config?: any): Promise<any> {
    return this.request({ url, method: 'PUT', data, config });
  }

  async delete(url: string, config?: any): Promise<any> {
    return this.request({ url, method: 'DELETE', config });
  }


  // --- Interceptors ---
  interceptors = {
    request: {
      use: (onFulfilled?: any, onRejected?: any) => {
        const id = this._requestInterceptors.length;
        this._requestInterceptors.push({ onFulfilled, onRejected });
        return id;
      },
      eject: (id: number) => {
        this._requestInterceptors[id] = null;
      },
    },
    response: {
      use: (onFulfilled?: any, onRejected?: any) => {
        const id = this._responseInterceptors.length;
        this._responseInterceptors.push({ onFulfilled, onRejected });
        return id;
      },
      eject: (id: number) => {
        this._responseInterceptors[id] = null;
      },
    },
  };

  private _requestInterceptors: any[] = [];
  private _responseInterceptors: any[] = [];

  private async applyRequestInterceptors(
    request: ProxyRequestOptions
  ): Promise<AxiosRequestConfig> {
    let result = request;
    for (const interceptor of this._requestInterceptors) {
      if (interceptor && interceptor.onFulfilled) {
        try {
          result = await interceptor.onFulfilled(result);
        } catch (error) {
          if (interceptor.onRejected) {
            await interceptor.onRejected(error);
          } else {
            throw error;
          }
        }
      }
    }
    return result;
  }

  private async applyResponseInterceptors(
    response: AxiosResponse
  ): Promise<any> {
    let result = response;
    for (const interceptor of this._responseInterceptors) {
      if (interceptor && interceptor.onFulfilled) {
        try {
          result = await interceptor.onFulfilled(result);
        } catch (error) {
          if (interceptor.onRejected) {
            result = await interceptor.onRejected(error);
          } else {
            throw error;
          }
        }
      }
    }
    return result;
  }
}

export default axios;
export { axios };

// These exports are needed for axios compatibility
export interface AxiosInstance extends axios {
  defaults: Omit<AxiosDefaults, 'headers'> & {
    headers: HeadersDefaults & {
      [key: string]: any;
    };
  };
}

export enum HttpStatusCode {
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  EarlyHints = 103,
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  AlreadyReported = 208,
  ImUsed = 226,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  Unused = 306,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  PayloadTooLarge = 413,
  UriTooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511,
}