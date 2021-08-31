const EventEmitter = require('events');
const routes = require('./routes');
const Crypto = require('./crypto');
const callout = require('./callout');
const { v4: uuidv4 } = require('uuid');

class Account extends EventEmitter {
  constructor(provider, keyPair) {
    super();
    
    this.provider = provider;
    this.keyPair = keyPair;

    if(keyPair) {
      this._joinSelfSwarm();
    }
  }

  static makeKeys(mnemonic) {
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
  static async init(opts, privKey) {
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

  static createAuthToken(account, privKey) {
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
        provider: this.provider,
        payload: payload,
        route: routes.account.register
      });
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = Account;