const callout = require('./callout');
const routes = require('./routes');
const Crypto = require('@telios/nebula/lib/crypto');
const MemoryStream = require('memorystream');

class Mailbox {
  constructor(client) {
    this.client = client
  }

  registerMailbox(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.register
    });
  }

  registerAliasName(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.register_alias_name
    });
  }

  removeAliasName(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.remove_alias_name
    });
  }

  registerAliasAddress(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.register_alias_address
    });
  }

  updateAliasAddress(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.update_alias_address
    });
  }

  removeAliasAddress(address) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: { alias_address: address },
      route: routes.mailbox.remove_alias_address
    });
  }

  getMailboxPubKeys(addresses) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: {},
      route: routes.mailbox.get_public_key,
      param: addresses
    });
  }

  isValidRecoveryEmail(email) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: null,
      payload: {},
      route: routes.mailbox.isvalid_recovery_email,
      param: email
    });
  }

  async getNewMail(privKey, acctPubKey) {
    const newMail = await this.getNewMailMeta();
    const metaList = [];

    for (let i = 0; i < newMail.length; i++) {
      metaList.push(this._decryptMailMeta(newMail[i], privKey, acctPubKey));
    }

    return metaList;
  }

  getNewMailMeta() {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: {},
      route: routes.mailbox.get_new_mail
    });
  }

  /**
   * When sending an email to multiple recipients, the recipient's email domain is checked
   * for whether or not their inbox is telios.io or a provider that's using the same encryption
   * protocol. In this case the email is encrypted, stored on the local drive, and an encrypted message
   * is sent that only the recipient can decipher. The deciphered metadata gives the recipient instructions
   * how to to retrieve and decipher thier encrypted email.
   *
   * In the instance of multiple recipients from non-compatible email providers (gmail, yahoo, etc..), the email
   * is initially sent without encryption via normal SMTP. The reason for this is it doesn't make sense to encrypt an email that's
   * being sent in cleartext to other recipients. If some of the recipients are using telios.io, the email WILL
   * be encrypted at rest when picked up by the mailserver for Telios recipients.
   */

  async send(email, opts) {
    let extRecipients = false;
    const recipients = [];
    const fetchRecipPubKeys = [];

    /**
     * Loop through recipients to check if outgoing mail needs to be encrypted
     * based off recipient's email provider.
     */

    for (let i = 0; i < email.to.length; i++) {
      const recipient = email.to[i];

      if(!recipient.account_key) {
        fetchRecipPubKeys.push(recipient.address);
      }
    }

    if (email.cc && email.cc.length > 0) {
      for (let i = 0; i < email.cc.length; i++) {
        const recipient = email.to[i];

        if(!recipient.account_key) {
          fetchRecipPubKeys.push(recipient.address);
        }
      }
    }

    if (email.bcc && email.bcc.length > 0) {
      for (let i = 0; i < email.bcc.length; i++) {
        const recipient = email.to[i];

        if(!recipient.account_key) {
          fetchRecipPubKeys.push(recipient.address);
        }
      }
    }

    try {
      let extMsg = { ...email };

      if(email.attachments && email.attachments.length) {
        extMsg.attachments = extMsg.attachments.map(file => {
          return {
            filename: file.filename,
            content: file.content,
            contentType: file.contentType || file.mimetype
          }
        });
      }
  
      const mailboxes = await this.getMailboxPubKeys(fetchRecipPubKeys);

      let mailboxCount = 0;

      for (const address in mailboxes) {
        mailboxCount += 1;
        const mailbox = mailboxes[address];
        recipients.push(mailbox);
      }

      // If not all of the recipients are Telios users, then this message needs to be sent externally
      if(mailboxCount < fetchRecipPubKeys.length) {
        extRecipients = true;
      }

      // Unsecure domains in recipient list
      if (extRecipients) {
        await this._sendExternalMail(extMsg);
        return;
      }

      const mailMeta = [];

      for (const recipient of recipients) {
        if(recipient.account_key) {
          const segments = email.path.split('/');
          const nameExt = segments[segments.length-1];
          const name = nameExt.split('.')[0];
          const mimetype = nameExt.split('.')[1];

          let meta = {
            "owner": opts.owner,
            "type": "email",
            "cid": email.cid,
            "key": email.key,
            "header": email.header,
            "name": `${name}.${mimetype}`,
            "size": email.size
          };

          const encryptedMeta = this._encryptMeta(meta, recipient.account_key, opts.keypairs);
          const encMsg = this._sealMeta(encryptedMeta, opts.keypairs.secretBoxKeypair.publicKey, recipient.account_key);

          mailMeta.push({
            account_key: recipient.account_key,
            msg: encMsg.toString('hex'),
            _bytes: email.size,
            _received: false
          });
        }
      }

      await this._sendMailMeta(mailMeta);
    } catch (err) {
      throw err;
    }
  }

  _sendMailMeta(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.send_encrypted_mail
    });
  }

  _sendExternalMail(payload) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: payload,
      route: routes.mailbox.send_external_mail
    });
  }

  _decryptMailMeta(sealedMeta, privKey, acctPubKey) {
    let email = "";
    const msg = JSON.parse(Crypto.decryptSealedBox(sealedMeta.msg, privKey, acctPubKey));
    const meta = JSON.parse(Crypto.decryptPubSecretBoxMessage(msg.meta, msg.from, privKey));

    return meta;
  }

  _encryptMeta(meta, acctPubKey, keypairs) {
    // sign meta payload with device's signature key
    const sig = Crypto.signDetached(meta, keypairs.signingKeypair.privateKey);

    meta = { sig, ...meta };

    return Crypto.encryptPubSecretBoxMessage(JSON.stringify(meta), acctPubKey, keypairs.secretBoxKeypair.privateKey);
  }

  _sealMeta(encryptedMeta, fromPubKey, toPubKey) {
    const sealedMsg = {
      "from": fromPubKey,
      "meta": encryptedMeta
    }

    return Crypto.encryptSealedBox(JSON.stringify(sealedMsg), toPubKey);
  }

  markAsSynced(idArr) {
    return callout({
      event: this,
      provider: this.client.provider,
      auth: this.client.auth,
      payload: { "msg_ids": idArr },
      route: routes.mailbox.mark_as_synced
    });
  }
}

module.exports = Mailbox;
