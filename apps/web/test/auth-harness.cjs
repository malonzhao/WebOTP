const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

// Execute the production TypeScript with real Axios and Zustand. Only browser
// globals and the HTTP adapter are replaced; TypeScript is checked by the build.
function setup(adapter, mocks = {}) {
  const cache = new Map();
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  global.localStorage = storage;
  const window = new EventTarget();
  const previousAdapter = axios.defaults.adapter;
  axios.defaults.adapter = adapter;

  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const source = fs.readFileSync(file, 'utf8')
      .replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    vm.runInNewContext(outputText, {
      exports, window, localStorage: storage, CustomEvent,
      console: { log() {}, warn() {}, error() {} },
      require(name) {
        if (mocks[name]) return mocks[name];
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
        return require(name);
      },
    }, { filename: file });
    return exports;
  }

  const src = path.resolve(__dirname, '../src');
  const auth = load(path.join(src, 'stores/auth.store.ts'));
  const unregister = load(path.join(src, 'stores/auth-events.ts')).registerAuthEvents();
  const api = load(path.join(src, 'services/api/client.ts')).apiClient;
  axios.defaults.adapter = previousAdapter;
  return {
    ...auth, storage, api,
    loadStore: () => load(path.join(src, 'stores/user-platforms.store.ts')).useUserPlatformsStore,
    cleanup() { unregister(); delete global.localStorage; },
  };
}

const response = (config, data, status = 200) => ({ config, data, status, statusText: 'test', headers: {} });
function reject(config, status = 401) {
  throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response(config, {}, status));
}
function signedIn(env) {
  env.storage.setItem('accessToken', 'old-access');
  env.storage.setItem('refreshToken', 'old-refresh');
  env.useAuthStore.setState({ isAuthenticated: true, tokens: { accessToken: 'old-access', refreshToken: 'old-refresh' } });
}
module.exports = { setup, response, reject, signedIn };
