const tape = require("tape");
const _test = require("tape-promise").default;
const test = _test(tape);
const ClientSDK = require("..");
const testSetup = require("./helpers/setup");
const fs = require('fs');
const path = require('path');

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
  }
  )
  return clientSDK
}

const initIPFS = async () => {
  const clientSDK = await initClientSDK();
  return clientSDK.IPFS;
}

test('IPFS - Add file', async t => {
  t.plan(4);

  const ipfs = await initIPFS();
  const stream = fs.createReadStream(path.join(__dirname, '/data/email.eml'))
  const response = await ipfs.add(stream, { encrypt: true });

  t.ok(response.uuid);
  t.ok(response.key);
  t.ok(response.header);
  t.ok(response.size);
});

test('IPFS - Get file', async t => {
  t.plan(1);

  const ipfs = await initIPFS();
  const stream = await ipfs.get('bafybeicwgg35q3jje4wn7jzo363bynfeaczrfpvuksslsbtdmikmnkk42', conf.IPFS_FILE_ENCRYPTION_KEY, conf.IPFS_FILE_ENCRYPTION_HEADER);
  
  stream.on('data', data => {
    // we have data
  })

  stream.on('error', err => {
    t.fail(err)
  })

  stream.on('end', () => {
    t.ok(1)
  })
});

test('IPFS - Get file upload progress', async t => {
  t.plan(4);

  const ipfs = await initIPFS();
  const res = await ipfs.status('ca91cdbd-f640-49b6-fed2-cdf9bd987037');

  t.ok(res.uuid);
  t.ok(res.cid);
  t.equals(res.uploaded, 1337);
  t.equals(res.done, true);
});

test('IPFS - Delete file', async t => {
  const ipfs = await initIPFS();
  const response = await ipfs.delete('bafybeicwgg35q3jje4wn7jzo363bynfeaczrfpvuksslsbtdmikmnkk42');
  
  t.ok(response)
});
