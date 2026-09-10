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
