export function getIframeHTML(
  javascript: string,
  html: string,
  css: string,
  variables: Record<string, any>,
  handlers: Record<string, any>,
): string {
  const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="
          default-src * data: blob:;
          form-action 'self';
          script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
          style-src * 'unsafe-inline' data:;
          connect-src *;
          img-src * data: blob:;
          font-src * data:;
          worker-src 'self';
        ">
        <style>${baseCSS}</style>
        <style type="text/css">${minifyCSS(css)}</style>
        <script>${blockedApis}</script>
        <script>${proxyFetchOverride}</script>
        <script>${fetchXHRLimits}</script>
        <script>${errorForwarding}</script>
      </head>
      <body>
        <div class="content-container">${html}</div>
        <script>${resizeHandler}</script>
        <script>${injectVariables(variables)}</script>
        <script>${injectHandlers(handlers)}</script>
        <script type="module">
          // Execute the content
          ${javascript}
        </script>
      </body>
    </html>
  `
  return iframeHtml
}

const injectVariables = (variables: Record<string, any>) => {
  // Inject variables with security checks
  return Object.entries(variables)
    .map(([key, value]) => {
      const sanitizedValue =
        typeof value === 'string' ? JSON.stringify(value.replace(/[<>]/g, '')) : JSON.stringify(value)
      return `const ${key} = ${sanitizedValue};`
    })
    .join('\n')
}

const injectHandlers = (handlers: Record<string, Function>) => {
  return `
    // Inject handlers with security checks
    const promiseHandlers = new Map();
    ${Object.keys(handlers)
      .map(key => `async function ${key}(params) {return registerHandler('${key}', params)}`)
      .join('\n')}

    function registerHandler(handlerName, params) {
      return new Promise((resolve, reject) => {
          const promiseId = Math.random().toString(36).substring(2, 15);
          promiseHandlers.set(promiseId, { resolve, reject });
          window.parent.postMessage({
            type: 'handler',
            promiseId,
            handler: handlerName,
            params
          }, '*');
      });
    }

    function unregisterHandler(promiseId) {
      promiseHandlers.delete(promiseId)
    }

    window.addEventListener('message', (event) => {
      if (event.data.type === 'handler-result' && promiseHandlers.has(event.data.promiseId)) {
        const { resolve, reject } = promiseHandlers.get(event.data.promiseId);
        if (event.data.error) {
          reject(event.data.error)
        } else {
          resolve(event.data.result)
        }
        promiseHandlers.delete(event.data.promiseId)
      }
    })
  `
}

const blockedApis = minifyScript(`
  // --- Security: block dangerous APIs
  const blockedAPIs = ['WebSocket', 'navigator.sendBeacon', 'navigator.clipboard'];

  blockedAPIs.forEach(api => {
    if (window[api]) {
      window[api] = function () {
        window.parent.postMessage({
          type: 'error',
          error: { message: 'Access to ' + api + ' is blocked' }
        }, '*');
      };
    }
  });
`)

const proxyFetchOverride = minifyScript(`
  (function() {

    window.proxyFetch = async function(url, options = {}) {
      return new Promise((resolve, reject) => {
        const promiseId = Math.random().toString(36).substring(2, 15);
        window.parent.postMessage({
          type: 'proxy-fetch',
          promiseId,
          url,
          options: {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            signal: options.signal
          }
        }, '*');

        const timeout = setTimeout(() => {
          reject(new Error('Proxy fetch request timed out'));
        }, 30000);

        const messageHandler = (event) => {
          if (event.data.type === 'proxy-fetch-result' && event.data.promiseId === promiseId) {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(new Response(JSON.stringify(event.data.data), {
                status: event.data.status,
                statusText: event.data.statusText,
                headers: new Headers(event.data.headers)
              }));
            }
          }
        };

        window.addEventListener('message', messageHandler);
      });
    };
  })();
`)

const fetchXHRLimits = minifyScript(`
  (function() {
  // --- Limit fetch/XHR per domain within time window
  const MAX_ATTEMPTS = 5;
  const TIME_WINDOW_MS = 10000;
  const domainAttempts = new Map();

  const getDomain = (url) => {
    try { return new URL(url, location.href).hostname; }
    catch { return 'invalid'; }
  };

  const recordAttempt = (domain) => {
    const now = Date.now();
    const attempts = (domainAttempts.get(domain) || []).filter(t => now - t < TIME_WINDOW_MS);
    attempts.push(now);
    domainAttempts.set(domain, attempts);
    return attempts.length;
  };

  const isBlocked = (domain) => {
    const now = Date.now();
    const recent = (domainAttempts.get(domain) || []).filter(t => now - t < TIME_WINDOW_MS);
    return recent.length >= MAX_ATTEMPTS;
  };

  const reportBlocked = (type, domain) => {
    window.parent?.postMessage({
      type: 'error',
      error: { message: \`Blocked \${type} to \${domain} (too many attempts due to security policy)\` }
    }, '*');
  };

  // --- Patch fetch
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const domain = getDomain(url);

    if (isBlocked(domain)) {
      reportBlocked('fetch', domain);
      return Promise.reject(new Error('Too many fetch attempts to ' + domain));
    }

    recordAttempt(domain);
    return originalFetch(...args).catch(err => {
      window.parent?.postMessage({
        type: 'error',
        error: { message: \`Fetch to \${domain} failed\`, detail: err.message }
      }, '*');
      throw err;
    });
  };

  // --- Patch XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const domain = getDomain(url);
    if (isBlocked(domain)) {
      reportBlocked('XHR', domain);
      throw new Error('Too many XHR attempts to ' + domain);
    }
    recordAttempt(domain);
    return originalOpen.call(this, method, url, ...args);
  };
  })()
`)

const errorForwarding = minifyScript(`
  (function() {
  // --- Global error forwarding
  window.addEventListener('error', (e) => {
    window.parent.postMessage({
      type: 'error',
      error: {
        message: e.error?.message || e.message,
        stack: e.error?.stack || ''
      }
    }, '*');
  });

  window.addEventListener('unhandledrejection', (e) => {
    window.parent.postMessage({
      type: 'error',
      error: {
        message: e.reason?.message || 'Unhandled rejection',
        stack: e.reason?.stack || ''
      }
    }, '*');
  });
  })()
`)

const resizeHandler = minifyScript(`
  (function() {
  function updateIframeHeight() {
    const height = Math.min(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent.postMessage({ type: 'resize', height }, '*');
  }

  updateIframeHeight();

  new MutationObserver(updateIframeHeight).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  })()
`)

const baseCSS = minifyCSS(`
  html {
    height: 100%;
      overflow: hidden;
    }
    html, body {
      margin: 0;
      padding: 0;
    }
    svg {
      vertical-align: top;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
`)

function minifyScript(script: string): string {
  return script
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
    .replace(/\s+/g, ' ') // Remove unnecessary whitespace
    .replace(/\s*([{}()[\],;:+\-*/%<>=!&|])\s*/g, '$1') // Remove whitespace around operators and punctuation
    .replace(/^\s+|\s+$/gm, '') // Remove whitespace at start/end of lines
    .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
    .replace(/;}/g, '}') // Remove trailing semicolons before closing braces
    .replace(/;;+/g, ';') // Remove unnecessary semicolons
    .trim()
}

function minifyCSS(css: string): string {
  return css
    .replace(/(['"])/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Tighten around CSS tokens
    .replace(/;}/g, '}') // Remove semicolon before closing brace
    .replace(/\s+!important/g, '!important') // Clean !important spacing
    .replace(/\s+/g, ' ') // Collapse remaining whitespace
    .replace(/^\s+|\s+$/g, '') // Trim start/end
    .replace(/[\r\n]+/g, '') // Remove newlines
    .replace(/(\s{2,})/g, ' ') // Extra cleanup
    .trim()
}
