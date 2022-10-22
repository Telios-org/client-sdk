const tape = require("tape");
const _test = require("tape-promise").default;
const test = _test(tape);
const ClientSDK = require("..");
const testSetup = require("./helpers/setup");

const conf = testSetup.conf();

const initClientSDK = async () => {
  const clientSDK = await new ClientSDK({
    provider: 'https://apiv1.telios.io',
    auth: {
      claims: {
        account_key: conf.ALICE_SB_PUB_KEY,
        device_signing_key: conf.ALICE_SIG_PUB_KEY,
        device_id: conf.ALICE_DEVICE_1_ID
      },
      device_signing_priv_key: conf.ALICE_SIG_PRIV_KEY,
      sig: conf.ALICE_ACCOUNT_SERVER_SIG
    }
  });
  return clientSDK;
}

// Test setup
const initDomains = async () => {
  const clientSDK = await initClientSDK();
  return clientSDK.Domain;
}

test('Domains - Is domain available', async t => {
  t.plan(1);

  const domain = await initDomains();

  const isAvailable = await domain.isAvailable('telios.app');

  t.equals(true, isAvailable);
});

test('Domains - Register new domain', async t => {
  t.plan(2);

  const domain = await initDomains();

  const payload = {
    domain:'telios.app'
  };

  const res = await domain.register(payload);

  t.equals(res.domain, 'telios.app');
  t.ok(res.verification);
});

test('Domains - delete domain', async t => {
  t.plan(1);

  const domain = await initDomains();

  const payload = {
    domain:'telios.app'
  };

  try {
    await domain.delete(payload);
    t.ok('Deleted domain telios.app');
  } catch(err) {
    t.fail(err);
  }
});

test('Domains - verify domain ownership', async t => {
  t.plan(1);

  const domain = await initDomains();

  try {
    const res = await domain.verifyOwnership('telios.app');
    t.ok(res.verified);
  } catch(err) {
    t.fail(err);
  }
});

test('Domains - verify DNS', async t => {
  t.plan(4);

  const domain = await initDomains();

  try {
    const {records} = await domain.verifyDNS('telios.app');
    
    for(const record of records) {
      if(record.type === 'MX' && record.verified) {
        t.ok(record.value, 'MX Record verified');
      }

      if(record.type === 'TXT' && record.value.indexOf('spf') > -1 && record.verified) {
        t.ok(record.value, 'SPF Record verified');
      }

      if(record.type === 'TXT' && record.name.indexOf('dkim') > -1 && record.verified) {
        t.ok(record.name, 'DKIM Record verified');
      }

      if(record.type === 'TXT' && record.name.indexOf('_dmarc') > -1 && record.verified) {
        t.ok(record.name, 'DMARC Record verified');
      }
    }

  } catch(err) {
    t.fail(err);
  }
});

test('Domains - register mailbox', async t => {
  t.plan(1);

  const domain = await initDomains();

  const payload = {
    name: 'Bob Tester',
    addr:'bob@telios.app',
    mailbox_key: '0000000000000000000000000000000000000000000000000000000000000000'
  };

  try {
    const res = await domain.registerMailbox(payload);

    t.ok(res.registered);
  } catch(err) {
    t.fail(err);
  }
});

test('Domains - update mailbox', async t => {
  t.plan(2);

  const domain = await initDomains();

  const payload = {
    addr:'bob@telios.app',
    disabled: true
  };

  try {
    const res = await domain.updateMailbox(payload);

    t.ok(res.address);
    t.equals(res.disabled, true);
  } catch(err) {
    t.fail(err);
  }
});

test('Domains - delete mailbox', async t => {
  t.plan(1);

  const domain = await initDomains();

  const payload = {
    addr:'bob@telios.app'
  };

  try {
    const res = await domain.deleteMailbox(payload);
    t.ok(res.removed);
  } catch(err) {
    t.fail(err);
  }
});