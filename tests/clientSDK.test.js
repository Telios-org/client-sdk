const tape = require('tape');
const _test = require('tape-promise').default;
const test = _test(tape);

const ClientSDK = require('..');
const testSetup = require('./helpers/setup');
const conf = testSetup.conf();


test('ClientSDK - Setter Methods', async t => {
  t.plan(2);
  
  const clientSDK = await new ClientSDK()
  
  const provider = 'https://apiv1.telios.io'
  const auth = {
    claims: {
      account_key: conf.ALICE_SB_PUB_KEY,
      device_signing_key: conf.ALICE_SIG_PUB_KEY,
      device_id: conf.ALICE_DEVICE_1_ID
    },
    device_signing_priv_key: conf.ALICE_SIG_PRIV_KEY,
    sig: conf.ALICE_ACCOUNT_SERVER_SIG
  }

  clientSDK.setProvider(provider)
  clientSDK.setAuthPayload(auth)

  t.equals(provider, clientSDK.client.provider, `Provider matches what was set`);
  t.equals(auth, clientSDK.client.auth, `Auth Payload matches what was set`);

  t.end();
});
