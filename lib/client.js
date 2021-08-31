const EventEmitter = require('events');
const p2plex = require('p2plex');

class Client extends EventEmitter {
  constructor(opts) {
    super();

    this.provider = opts.provider;
    this.opts = opts;

    /**
     * Joins the hyperswarm network and listens on the mail ingress topic provided by the server.
     * The mail ingress topic is a hash of the mailbox's internal ID from mongoDB. Only the server and
     * owner of this account will have this topic. Before opening streams the server validates the peer keyPair
     * matches one of the registered devices. If it does, then a stream of encrytped metadata is passed to the client
     * for retrieving the email.
     */
    // this._joinNetwork(opts.privateMailIngressTopic);
  }

  _joinNetwork(topic) {
    const plex = p2plex({ keyPair: this.keyPair });
  
    plex.join(Buffer.from(topic, 'hex'), { announce: true, lookup: false });

    plex.on('connection', (peer) => {
      peer.receiveStream('new-mail').on('data', (data) => {
        const { msg } = JSON.parse(data.toString('utf8'));
        this.emit('mail-received', { peerPubKey: peer.publicKey.toString('hex'), msg });
      })
    })
  }
}

module.exports = Client;