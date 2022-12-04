const EventEmitter = require('events');

class Client extends EventEmitter {
  constructor(opts) {
    super();

    const { provider, IPFSGateway, auth = {}, ...rest } = opts
    this.provider = provider
    this.IPFSGateway = IPFSGateway || provider
    this.auth = auth 
    this.opts = rest
  }
}

module.exports = Client;