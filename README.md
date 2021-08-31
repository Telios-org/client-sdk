# Telios Client SDK

![Build Status](https://github.com/Telios-org/client-sdk/actions/workflows/node.js.yml/badge.svg)

This package provides components for building an email client using the [Telios Network](https://www.telios.io). Telios is an offline-capabale e2e encrypted email service built on [hypercore-protocol](https://hypercore-protocol.org/) for sending and receiving emails.

## What does this SDK do?

This SDK provides methods for interacting with the Telios Client-Server API. It comes with everything needed for sending/receiving encrypted data, registering a new account, creating mailboxes, and creating shared drives.

## Installation

```js
npm i @telios/client-sdk
```

## Usage

```js
const { Account, Mailbox } = require("@telios/client-sdk");
const { secretBoxKeypair, signingKeypair, mnemonic } = Account.makeKeys();

const account = new Account({
  provider: "https://apiv1.telios.io",
});

// Verification code sent to the recovery email
const vcode = "Xf1sP4";

const initPayload = {
  account: {
    account_key: secretBoxKeypair.publicKey,
    recovery_email: recoveryEmail,
    device_drive_key: driveKey,
    device_drive_diff_key: driveDiffKey,
    device_signing_key: signingKeypair.publicKey,
    device_peer_key: peerKeypair.publicKey
  },
};

const { account, sig } = await Account.init(
  signingKeypair.privateKey,
  initPayload
);

const registerPayload = {
  ...account,
  sig: sig,
  vcode: vcode,
};

// Send the account object that was just signed to be stored and
// verified on the server for later authentication.
const res = await account.register(registerPayload);
```

# API/Examples

### `const account = new Account(provider)`

The Account class handles communication with the Telios server and provides methods for creating request payloads.

- `provider`: Base URL of the API provider

### `const { secretBoxKeypair, signingKeypair, mnemonic } = Account.makeKeys([mnemonic])`

Keypairs will need to be initially created before any other actions can be taken. These keys will be used for encrypting/decrypting data on the client and from other users. The private keys should be stored somewhere safe (and encrypted) and never shared. The public keys generated will be used for encrypting a recipient's data and can be shared publicly.

- `mnemonic`: Passing in a [bip39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic will create deterministic keypairs. 

Returns: 
- `secretBoxKeypair`: Public/private keys for the account
- `signingKeypair`: Public/private signing keys for the account
- `mnemonic`: If no mnemonic is passed in as an argument a new one is generated and passed back with the keys that were created from it.

### `Account.init(acctPayload, privateKey)`

Prepares an account registration payload

- `acctPayload`: Account Object to be signed for registration
  - `account`
    - `account_key`: Public key for the account
    - `device_drive_key`: Public key of the drive created for the device `drive.publicKey`
    - `recovery_email`: Recovery email in plaintext. This is immediately hashed and stored once sent to the backend
    - `device_drive_diff_key`: Device's drive diff database key used for syncing peer drives `drive.diffFeedKey`
    - `device_signing_key`: Public signing key for your device
    - `device_peer_key`: Public key used for connecting to other peers over plex/hyperswarm
- `privateKey`: Private key for the account

### `await account.register(accountPayload)`

Registers a new account with the API server. This method requires a verification code (`vcode`) in order for the backend to create the account. Examples on how to generate verification codes are listed below.

- `acctPayload`: Account Object
  - `account`
    - `account_key`: Public key for the account
    - `device_drive_key`: Public key of the drive created for the device `drive.publicKey`
    - `recovery_email`: Recovery email in plaintext. This is immediately hashed and stored once sent to the backend
    - `device_drive_diff_key`: Device's drive diff database key used for syncing peer drives `drive.diffFeedKey`
    - `device_signing_key`: Public signing key for your device
    - `device_peer_key`: Public key used for connecting to other peers over plex/hyperswarm
    - `device_id`: UUID for this device
  - `sig`: Signature returned from `Account.init`
  - `vcode`: Verification code sent to the recovery email.

Example: Get verfication code - This request will send a verification code in the form of a captcha image to the recovery email listed in the request.

```shell
curl --location --request POST 'https://apiv1.telios.io/account/captcha' --data-raw '{ "addr": "Kaylin_Farrell@email.com" }'
```

Example: Verifying the activation code

```shell
curl --location --request POST 'https://apiv1.telios.io/account/captcha/verify' --data-raw '{ "vcode": "Xf1sP4" }'
```

Account registration example usage:

```js
const { Account, Mailbox } = require("@telios/telios-sdk");
const { secretBoxKeypair, signingKeypair, peerKeypair } = Account.makeKeys();

const account = new Account({
  provider: "https://apiv1.telios.io",
});

// Verification code sent to the recovery email
const vcode = "Xf1sP4";

const initPayload = {
  account: {
    account_key: secretBoxKeypair.publicKey,
    recovery_email: recoveryEmail,
    device_drive_key: driveKey,
    device_drive_diff_key: driveDiffKey,
    device_signing_key: signingKeypair.publicKey,
    device_peer_key: peerKeypair.publicKey,
    device_id: deviceId,
  },
};

const { account, sig } = await Account.init(
  signingKeypair.privateKey,
  initPayload
);

const registerPayload = {
  ...account,
  sig: sig,
  vcode: vcode,
};

// Send the account object that was just signed to be stored and
// verified on the server for later authentication.
const res = await account.register(registerPayload);
```

Example response:

```js
{
  // signature from server to be used for authentication
  _sig: "[server_signature]";
  // The server's drive diff key. To replicate your local drive with the server, 
  // use this key when doing drive.addPeer(diffKey)
  _drive_diff_key: "[drive_diff_key]"
}
```

The `sig` returned will be required for authentication and should be stored and encrypted locally. This, along with the account's signing key will be used to create a unique access token for every request.

### `const mailbox = new Mailbox(provider, auth)`

The Mailbox class provides functionality needed for processing encrypted emails.

- `provider`: Base URL of the API provider
- `auth`
  - `claims`
    - `device_signing_key`:
    - `account_key`:
    - `device_peer_key`:
    - `device_id`:
  - `device_signing_priv_key`:
  - `sig`: Signature sent from the Telios server when this account was registered.

Example Usage:

```js
const mailbox = new Mailbox({
  provider: "https://apiv1.telios.io",
  auth: {
    claims: {
      device_signing_key: signingKeypair.publicKey,
      account_key: secretBoxKeypair.publicKey,
      device_peer_key: peerKeypair.publicKey,
      device_id: "[device_id]",
    },
    device_signing_priv_key: signingKeypair.privateKey,
    sig: "[sig]",
  },
});

const payload = {
  account_key: secretBoxKeypair.publicKey,
  addr: "test@telios.io",
};

const res = await mailbox.registerMailbox(payload);
```

Example response:

```js
{
  "registered": true
}
```

### `await mailbox.getMailboxPubKeys(addresses)`

A recipient's account's public key is required for sending encrypted emails within the Telios network. `getMailboxPubKeys` takes an array of recipient's addresses and returns their corresponding public key.

- `addresses`: An array of email addresses

Example usage:

```js
const res = await mailbox.getMailboxPubKeys([
  "alice@telios.io",
  "tester@telios.io",
]);
```

Example response:

```js
[
  {
    address: "alice@telios.io",
    account_key: "[account_public_key]",
  },
  {
    address: "tester@telios.io",
    account_key: "[account_public_key]",
  },
];
```

### `mailbox.send(email, { privKey, pubKey, drive, filePath })`

When sending an email to multiple recipients, the recipient's email domain is checked
if it matches telios.io. In this case the email is encrypted, stored on the local drive, and an encrypted message
is sent that only the recipient can decipher. The deciphered metadata gives the recipient instructions
how to to retrieve and decipher thier encrypted email.

In the instance of multiple recipients from non-compatible email providers (gmail, yahoo, etc..), the email
is initially sent without encryption via normal SMTP. The reason for this is it doesn't make sense to encrypt an email that's
being sent in cleartext to other recipients. If some of the recipients are using telios.io, the email **WILL**
be encrypted at rest when picked up by the mailserver for Telios recipients.

- `email`: An email in JSON format
- `owner`: An email address showing who the email is from. Recipients can use this with the detached signature to verify messages.
- `keypairs`: signing and secret box keypairs
  - `secretBoxKeypair`: The sender's signing keypair (Bob). Private key is only used during encryption and never sent or stored.
  - `signingKeypair`: The sender's signing keypair object (Bob). Public key is used for authenticity of sender
- `drive`: A shared drive
- `dest`: File destination path on the local drive

Email JSON should be in the following format:

```js
const email = {
  "subject": "Hello Bob",
  "date": "2020-07-14T13:49:36.000Z",
  "to": [
    {
      "address": "bob@mail.com",
      "name": "Bob"
    }
  ],
  "from": [
    {
      "address": "alice@mail.com",
      "name": "Alice"
    }
  ],
  "cc": [],
  "bcc": [],
  "sender": [],
  "text_body": "You're my favorite test person ever",
  "html_body": "<h1>You're my favorite test person ever</h1>",
  "attachments": [
    {
      "filename": "test.pdf",
      "fileblob": "--base64-data--",
      "mimetype": "application/pdf"
    },
    {
      "filename": "test.txt",
      "fileblob": "--base64-data--",
      "mimetype": "text/plain"
    }
  ]
}
```

Example usage:

```js
// In this example Bob is sending an ecrypted email to two other Telios mailboxes.
const res = await mailbox.send(email, {
  owner: "bob@telios.io",
  keypairs: {
    secretBoxKeypair,
    signingKeypair
  },
  // A Shared Drive.
  drive: "[drive]",
  // Destination path of the file on the local drive
  dest: "/email/email.json",
});
```

### `await mailbox.getNewMail(acctPrivKey, acctPubKey)`

- `acctPrivKey`: Your account's private key
- `acctPubKey`: Your account's public key

Example usage:

```js
const acctPubKey = "[account_public_key]";
const acctPrivKey = "[account_private_key]";

const mail = await mailbox.getNewMail(acctPrivKey, acctPubKey);
```

Example response:

```js
[
  {
    headers: [
      {
        header: "x-spam-score",
        value: "1.9",
      },
    ],
    subject: "Hello Bob",
    date: "2020-07-14T13:49:36.000Z",
    to: [
      {
        address: "bob@mail.com",
        name: "Bob",
      },
    ],
    from: [
      {
        address: "alice@mail.com",
        name: "Alice",
      },
    ],
    cc: [],
    bcc: [],
    sender: [],
    text_body: "You're my favorite test person ever",
    html_body: "<h1>You're my favorite test person ever</h1>",
    attachments: [
      {
        filename: "test.pdf",
        fileblob: "--base64-data--",
        mimetype: "application/pdf",
      },
      {
        filename: "test.txt",
        fileblob: "--base64-data--",
        mimetype: "text/plain",
      },
    ],
  },
];
```

### `await mailbox.markAsSynced(ids)`

After an email has been pulled down onto your local devices its meta record can be safely removed from the server.

- `ids`: an array of meta message ids on the server

Example usage:

```js
// Pass in an array of message IDs to be marked as synced.
const res = await mailbox.markAsSynced(["5f1210b7a29fe6222f199f80"]);
```

### `await mailbox.registerAliasName(nameObj)`

Example Alias: `alice2000`#`netflix`@telios.io

`alice2000` = Alias Namespace

Registers a new alias namespace. Namespaces must be unique and are account bound. Each namespace can potentially hold an inifite number of alias addresses under each namespace.

- `alias_name`: Desired namespace `alice2000`
- `domain`: Domain for the namespace in the following format `telios.io`
- `key`: Alias namespace's public key. Each namespace must have it's own unique public key

Example usage:

```js    
const mailbox = await initMailbox();
const { secretBoxKeypair } = Account.makeKeys();

const res = await mailbox.registerAliasName({
  alias_name: 'alice2000',
  domain: 'telios.io',
  key: secretBoxKeypair.publicKey
});
```

Example response:

```js
{
    "registered": true,
    "name": "aliceAlias",
    "key": "[alias_public_key]"
}
```

### `await mailbox.registerAliasAddress(addressObj)`

Example Alias: `alice2000`#`netflix`@telios.io

`netflix` = Alias address

Registers a new alias address. Addresses can be registered manually, or they can be created on-the-fly. If an account already has an alias name registered (`alice2000`) and an email is sent to `alice2000#spotify@telios.io`, then the alias mailbox `alice2000#spotify@telios.io` will automatically be created. Auto-generated aliases do not count against alias usage until they are manually `whitelisted`. Setting `whitelisted` to false will silently fail to deliver any new emails coming to that address.

- `alias_addressed`: Desired address `netflix`
- `forwards_to`: Array of email address strings that this alias address should forward to. All alias addresses default to forwarding to the account's main mailbox address and any addresses added here will be addative to that main mailbox address.
- `whitelisted`: true|false  Allow emails to be delivered to this alias.

Example usage:

```js    
const res = await mailbox.registerAliasAddress({ 
  alias_address: 'alice2000#netflix@telios.io',
  forwards_to: [],
  whitelisted: true 
});
```

Example response:

```js
{
    "_xid": "155", // external ID of the alias address record on the mailserver.
    "alias_key": "[alias_public_key]",
    "registered": true,
    "alias_address": "alice2000#netflix@telios.io",
    "forwards_to": [],
    "whitelisted": true
}
```

### `await mailbox.updateAliasAddress(addressObj)`

Update an existing alias address.

- `alias_address`: the full alias address being updated `alice2000#netflix@telios.io`,
- `forwards_to`: Array of email address strings that this alias address should forward to. All alias addresses default to forwarding to the account's main mailbox address and any addresses added here will be addative to that main mailbox address.
- `whitelisted`: true|false  Allow emails to be delivered to this alias.

Example usage:

```js    
const res = await mailbox.registerAliasAddress({ 
  alias_address: 'alice2000#netflix@telios.io',
  forwards_to: [],
  whitelisted: true 
});
```

Example response:

```js
{
    "address": "alice2000#netflix@telios.io",
    "forwards_to": [],
    "whitelisted": true
}
```

### `await mailbox.removeAliasAddress(address)`

Removes an alias address.

- `address`: String of the full alias address `alice2000#netflix@telios.io`

Example usage:

```js    
const res = await mailbox.removeAliasAddress('alice2000#netflix@telios.io');
``` 


