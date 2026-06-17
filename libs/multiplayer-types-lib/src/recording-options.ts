export interface IRecordingOptions {
  // screens?: boolean
  // traces?: boolean
  // logs?: boolean
  // logLevel?: 'debug' | 'info' | 'warn' | 'error'
  // content?: boolean


  frontend?: {
    screens?: boolean
    traces?: boolean
    logs?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    content?: boolean
  }
  backend?: {
    traces?: boolean
    logs?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    content?: boolean
  }
}
