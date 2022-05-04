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

  async add(stream, { encrypt }) {
    let payload = stream;

    const encryptedStream = new MemoryStream();
    let key;
    let header;
    let size;

    if(encrypt) {
      const fixedChunker = new FixedChunker(stream, MAX_PLAINTEXT_BLOCK_SIZE);
      const encrypted = await Crypto.encryptStream(fixedChunker, encryptedStream);

      key = encrypted.key;
      header = encrypted.header;
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
      key: key ? key.toString('hex') : null,
      header: header ? header.toString('hex') : null,
      size: size ? size : null
    }
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
      return streamCipher.decryptStream(memoryStream, key, header);
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