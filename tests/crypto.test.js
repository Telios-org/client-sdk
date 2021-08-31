const tape = require('tape');
const { Crypto } = require('..');

tape('Crypto', async t => {
  const secret = Crypto.generateAEDKey();
  const encrypted = Crypto.encryptAED('Hey this is a secret message!', secret);
  const deciphered = Crypto.decryptAED(encrypted, secret);
  t.equals(deciphered, 'Hey this is a secret message!');
});