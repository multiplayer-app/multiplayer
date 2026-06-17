// TypeScript Version: 4.7

export interface AxiosRequestConfig<D = any> {
  url?: string;
  method?: string;
  baseURL?: string;
  allowAbsoluteUrls?: boolean;
  headers?: any;
  params?: any;
  data?: D;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  auth?: any;
  responseType?: string;
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: ((status: number) => boolean) | null;
  maxBodyLength?: number;
  maxRedirects?: number;
  maxRate?: number | [number, number];
  beforeRedirect?: (options: Record<string, any>, responseDetails: { headers: Record<string, string>, statusCode: number }) => void;
  socketPath?: string | null;
  transport?: any;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: any;
  cancelToken?: any;
  decompress?: boolean;
  transitional?: any;
  signal?: any;
  env?: {
    FormData?: new (...args: any[]) => object;
  };
  formSerializer?: any;
  family?: number;
  lookup?: ((hostname: string, options: object, cb: (err: Error | null, address: any, family?: number) => void) => void) |
  ((hostname: string, options: object) => Promise<[address: any, family?: number] | any>);
  withXSRFToken?: boolean | ((config: InternalAxiosRequestConfig) => boolean | undefined);
  fetchOptions?: Record<string, any>;
}

export interface InternalAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  headers: any;
}

export interface HeadersDefaults {
  common: any;
  delete: any;
  get: any;
  head: any;
  post: any;
  put: any;
  patch: any;
  options?: any;
  purge?: any;
  link?: any;
  unlink?: any;
}

export interface AxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
  headers: HeadersDefaults;
}

export interface CreateAxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
  headers?: any;
}

export interface AxiosResponse<T = any, D = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: InternalAxiosRequestConfig<D>;
  request?: any;
}
