const tape = require("tape");
const _test = require("tape-promise").default;
const test = _test(tape);
const ClientSDK = require("..");
const testSetup = require("./helpers/setup");

test("Test Setup", async (t) => {
  await testSetup.init();
  t.end();
});

test("Account - Make Keypairs", async (t) => {
  const clientSDK = new ClientSDK({
    provider: 'https://apiv1.telios.io'})
  const Account = clientSDK.Account
  const keyPair = Account.makeKeys()
  const recovered = Account.makeKeys(keyPair.mnemonic)

  t.ok(keyPair.secretBoxKeypair.privateKey, `Secret box private key: ${keyPair.secretBoxKeypair.privateKey}`);
  t.ok(keyPair.secretBoxKeypair.publicKey, `Secret box public key: ${keyPair.secretBoxKeypair.publicKey}`);
  t.equals(keyPair.signingKeypair.seedKey, keyPair.secretBoxKeypair.seedKey, 'Keypair seed keys match');

  t.ok(keyPair.signingKeypair.privateKey, `Signing private key: ${keyPair.signingKeypair.privateKey}`);
  t.ok(keyPair.signingKeypair.publicKey, `Signing public key: ${keyPair.signingKeypair.publicKey}`);

  t.ok(keyPair.mnemonic, `Mnemonic : ${keyPair.mnemonic}`);

  t.equals(recovered.secretBoxKeypair.privateKey, keyPair.secretBoxKeypair.privateKey, 'Recovered secretBoxKeypair private keys match.');
  t.equals(recovered.secretBoxKeypair.publicKey, keyPair.secretBoxKeypair.publicKey, 'Recovered secretBoxKeypair public keys match.');

  t.equals(recovered.signingKeypair.privateKey, keyPair.signingKeypair.privateKey, 'Recovered signingKeypair private keys match.');
  t.equals(recovered.signingKeypair.publicKey, keyPair.signingKeypair.publicKey, 'Recovered signingKeypair public keys match.');

  t.end();
});

test("Account - Init", async (t) => {
  t.plan(2);

  const conf = testSetup.conf();
  try {
    const opts = {
      account: {
        account_key: conf.ALICE_SB_PUB_KEY,
        recovery_email: conf.ALICE_RECOVERY,
        device_drive_key: conf.ALICE_DRIVE_KEY,
        device_drive_diff_key: conf.ALICE_DIFF_KEY,
        device_signing_key: conf.ALICE_SIG_PUB_KEY
      },
    };

    const clientSDK = new ClientSDK({
      provider: 'https://apiv1.telios.io'})
    const Account = clientSDK.Account
    const { account, sig } = await Account.init(opts, conf.ALICE_SIG_PRIV_KEY);

    t.ok(account, "Account object returned");
    t.ok(sig, "Account object signed");
  } catch (err) {
    t.error(err);
  }
});

test("Account - Register", async (t) => {
  t.plan(1);

  const conf = testSetup.conf();
  const clientSDK = new ClientSDK({
    provider: 'https://apiv1.telios.io'})
  const Account = clientSDK.Account
  const payload = {
    account: {
      account_key: conf.ALICE_SB_PUB_KEY,
      recovery_email: conf.ALICE_RECOVERY,
      device_drive_key: conf.ALICE_DRIVE_KEY,
      device_drive_diff_key: conf.ALICE_DIFF_KEY,
      device_signing_key: conf.ALICE_SIG_PUB_KEY,
      device_id: conf.ALICE_DEVICE_1_ID,
    },
    sig: conf.ALICE_ACCOUNT_SIG,
    vcode: "11111",
  };

  const res = await Account.register(payload);

  t.ok(res, "Account can register");
});

test("Account - Create auth token", async (t) => {
  t.plan(1);

  const conf = testSetup.conf();
  const clientSDK = new ClientSDK({
    provider: 'https://apiv1.telios.io'})
  const Account = clientSDK.Account
  const claims = {
    account_key: conf.ALICE_SB_PUB_KEY,
    device_signing_key: conf.ALICE_SIG_PUB_KEY,
    device_id: conf.ALICE_DEVICE_1_ID,
    sig: conf.ALICE_ACCOUNT_SERVER_SIG,
  };

  const payload = Account.createAuthToken(claims, conf.ALICE_SIG_PRIV_KEY);
  t.ok(payload, "Account has authorization payload");
});

test("Account - Retrieved Stats", async (t) => {
  t.plan(1)
  const conf = testSetup.conf();
  const clientSDK = new ClientSDK({
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

  const Account = clientSDK.Account;

  const res = await Account.retrieveStats();
  t.ok(res, "Account can retrieve its Stats");
})

test("Account - Recover", async (t) => {
  t.plan(1)
  const clientSDK = new ClientSDK({
    provider: 'https://apiv1.telios.io'
  })

  const Account = clientSDK.Account;

  const res = await Account.recover({ email: 'alice@telios.io', recovery_email: 'alice@telios.io' });

  t.ok(res, "Account can initiate recovery");
})

test("Account - Create sync code", async (t) => {
  t.plan(1);
  const conf = testSetup.conf();
  const clientSDK = new ClientSDK({
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

  const Account = clientSDK.Account;

  const { code } = await Account.createSyncCode();

  t.equals(code, "AbC123", "Account generated a new code for device syncing.");
});

test("Account - Get sync info", async (t) => {
  t.plan(3);
  const clientSDK = new ClientSDK({
    provider: 'https://apiv1.telios.io'
  });

  const Account = clientSDK.Account;

  const { drive_key, peer_pub_key, email } = await Account.getSyncInfo({ code: 'AbC123' });

  t.ok(email, "Account sync returned account email address");
  t.ok(drive_key, "Account sync returned drive_key");
  t.ok(peer_pub_key, "Account sync returned peer_pub_key");
});

test("Account - Register new device", async (t) => {
  t.plan(1);
  const conf = testSetup.conf();
  const clientSDK = new ClientSDK({
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

  const Account = clientSDK.Account;

  const { sig } = await Account.registerNewDevice({
    type: "DESKTOP",
    device_id: '00000000-0000-9999-000000000000',
    device_drive_key: '0000000000000000000000000000000000000000000000000000000000000002',
    device_signing_key: '0000000000000000000000000000000000000000000000000000000000000001'
  });

  t.ok(sig, "Account has added a new device and generated a new server signature");
});

test.onFinish(async () => {
  process.exit(0);
});
