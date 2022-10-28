const EventEmitter = require('events');
const routes = require('./routes');
const callout = require('./callout');

class Domain extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client
  }

  async isAvailable(domain) {
    try {
      await callout({
        event: this,
        provider: this.client.provider,
        auth: this.client.auth,
        payload: {},
        route: routes.domain.isAvailable,
        param: domain
      });
      return true
    } catch(err) {
      return err
    }
  }

  register(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.domain.register
    });
  }

  delete(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.domain.delete
    });
  }

  verifyOwnership(domain) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.domain.verifyOwnership,
      param: domain
    });
  }

  verifyDNS(domain) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.domain.verifyDNS,
      param: domain
    });
  }

  registerMailbox(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.domain.registerMailbox
    });
  }

  updateMailbox(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.domain.updateMailbox
    });
  }

  deleteMailbox(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.domain.deleteMailbox
    });
  }
}

module.exports = Domain;