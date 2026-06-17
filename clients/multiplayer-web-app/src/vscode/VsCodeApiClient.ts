// VS Code API client for webview communication with extension
export interface ProxyRequestOptions {
  url: string;
  method: string;
  data?: any;
  config?: any; // e.g. { responseType: 'arraybuffer' }
}

class VSCodeApiClient {
  private vscode: any;
  private pendingRequests: Map<string, { resolve: (v: any) => void, reject: (e: any) => void }> = new Map();

  constructor() {
    this.vscode = (window as any).acquireVsCodeApi();
    window.addEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg?.type === 'apiResponse') {
      const promise = this.pendingRequests.get(msg.requestId);
      if (!promise) return;
      const { resolve, reject } = promise;
      if (msg.status === 200) {
        const normalized = this.normalizeApiResponse(msg);
        resolve(normalized);
      } else {
        reject(msg.error || 'Request failed');
      }
      this.pendingRequests.delete(msg.requestId);
    }
  };

  async request(options: ProxyRequestOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      this.pendingRequests.set(requestId, { resolve, reject });
      this.vscode.postMessage({
        type: 'apiRequest',
        requestId,
        options
      });
    });
  }

  // Convenience helper to request ArrayBuffer
  async requestArrayBuffer(url: string, method: string = 'GET', config: any = {}): Promise<ArrayBuffer> {
    const res = await this.request({
      url,
      method,
      config: { ...config, responseType: 'arraybuffer' }
    });
    return res.data as ArrayBuffer;
  }

  private normalizeApiResponse(resp: any): any {
    if (!resp || typeof resp !== 'object') return resp;
    return {
      ...resp,
      data: this.decodeData(resp.data)
    };
  }

  private decodeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // ArrayBuffer case
    if (data.type?.toLowerCase() === 'buffer' && Array.isArray(data.data)) {
      return new Uint8Array(data.data);
    }

    // ArrayBuffer case
    if (data.type?.toLowerCase() === 'arraybuffer' && typeof data.data === 'string') {
      return this.base64ToArrayBuffer(data.data);
    }

    // TypedArray case
    if (data.type?.toLowerCase() === 'typedarray' && typeof data.data === 'string' && typeof data.constructor === 'string') {
      return this.base64ToTypedArray(data.constructor, data.data);
    }

    // Blob case (extension sends metadata only; no binary content to reconstruct)
    if (data.type?.toLowerCase() === 'blob' && typeof data.size === 'number') {
      return { size: data.size, type: data.mimeType || '' };
    }

    return data;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private base64ToTypedArray(ctorName: string, base64: string):
    Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array {
    const buffer = this.base64ToArrayBuffer(base64);
    switch (ctorName) {
      case 'Uint8Array': return new Uint8Array(buffer);
      case 'Int8Array': return new Int8Array(buffer);
      case 'Uint16Array': return new Uint16Array(buffer);
      case 'Int16Array': return new Int16Array(buffer);
      case 'Uint32Array': return new Uint32Array(buffer);
      case 'Int32Array': return new Int32Array(buffer);
      case 'Float32Array': return new Float32Array(buffer);
      case 'Float64Array': return new Float64Array(buffer);
      default: return new Uint8Array(buffer);
    }
  }
}

// Export singleton instance
export const apiClient = new VSCodeApiClient();