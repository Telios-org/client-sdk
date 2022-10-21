const Account = require('./lib/account');
const Crypto = require('./lib/crypto');
const Mailbox = require('./lib/mailbox');
const IPFS = require('./lib/ipfs');
const Client = require('./lib/client');
const Domain = require('./lib/domain')

class ClientSDK {
  constructor(opts = {}) {
    this.client = new Client(opts)
    this.Account = new Account(this.client)
    this.Mailbox = new Mailbox(this.client)
    this.Domain = new Domain(this.client)
    this.IPFS = new IPFS(this.client)
    this.Crypto = Crypto
  }

  setAuthPayload(auth) {
    try{
      this.client.auth = auth
      return true
    }catch(e){
      console.log(e)
      return false
    }
  }

  setProvider(provider) {
    try{
      this.client.provider = provider
      return true
    }catch(e){
      console.log(e)
      return false
    }
  }

}

module.exports = ClientSDK