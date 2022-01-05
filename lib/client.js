const EventEmitter = require('events');

class Client extends EventEmitter {
  constructor(opts) {
    super();

    const { provider, auth = {}, ...rest } = opts
    this.provider = provider
    this.auth = auth 
    this.opts = rest
  }
}

module.exports = Client;