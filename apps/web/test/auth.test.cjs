const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, response, reject, signedIn } = require('./auth-harness.cjs');

function environment(t, adapter) {
  const env = setup(adapter);
  t.after(() => env.cleanup());
  return env;
}

test('failed refresh clears both token storage and persisted login state without navigation', async t => {
  let requests = 0;
  const env = environment(t, async config => { requests++; return reject(config); });
  signedIn(env);
  await assert.rejects(() => env.api.get('/user-platforms'));
  assert.equal(requests, 2);
  assert.equal(env.storage.getItem('accessToken'), null);
  assert.equal(env.storage.getItem('refreshToken'), null);
  assert.equal(env.useAuthStore.getState().isAuthenticated, false);
  assert.equal(JSON.parse(env.storage.getItem('auth-storage')).state.isAuthenticated, false);
});

test('successful refresh retries and synchronizes the persisted tokens', async t => {
  let requests = 0;
  const env = environment(t, async config => {
    requests++;
    if (config.url === '/auth/refresh') return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    if (config.headers.Authorization === 'Bearer old-access') return reject(config);
    return response(config, { ok: true });
  });
  signedIn(env);
  assert.equal((await env.api.get('/user-platforms')).ok, true);
  assert.equal(requests, 3);
  assert.equal(env.useAuthStore.getState().tokens.accessToken, 'new-access');
  assert.equal(JSON.parse(env.storage.getItem('auth-storage')).state.tokens.refreshToken, 'new-refresh');
});

test('startup callers share a pending profile validation', async t => {
  let release;
  let requests = 0;
  const env = environment(t, config => new Promise(resolve => {
    requests++;
    release = () => resolve(response(config, { id: '1' }));
  }));
  signedIn(env);
  const first = env.initializeAuthState();
  const second = env.initializeAuthState();
  assert.equal(first, second);
  let finished = false;
  second.then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  assert.equal(requests, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(env.useAuthStore.getState().user.id, '1');
  await env.initializeAuthState();
  assert.equal(requests, 1);
});

test('missing or partial tokens clear stale persisted authentication', async t => {
  const env = environment(t, async () => { throw new Error('Unexpected request'); });
  signedIn(env);
  env.storage.removeItem('refreshToken');
  await env.initializeAuthState();
  assert.equal(env.useAuthStore.getState().isAuthenticated, false);
  assert.equal(env.useAuthStore.getState().tokens, null);
  assert.equal(env.storage.getItem('accessToken'), null);
});

test('startup retains tokens refreshed by the profile request', async t => {
  const env = environment(t, async config => {
    if (config.url === '/auth/refresh') return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    if (config.headers.Authorization === 'Bearer old-access') return reject(config);
    return response(config, { id: '1' });
  });
  signedIn(env);
  await env.initializeAuthState();
  assert.equal(env.useAuthStore.getState().tokens.accessToken, env.storage.getItem('accessToken'));
  assert.equal(env.useAuthStore.getState().tokens.refreshToken, 'new-refresh');
});

test('a second 401 logs out without another refresh', async t => {
  let requests = 0;
  const env = environment(t, async config => {
    requests++;
    if (config.url === '/auth/refresh') return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    return reject(config);
  });
  signedIn(env);
  await assert.rejects(() => env.api.get('/user-platforms'));
  assert.equal(requests, 3);
  assert.equal(env.useAuthStore.getState().isAuthenticated, false);
  assert.equal(env.storage.getItem('refreshToken'), null);
});

test('a retried server error does not log out a valid session', async t => {
  const env = environment(t, async config => {
    if (config.url === '/auth/refresh') return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    return reject(config, config.headers.Authorization === 'Bearer old-access' ? 401 : 500);
  });
  signedIn(env);
  await assert.rejects(() => env.api.get('/user-platforms'));
  assert.equal(env.useAuthStore.getState().isAuthenticated, true);
});

test('concurrent unauthorized requests share one token refresh', async t => {
  let refreshes = 0;
  const env = environment(t, async config => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      await new Promise(resolve => setImmediate(resolve));
      return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    }
    if (config.headers.Authorization === 'Bearer old-access') return reject(config);
    return response(config, { ok: true });
  });
  signedIn(env);
  await Promise.all([env.api.get('/users/profile'), env.api.get('/user-platforms')]);
  assert.equal(refreshes, 1);
  assert.equal(env.useAuthStore.getState().isAuthenticated, true);
});

test('invalid login credentials do not trigger token refresh', async t => {
  let requests = 0;
  const env = environment(t, async config => { requests++; return reject(config); });
  await assert.rejects(() => env.api.post('/auth/login', { username: 'invalid' }));
  assert.equal(requests, 1);
});
