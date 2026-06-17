// Configuration proxy for VS Code extension
// Import this first in index.vscode.tsx to override runtime config

import { config as buildTimeConfig } from "../config";

if (typeof window !== 'undefined') {
  (window as any).__ENV__ = {
    REACT_APP_API_BASE_URL: 'http://localhost',
    NODE_ENV: 'production',
    ...buildTimeConfig,
  };
}

console.log('VSCode API Configuration loaded - runtime config set for VS Code extension');
