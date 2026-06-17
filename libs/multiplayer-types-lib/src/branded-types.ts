declare const brand: unique symbol
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type PlatformKey = Brand<string, 'platformKey'>;
export type ServiceKey = Brand<string, 'serviceKey'>;
export type ComponentKey = Brand<string, 'componentKey'> | ServiceKey;
export type ApiKey = Brand<string, 'apiKey'>;
export type SchemaKey = Brand<string, 'schemaKey'>;
export type UserId = Brand<string, 'userId'>;
