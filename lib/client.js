const EventEmitter = require('events');

class Client extends EventEmitter {
  constructor(opts) {
    super();

    this.provider = opts.provider;
    this.opts = opts;
  }
}

module.exports = Client;