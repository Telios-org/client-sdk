const EventEmitter = require('events');
const routes = require('./routes');
const callout = require('./callout');

class Domain extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client
  }

  isAvailable(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.account.isAvailable
    });
  }

  register(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: payload,
      route: routes.account.register
    });
  }

  delete() {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.account.delete
    });
  }

  verifyOwnership(code) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: {},
      param: code,
      route: routes.account.verifyOwnership
    });
  }

  verifyDNS() {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.account.verifyDNS
    });
  }
}

module.exports = Domain;