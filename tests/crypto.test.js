const tape = require('tape');
const { Crypto } = require('..');

tape('Encrypt message string from AED key', async t => {
  const secret = Crypto.generateAEDKey();
  const encrypted = Crypto.encryptAED('Hey this is a secret message!', secret);
  const deciphered = Crypto.decryptAED(encrypted, secret);
  t.equals(deciphered, 'Hey this is a secret message!', 'Messages match');
});

tape('Create Secret Box Keypair from String', async t => {
  const keypair = Crypto.boxKeypairFromStr('This is my test string');

  t.ok(keypair.publicKey, 'Can create public key from string');
  t.ok(keypair.privateKey, 'Can create private key from string');
});