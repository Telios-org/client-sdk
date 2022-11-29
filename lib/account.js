const EventEmitter = require('events');
const routes = require('./routes');
const Crypto = require('@telios/nebula/lib/crypto');
const callout = require('./callout');
const { v4: uuidv4 } = require('uuid');

class Account extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client
  }

  makeKeys(mnemonic) {
    const signingKeypair = Crypto.signSeedKeypair(mnemonic);

    if(!mnemonic) {
      mnemonic = signingKeypair.mnemonic;
    }

    const secretBoxKeypair = Crypto.boxSeedKeypair(mnemonic);

    return {
      signingKeypair: signingKeypair,
      secretBoxKeypair: secretBoxKeypair,
      mnemonic
    }
  }

  // Account Actions
  async init(opts, privKey) {
    // Generate device ID
    const id = uuidv4();

    // Create Account payload
    const acct = {
      ...opts.account,
      device_id: id
    };

    // Sign payload
    const sig = Crypto.signDetached(acct, privKey);

    return { account: acct, sig: sig };
  }

  createAuthToken(account, privKey) {
    account['date_time'] = new Date().toISOString();

    const sig = Crypto.signDetached(account, privKey);
    const auth = JSON.stringify({ account: { ...account }, sig: sig });
    
    return Buffer.from(auth, 'utf-8').toString('base64');
  }

  register(payload) {
    // signature precheck
    try {
      if (!Crypto.verifySig(payload.sig, payload.account.device_signing_key, payload.account)) throw new Error('Unable to verify account signature');

      return callout({
        provider: this.client.provider,
        payload: payload,
        route: routes.account.register
      });
    } catch (e) {
      console.log(e);
    }
  }

  registerNewDevice(payload, signingPrivKey) {
    let sigData = {
      account_key: payload.account_key,
      device_id: payload.device_id,
      device_signing_key: payload.device_signing_key
    }

    const sig = Crypto.signDetached(sigData, Buffer.from(signingPrivKey, 'hex'));

    const _payload = { ...payload, sig }

    return callout({
      event: this,
      provider: this.client.provider,
      payload: _payload,
      route: routes.account.registerNewDevice
    });
  }

  registerSigningKey(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.account.registerSigningKey
    });
  }

  recover(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: payload,
      route: routes.account.recover
    });
  }

  createSyncCode() {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.account.createSyncCode
    });
  }

  getSyncInfo(code) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: {},
      param: code,
      route: routes.account.getSyncInfo
    });
  }

  retrieveStats() {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.account.retrieve_stats
    });
  }
}

module.exports = Account;