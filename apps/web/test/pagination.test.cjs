const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./auth-harness.cjs');

test('pagination appends all rows, stops at the end and resets after mutations', async t => {
  const calls = [];
  let rows = Array.from({ length: 45 }, (_, i) => ({ id: String(i) }));
  const service = {
    async findAll(page, limit) {
      calls.push(page);
      return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, hasMore: page * limit < rows.length };
    },
    async create(data) { rows.unshift(data); return data; },
    async delete(id) { rows = rows.filter(row => row.id !== id); },
  };
  const env = setup(undefined, {
    '../services/api/user-platforms': { userPlatformsService: service },
    '../i18n': { __esModule: true, default: { t: key => key } },
  });
  t.after(() => env.cleanup());
  const store = env.loadStore();
  await store.getState().loadUserPlatforms();
  await store.getState().loadMoreUserPlatforms();
  await store.getState().loadMoreUserPlatforms();
  assert.equal(store.getState().userPlatforms.length, 45);
  assert.equal(store.getState().hasMore, false);
  assert.deepEqual(calls, [1, 2, 3]);
  await store.getState().loadMoreUserPlatforms();
  assert.equal(calls.length, 3);
  await store.getState().createUserPlatform({ id: 'new' });
  assert.equal(calls.at(-1), 1);
  assert.equal(store.getState().userPlatforms[0].id, 'new');
  await store.getState().loadMoreUserPlatforms();
  await store.getState().deleteUserPlatform('new');
  assert.equal(calls.at(-1), 1);
  assert.equal(store.getState().userPlatforms[0].id, '0');
  assert.equal(store.getState().nextPage, 2);
});

test('search ignores late results and keeps its query when loading more', async t => {
  let resolveOld;
  const calls = [];
  const service = { findAll(page, limit, search) {
    calls.push({ page, search });
    if (search === 'old') return new Promise(resolve => { resolveOld = resolve; });
    return Promise.resolve({ data: [{ id: `new-${page}` }], total: 2, hasMore: page === 1 });
  }};
  const env = setup(undefined, {
    '../services/api/user-platforms': { userPlatformsService: service },
    '../i18n': { __esModule: true, default: { t: key => key } },
  });
  t.after(() => env.cleanup());
  const store = env.loadStore();
  const old = store.getState().loadUserPlatforms(1, 20, 'old');
  await store.getState().loadUserPlatforms(1, 20, 'new');
  resolveOld({ data: [{ id: 'old' }], total: 1, hasMore: false });
  await old;
  assert.equal(store.getState().userPlatforms[0].id, 'new-1');
  await store.getState().loadMoreUserPlatforms();
  assert.equal(store.getState().userPlatforms[1].id, 'new-2');
  assert.deepEqual(calls.at(-1), { page: 2, search: 'new' });
});

test('a pending page cannot append to a different search or restore a signed-out list', async t => {
  let resolvePage;
  const service = { findAll(page) {
    if (page === 2) return new Promise(resolve => { resolvePage = resolve; });
    return Promise.resolve({ data: [{ id: 'first' }], total: 2, hasMore: true });
  }};
  const env = setup(undefined, {
    '../services/api/user-platforms': { userPlatformsService: service },
    '../i18n': { __esModule: true, default: { t: key => key } },
  });
  t.after(() => env.cleanup());
  const store = env.loadStore();
  await store.getState().loadUserPlatforms();
  const pending = store.getState().loadMoreUserPlatforms();
  await store.getState().loadUserPlatforms(1, 20, 'changed');
  resolvePage({ data: [{ id: 'stale' }], total: 2, hasMore: false });
  await pending;
  assert.equal(store.getState().userPlatforms.length, 1);
  const afterLogout = store.getState().loadMoreUserPlatforms();
  store.getState().resetUserPlatforms();
  resolvePage({ data: [{ id: 'private' }], total: 2, hasMore: false });
  await afterLogout;
  assert.equal(store.getState().userPlatforms.length, 0);
});

test('platform selection includes later pages and creation returns the selected platform', async t => {
  const rows = Array.from({ length: 23 }, (_, index) => ({ id: String(index), name: `Platform ${index}` }));
  const env = setup(undefined, {
    '../services/api/platforms': { platformsService: {
      async findAll(page, limit) { return { platforms: rows.slice((page - 1) * limit, page * limit), total: rows.length }; },
      async create(data) { return { id: 'new-platform', ...data }; },
    } },
    '../i18n': { __esModule: true, default: { t: key => key } },
  });
  t.after(() => env.cleanup());
  const store = env.loadPlatformsStore();
  await store.getState().loadPlatforms();
  assert.equal(store.getState().platforms.length, 23);
  const created = await store.getState().createPlatform({ name: 'New' });
  assert.equal(created.id, 'new-platform');
  assert.equal(store.getState().platforms.at(-1).id, created.id);
});
