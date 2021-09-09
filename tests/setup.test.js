const tape = require('tape');
const _test = require('tape-promise').default;
const test = _test(tape);
const testSetup = require('./helpers/setup');

test('Test Setup', async t => {
  t.plan(1);
  await testSetup.init();
  t.ok(1);
});

// test.onFinish(async () => {
//   process.exit(0);
// });