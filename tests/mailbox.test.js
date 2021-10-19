const tape = require('tape');
const _test = require('tape-promise').default;
const test = _test(tape);
const fs = require('fs');
const path = require('path');
const Drive = require('@telios/nebula-drive');
const { Mailbox, Account, Crypto } = require('..');

const testSetup = require('./helpers/setup');

let encMeta = null;
let sealedMsg = null;
let localDrive = null;

const metaFilePath = path.join(__dirname, './data/enc_meta.tmp.json')

const conf = testSetup.conf();

// Mailbox test setup
const initMailbox = async () => {

  const mailbox = new Mailbox({
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

  return mailbox;
}

test('Mailbox - Setup', async t => {
  localDrive = new Drive(path.join(__dirname, '/localDrive'), null, {
    keyPair: {
      publicKey: Buffer.from(conf.ALICE_SIG_PUB_KEY, 'hex'),
      secretKey: Buffer.from(conf.ALICE_SIG_PRIV_KEY, 'hex')
    },
    swarmOpts: {
      server: true,
      client: true
    }
  });

  await localDrive.ready();
});

test('Mailbox - Send mail', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const email = conf.TEST_EMAIL;

  const res = await mailbox.send(email, {
    owner: conf.ALICE_MAILBOX,
    keypairs: {
      secretBoxKeypair: {
        privateKey: conf.BOB_SB_PRIV_KEY,
        publicKey: conf.BOB_SB_PUB_KEY
      },
      signingKeypair: {
        privateKey: conf.BOB_SIG_PRIV_KEY,
        publicKey: conf.BOB_SIG_PUB_KEY
      }
    },
    drive: localDrive,
    dest: '/test-email.json'
  });

  t.ok(res, `Sent mail to Telios recipient`);
});

test('Mailbox - Encrypt mail metadata', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const bobKeypairs = {
    secretBoxKeypair: {
      privateKey: conf.BOB_SB_PRIV_KEY,
      publicKey: conf.BOB_SB_PUB_KEY
    },
    signingKeypair: {
      privateKey: conf.BOB_SIG_PRIV_KEY,
      publicKey: conf.BOB_SIG_PUB_KEY
    }
  }

  const aliceAccountPubKey = conf.ALICE_SB_PUB_KEY;

  const meta = {
    "owner": conf.ALICE_MAILBOX,
    "type": "email",
    "key": "test-key",
    "header": "test-header",
    "discovery_key": localDrive.discoveryKey,
    "hash": 'test-hash',
    "name": 'test-email.json',
    "size": 100
  };

  encMeta = mailbox._encryptMeta(meta, aliceAccountPubKey, bobKeypairs);

  t.ok(encMeta, `Encrypted mail metadata => ${encMeta}`);
});

test('Mailbox - Seal encrypted metadata', async t => {
  const mailbox = await initMailbox();

  const fromPubKey = conf.BOB_SB_PUB_KEY;
  const toPubKey = conf.ALICE_SB_PUB_KEY;

  sealedMsg = mailbox._sealMeta(encMeta, fromPubKey, toPubKey);

  t.ok(sealedMsg, 'Sealed encrypted metadata');
  t.end();
});

test('Mailbox - Register', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const payload = {
    account_key: 'account-key-test',
    name: 'Alice Tester',
    addr: 'test@telios.io'
  };

  const res = await mailbox.registerMailbox(payload);

  t.equals(res.registered, true, 'Mailbox can create new mailbox');
});

test('Mailbox - Register alias name', async t => {
  t.plan(1);

  const secretBoxKeypair = Crypto.boxSeedKeypair();

  const mailbox = await initMailbox();
  const res = await mailbox.registerAliasName({
    alias_name: 'aliceAlias',
    domain: 'telios.io',
    key: secretBoxKeypair.publicKey
  });

  t.equals(res.registered, true, 'Can create new alias name');
});

test('Mailbox - Remove alias name', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const res = await mailbox.removeAliasName({ alias_name: 'aliceAlias' });

  t.ok(res, 'Can remove alias name');
});

test('Mailbox - Register alias address', async t => {
  t.plan(2);

  const mailbox = await initMailbox();
  const res = await mailbox.registerAliasAddress({
    alias_address: 'aliceAlias#netflix@telios.io',
    forwards_to: [],
    whitelisted: true
  });

  t.equals(res._xid, "155", 'Alias registered on mailserver and has external id');
  t.equals(res.registered, true, 'Can create new alias address');
});

test('Mailbox - Update alias address', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const res = await mailbox.updateAliasAddress({
    alias_address: 'aliceAlias#netflix@telios.io',
    forwards_to: [
      "alice@mail.io"
    ],
    disabled: false,
    whitelisted: true
  });

  t.equals(JSON.stringify(res.forwards_to), JSON.stringify(["alice@mail.io"]), 'Can update alias address');
});

test('Mailbox - Remove alias address', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const res = await mailbox.removeAliasAddress('aliceAlias#netflix@telios.io');

  t.ok(res, 'Can delete alias address');
});

test('Mailbox - Get public keys', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const res = await mailbox.getMailboxPubKeys(['alice@telios.io']);

  t.equals(1, res.length, 'Returned 1 mailbox public key');
});

test('Mailbox - Mark emails as synced', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const res = await mailbox.markAsSynced(['5f11e4554e19c8223640f0bc']);

  t.ok(res, `Marked emails as synced`);
});

test('Mailbox - Get new mail metadata', async t => {
  t.plan(1);

  const bobKeypairs = {
    secretBoxKeypair: {
      privateKey: conf.BOB_SB_PRIV_KEY,
      publicKey: conf.BOB_SB_PUB_KEY
    },
    signingKeypair: {
      privateKey: conf.BOB_SIG_PRIV_KEY,
      publicKey: conf.BOB_SIG_PUB_KEY
    }
  };

  const mailbox = await initMailbox();

  const readStream = fs.createReadStream(path.join(__dirname, '/data/email.eml'));

  // Encrypt file and save on drive
  let file = await localDrive.writeFile('/email/rawEmailEncrypted.eml', readStream, { encrypted: true });

  const meta = {
    "owner": conf.ALICE_MAILBOX,
    "type": "email",
    "key": file.key.toString('hex'),
    "header": file.header.toString('hex'),
    "discovery_key": localDrive.discoveryKey,
    "hash": file.hash,
    "name": `${file.name}.${file.mimetype}`,
    "size": file.size
  };

  const encryptedMeta = mailbox._encryptMeta(meta, conf.ALICE_SB_PUB_KEY, bobKeypairs);
  const encMsg = mailbox._sealMeta(encryptedMeta, conf.BOB_SB_PUB_KEY, conf.ALICE_SB_PUB_KEY);

  const encMeta = [{
    account_key: conf.ALICE_SB_PUB_KEY,
    msg: encMsg.toString('hex'),
    _id: '5f1210b7a29fe6222f199f80'
  }];

  fs.writeFileSync(metaFilePath, JSON.stringify(encMeta));

  const res = await mailbox.getNewMailMeta();

  t.equals(1, res.length, `Mail meta count === ${res.length}`);
});

test('Mailbox - Send mail metadata', async t => {
  t.plan(1);

  const mailbox = await initMailbox();

  const payload = [
    {
      account_key: 'account-key-test1',
      msg: 'encrypted message'
    },
    {
      account_key: 'account-key-test2',
      msg: 'encrypted message'
    }
  ];

  const res = await mailbox._sendMailMeta(payload);

  t.ok(res, `Sent mail metadata`);
});

test('Mailbox - Retrieve unread mail and decrypt', async t => {
  t.plan(1);

  const mailbox = await initMailbox();
  const mailMeta = await mailbox.getNewMail(conf.ALICE_SB_PRIV_KEY, conf.ALICE_SB_PUB_KEY);
  const { signingKeypair } = Account.makeKeys();

  const keyPair = {
    publicKey: Buffer.from(signingKeypair.publicKey, 'hex'),
    secretKey: Buffer.from(signingKeypair.privateKey, 'hex')
  };

  const files = [];
  const drive2 = new Drive(__dirname + '/drive2', null, {
    keyPair,
    swarmOpts: {
      server: true,
      client: true
    }
  });

  await drive2.ready();

  for (meta of mailMeta) {
    files.push(meta);
  }

  await drive2.fetchFileBatch(files, (stream, file) => {
    return new Promise((resolve, reject) => {
      let content = '';

      stream.on('data', chunk => {
        content += chunk.toString();
      });

      stream.on('error', err => {
        t.error(err, err.message);
      })

      stream.on('end', () => {
        t.ok(content.length);
        resolve();
      });
    })
  });
});

test.onFinish(async () => {
  fs.unlinkSync(metaFilePath);
  process.exit(0);
});
