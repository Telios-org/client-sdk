const EventEmitter = require('events');
const routes = require('./routes');
const callout = require('./callout');
const MemoryStream = require('memorystream');
const streamCipher = require('../util/streamEncrypt.js');
const FixedChunker = require('@telios/nebula/util/fixedChunker');
const Crypto = require('@telios/nebula/lib/crypto');

const MAX_PLAINTEXT_BLOCK_SIZE = 65536;

class IPFS extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client;
  }

  async add(stream, opts = {}) {
    let payload = stream;

    const encryptedStream = new MemoryStream();
    let key;
    let header;
    let size;

    if(opts.encrypt) {
      const fixedChunker = new FixedChunker(stream, MAX_PLAINTEXT_BLOCK_SIZE);
      const encrypted = await Crypto.encryptStream(fixedChunker, encryptedStream);

      key = encrypted.key.toString('hex');
      header = encrypted.header.toString('hex');
      size = encrypted.file.size;
      payload = encryptedStream
    }

    const data = await callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.ipfs.add,
      stream: true
    });

    return {
      uuid: data.uuid,
      key,
      header,
      size: size
    }
  }

  async get(cid, key, header) {
    if(key && typeof key !== 'string') {
      key = Buffer.from(key, 'hex');
    }

    if(header && typeof header !== 'string') {
      header = Buffer.from(header, 'hex');
    }

    const response = await callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.ipfs.get,
      param: cid,
      stream: true
    });

    if (key && header) {
      return streamCipher.decryptStream(response.body, key, header);
    }

    return response.body;
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

  async status(id) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      param: id,
      route: routes.ipfs.status,
    });
  }
}

module.exports = IPFS;