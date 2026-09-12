const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./auth-harness.cjs');

function fixture(t, generateBatchOTP) {
  let now = 100000;
  const clock = { now: () => now };
  const env = setup(undefined, {
    '../services/api/user-platforms': { userPlatformsService: { generateBatchOTP } },
    '../i18n': { __esModule: true, default: { t: key => key } },
  }, { Date: clock });
  t.after(() => env.cleanup());
  const store = env.loadStore();
  store.setState({ userPlatforms: ['a', 'b', 'c'].map(id => ({ id })) });
  return { store, setTime(value) { now = value; } };
}
const result = (ids, serverTime = 100000, expiresAt = 120000) => ({
  items: ids.map(id => ({ id, token: '123456' })), serverTime, expiresAt,
});

test('coalesces overlapping refreshes and reuses codes for the same window', async t => {
  const calls = [];
  let resolve;
  const { store } = fixture(t, ids => {
    calls.push([...ids]);
    if (calls.length === 1) return new Promise(r => { resolve = r; });
    return Promise.resolve(result(ids));
  });
  const first = store.getState().refreshOTPs(['a', 'b']);
  const overlapping = store.getState().refreshOTPs(['b', 'c']);
  const duplicate = store.getState().refreshOTPs(['a']);
  resolve(result(['a', 'b']));
  await Promise.all([first, overlapping, duplicate]);
  assert.deepEqual(calls, [['a', 'b'], ['c']]);
  await store.getState().refreshOTPs(['a', 'b', 'c']);
  assert.equal(calls.length, 2);
});

test('calibrates server clock and refreshes after time jumps without countdown ticks', async t => {
  let count = 0;
  const { store, setTime } = fixture(t, async ids => {
    count++;
    if (count === 1) {
      setTime(100400);
      return result(ids, 500000, 510000);
    }
    return result(ids, 560000, 570000);
  });
  await store.getState().refreshOTPs(['a', 'b']);
  assert.equal(store.getState().otpData.get('a').localExpiresAt, 110200);
  setTime(160000);
  await store.getState().refreshOTPs(['a', 'b']);
  assert.equal(count, 2);
  assert.ok(store.getState().otpData.get('a').localExpiresAt > 160000);
});

test('backs off on failure and permits later recovery', async t => {
  let count = 0;
  const { store, setTime } = fixture(t, async ids => {
    if (++count === 1) throw new Error('offline');
    return result(ids);
  });
  await store.getState().refreshOTPs(['a']);
  assert.equal(store.getState().refreshingPlatforms.size, 0);
  await store.getState().refreshOTPs(['a']);
  assert.equal(count, 1);
  setTime(105000);
  await store.getState().refreshOTPs(['a']);
  assert.equal(count, 2);
  assert.equal(store.getState().error, null);
});

test('ignores deleted bindings and responses from before logout', async t => {
  let resolve;
  const { store } = fixture(t, () => new Promise(r => { resolve = r; }));
  const pending = store.getState().refreshOTPs(['a', 'b']);
  store.setState({ userPlatforms: [{ id: 'b' }] });
  resolve(result(['a', 'b']));
  await pending;
  assert.equal(store.getState().otpData.has('a'), false);
  const next = store.getState().refreshOTPs(['c']); // not loaded: no request
  await next;
  store.setState({ userPlatforms: [{ id: 'c' }] });
  const oldSession = store.getState().refreshOTPs(['c']);
  store.getState().resetUserPlatforms();
  resolve(result(['c']));
  await oldSession;
  assert.equal(store.getState().otpData.size, 0);
});

test('splits large loaded lists into bounded batches', async t => {
  const sizes = [];
  const { store } = fixture(t, async ids => { sizes.push(ids.length); return result(ids); });
  const ids = Array.from({ length: 405 }, (_, i) => String(i));
  store.setState({ userPlatforms: ids.map(id => ({ id })) });
  await store.getState().refreshOTPs(ids);
  assert.deepEqual(sizes, [200, 200, 5]);
  assert.equal(store.getState().otpData.size, 405);
});
