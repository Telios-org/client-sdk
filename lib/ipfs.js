const EventEmitter = require('events');
const routes = require('./routes');
const callout = require('./callout');
const MemoryStream = require('memorystream');
const encrypt = require('../util/streamEncrypt.js');

class IPFS extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client;
  }

  async add(stream) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: stream,
      route: routes.ipfs.add,
      stream: true
    });
  }

  async get(cid, key, header) {
    const memoryStream = new MemoryStream();

    const response = await callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.ipfs.get,
      param: cid,
      stream: true
    });

    setTimeout(async () => {
      for await (const chunk of response.body) {
        memoryStream.write(chunk);
      }

      memoryStream.end();
    });

    if (key && header) {
      return encrypt.decryptStream(memoryStream, key, header);
    }

    return memoryStream;
  }

  async delete(cid) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: { cid },
      route: routes.ipfs.delete,
    });
  }
}

module.exports = IPFS;