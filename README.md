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
const ClientSDK = require("@telios/client-sdk");
const teliosSDK = await new ClientSDK({
    provider: 'https://apiv1.telios.io'})
const Account = teliosSDK.Account
const { secretBoxKeypair, signingKeypair, mnemonic } = Account.makeKeys();

// Verification code sent to the recovery email
const vcode = "Xf1sP4";

const initPayload = {
  account: {
    account_key: secretBoxKeypair.publicKey,
    recovery_email: recoveryEmail,
    device_drive_key: drivePublicKey,
    device_signing_key: signingKeypair.publicKey
  },
};

const { account, sig } = await Account.init(
  initPayload,
  signingKeypair.privateKey
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
### `const teliosSDK = new ClientSDK(opts)`

The ClientSDK class instantiates the Account and Mailbox Class as well as gives access to a host of utility functions under the Crypto module.

- `opts`: allows you to set class variables `auth` and `provider`
  - `provider`: Base URL of the API provider
  - `auth`
    - `claims`
      - `device_signing_key`:
      - `account_key`:
      - `device_peer_key`:
      - `device_id`:
    - `device_signing_priv_key`:
    - `sig`: Signature sent from the Telios server when this account was registered.

The variables are accessible through the instance of `ClientSDK` as shown in the example below.

### `teliosSDK.setProvider(provider)`

This is a method allowing you to set the provider within the instantiated class.

- `provider`: Base URL of the API provider

### `teliosSDK.setAuthPayload(auth)`

This is a method allowing you to set the auth payload within the instantiated class.

 - `auth`
    - `claims`
      - `device_signing_key`:
      - `account_key`:
      - `device_peer_key`:
      - `device_id`:
    - `device_signing_priv_key`:
    - `sig`: Signature sent from the Telios server when this account was registered.


```js

const ClientSDK = require("@telios/client-sdk");
const teliosSDK = await new ClientSDK()

// Account Class will help create request payload for new account creation and more
const Account = teliosSDK.Account
// Mailbox Class provides functionality needed to process encrypted emails
const Mailbox = teliosSDK.Mailbox
// Crypto modules is a collection of helper functions
const Crypto = teliosSDK.Crypto

// Variables set through the constructor are available through client
const {
  auth,
  provider
  opts
} = teliosSDK.client

teliosSDK.setProvider('https://apiv1.telios.io')

const auth = {
  claims: {
      account_key: //SB_PUB_KEY,
      device_signing_key: //SIG_PUB_KEY,
      device_id: //DEVICE_ID
    },
    device_signing_priv_key: //SIG_PRIV_KEY,
    sig: //ACCOUNT_SERVER_SIG
}

teliosSDK.setAuthPayload(auth)

```

#### `const Account = teliosSDK.Account`

The Account class handles communication with the Telios server and provides methods for creating request payloads.

#### `const { secretBoxKeypair, signingKeypair, mnemonic } = Account.makeKeys([mnemonic])`

Keypairs will need to be initially created before any other actions can be taken. These keys will be used for encrypting/decrypting data on the client and from other users. The private keys should be stored somewhere safe (and encrypted) and never shared. The public keys generated will be used for encrypting a recipient's data and can be shared publicly.

- `mnemonic`: Passing in a [bip39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic will create deterministic keypairs. 

Returns: 
- `secretBoxKeypair`: Public/private keys for the account
- `signingKeypair`: Public/private signing keys for the account
- `mnemonic`: If no mnemonic is passed in as an argument a new one is generated and passed back with the keys that were created from it.

#### `Account.init(acctPayload, privateKey)`

Prepares an account registration payload

- `acctPayload`: Account Object to be signed for registration
  - `account`
    - `account_key`: Public key for the account
    - `device_drive_key`: Public key of the drive created for the device `drive.publicKey`
    - `recovery_email`: Recovery email in plaintext. This is immediately hashed and stored once sent to the backend
    - `device_signing_key`: Public signing key for your device
- `privateKey`: Private key for the account

Returns:

- `account`: Public/private keys for the account
  - `account_key`: Public key for the account
  - `device_drive_key`: Public key of the drive created for the device `drive.publicKey`
  - `recovery_email`: Recovery email in plaintext. This is immediately hashed and stored once sent to the backend
  - `device_signing_key`: Public signing key for your device
  - `device_id`: UUID for this device
- `sig`: Public/private signing keys for the account

#### `await Account.register(accountPayload)`

Registers a new account with the API server. This method requires a verification code (`vcode`) in order for the backend to create the account. Examples on how to generate verification codes are listed below.

- `acctPayload`: Account Object
  - `account`
    - `account_key`: Public key for the account
    - `device_drive_key`: Public key of the drive created for the device `drive.publicKey`
    - `recovery_email`: Recovery email in plaintext. This is immediately hashed and stored once sent to the backend
    - `device_signing_key`: Public signing key for your device
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
const ClientSDK = require("@telios/client-sdk");
const teliosSDK = await new ClientSDK({
    provider: 'https://apiv1.telios.io'})
const Account = teliosSDK.Account
const { secretBoxKeypair, signingKeypair, peerKeypair } = Account.makeKeys();

// Verification code sent to the recovery email
const vcode = "Xf1sP4";

const initPayload = {
  account: {
    account_key: secretBoxKeypair.publicKey,
    recovery_email: recoveryEmail,
    device_drive_key: driveKey,
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
const { _sig: serverSig } = await Account.register(registerPayload);

// Storing the auth information for later use
const auth = {
  claims: {
      account_key: initPayload.account.account_key,
      device_signing_key: initPayload.account.device_signing_key,
      device_id: initPayload.account.device_id
    },
    device_signing_priv_key: signingKeypair.privateKey,
    sig: serverSig
}

teliosSDK.setAuthPayload(auth)
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

#### `await Account.recover({ email, recovery_email })`

Initaites the account recovery flow. If email and `recovery_email` are valid and recovery code will be sent to the `recovery_email`.

- `email`: User's Telios email address
- `recovery_email`: User's recovery email used during registration.

#### `const { code } = await Account.createSyncCode()`

Generates a new sync code on the server that expires in 10 minutes. This code should be given to the other peer device for pairing.

#### `const { drive_key, peer_pub_key, email } = await Account.getSyncInfo({ code })`

Retrieves the public keys and info needed to sync one or more devices/drives

- `code`: The recovery code sent to `recovery_email`

Example response:

```js
{
  // The drive public key needed for replication
  drive_key: "[drive_key]";
  // The Telios seeding peer public key. Use this key to let Telios through the drive's firewall.
  peer_pub_key: "[peer_pub_key]"
}
```

#### `const { sig } = await Account.registerNewDevice(payload)`

Registers a new device with the provider. Returns a server signature that should be used for generating new sessions with the API server.

- `payload`
  - `type`: The device type - `"MOBILE" | "DESKTOP"`
  - `device_id`: UUID for this device
  - `device_drive_key`: Public key of the drive created for the device - `drive.publicKey`
  - `device_signing_key`: Public signing key for your device
  

#### `const stats = await Account.retrieveStats()`

This method will retrieve stats about the account.

Example Response:
```js
  {
    plan: "FREE", // Plan tier the account is on
    daily_email_used: 1, // Number of email sent since last reset aka whether or not they went over the daily quota
    daily_email_reset_date: "2021-12-21T19:00:35.000+00:00", // Datea at which the daily_email_used will reset
    namespace_used: 1, // Number of Namespace registered by Account
    aliases_used: 3, // Number of Aliases registered by Account
    storage_space_used: 109635126 // Total Space used up by Account on backup server
  }
```

#### `const Mailbox = teliosSDK.Mailbox`

The Mailbox class provides functionality needed for processing encrypted emails.

Example Usage:

```js

// If Auth payload hasn't been previously set do the below
const auth = {
    claims: {
      device_signing_key: signingKeypair.publicKey,
      account_key: secretBoxKeypair.publicKey,
      device_peer_key: peerKeypair.publicKey,
      device_id: "[device_id]",
    },
    device_signing_priv_key: signingKeypair.privateKey,
    sig: "[sig]",
  }

teliosSDK.setAuthPayload(auth)

// Once Auth Payload is set.
const Mailbox = teliosSDK.Mailbox;

const payload = {
  account_key: secretBoxKeypair.publicKey,
  addr: "test@telios.io",
};

const res = await Mailbox.registerMailbox(payload);
```

Example response:

```js
{
  "registered": true
}
```

#### `await Mailbox.getMailboxPubKeys(addresses)`

A recipient's account's public key is required for sending encrypted emails within the Telios network. `getMailboxPubKeys` takes an array of recipient's addresses and returns their corresponding public key.

- `addresses`: An array of email addresses

Example usage:

```js
const res = await Mailbox.getMailboxPubKeys([
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

#### `await Mailbox.isValidRecoveryEmail(email)`

Test if an email recovery address is valid and or has not already been used by another account.

- `email`: A recovery email address `alice@email.com`

Example usage:

```js
const res = await Mailbox.isValidRecoveryEmail("alice@telios.io");
```

#### `Mailbox.send(email, { privKey, pubKey, drive, filePath })`

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

Email JSON should be in the following format:

```js
const email = {
  "subject": "Hello Bob",
  "date": "2020-07-14T13:49:36.000Z",
  "cid": "bafkreif7unfcuq3zw6fl4pmxh67niukus4ozw3lvqmycmsd52wmor4n6kl", // IPFS cid
  "key": "6f6331eaf1bdf150f37312dfb560792f4acd18ed4bcf989e4afab1d290cbe3f1",
  "header": "27b9b910f9658d489be208cde88819de9512c8b9f3954baf",
  "path": "677bfc57-3ee9-4d53-84dc-1010bff8f4d6.json",
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
      "content": "--base64-data--",
      "contentType": "application/pdf"
    },
    {
      "filename": "test.txt",
      "content": "--base64-data--",
      "contentType": "text/plain"
    }
  ]
}
```

Example usage:

```js
// In this example Bob is sending an ecrypted email to two other Telios mailboxes.
const res = await Mailbox.send(email, {
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

#### `await Mailbox.getNewMail(acctPrivKey, acctPubKey)`

- `acctPrivKey`: Your account's private key
- `acctPubKey`: Your account's public key

Example usage:

```js
const acctPubKey = "[account_public_key]";
const acctPrivKey = "[account_private_key]";

const mail = await Mailbox.getNewMail(acctPrivKey, acctPubKey);
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
        content: "--base64-data--",
        contentType: "application/pdf",
      },
      {
        filename: "test.txt",
        content: "--base64-data--",
        contentType: "text/plain",
      },
    ],
  },
];
```

#### `await Mailbox.markAsSynced(ids)`

After an email has been pulled down onto your local devices its meta record can be safely removed from the server.

- `ids`: an array of meta message ids on the server

Example usage:

```js
// Pass in an array of message IDs to be marked as synced.
const res = await Mailbox.markAsSynced(["5f1210b7a29fe6222f199f80"]);
```

#### `await Mailbox.registerAliasName(nameObj)`

Example Alias: `alice2000`#`netflix`@telios.io

`alice2000` = Alias Namespace

Registers a new alias namespace. Namespaces must be unique and are account bound. Each namespace can potentially hold an infinite number of alias addresses under each namespace.

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

#### `await Mailbox.registerAliasAddress(addressObj)`

Example Alias: `alice2000`#`netflix`@telios.io

`netflix` = Alias address

Registers a new alias address. Addresses can be registered manually, or they can be created on-the-fly. If an account already has an alias name registered (`alice2000`) and an email is sent to `alice2000#spotify@telios.io`, then the alias mailbox `alice2000#spotify@telios.io` will automatically be created. Auto-generated aliases do not count against alias usage until they are manually `whitelisted`. Setting `whitelisted` to false will silently fail to deliver any new emails coming to that address.

- `alias_addressed`: Desired address `netflix`
- `forwards_to`: Array of email address strings that this alias address should forward to. All alias addresses default to forwarding to the account's main mailbox address and any addresses added here will be addative to that main mailbox address.
- `whitelisted`: true|false  Allow emails to be delivered to this alias.

Example usage:

```js    
const res = await Mailbox.registerAliasAddress({ 
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

#### `await Mailbox.updateAliasAddress(addressObj)`

Update an existing alias address.

- `alias_address`: the full alias address being updated `alice2000#netflix@telios.io`,
- `forwards_to`: Array of email address strings that this alias address should forward to. All alias addresses default to forwarding to the account's main mailbox address and any addresses added here will be addative to that main mailbox address.
- `whitelisted`: true|false  Allow emails to be delivered to this alias.

Example usage:

```js    
const res = await Mailbox.updateAliasAddress({ 
  alias_address: 'alice2000#netflix@telios.io',
  forwards_to: ['newforward@domain.com'],
  whitelisted: true 
});
```

Example response:

```js
{
    "address": "alice2000#netflix@telios.io",
    "forwards_to": ['newforward@domain.com'],
    "whitelisted": true
}
```

#### `await Mailbox.removeAliasAddress(address)`

Removes an alias address.

- `address`: String of the full alias address `alice2000#netflix@telios.io`

Example usage:

```js    
const res = await Mailbox.removeAliasAddress('alice2000#netflix@telios.io');
``` 

#### `const Domain = teliosSDK.Domain`

The Domain class provides functionality needed for registering custom domains and mailboxes.

Example Usage:

```js

// If Auth payload hasn't been previously set do the below
const auth = {
    claims: {
      device_signing_key: signingKeypair.publicKey,
      account_key: secretBoxKeypair.publicKey,
      device_peer_key: peerKeypair.publicKey,
      device_id: "[device_id]",
    },
    device_signing_priv_key: signingKeypair.privateKey,
    sig: "[sig]",
  }

teliosSDK.setAuthPayload(auth)

// Once Auth Payload is set.
const Domain = teliosSDK.Domain;

const payload = {
  account_key: secretBoxKeypair.publicKey,
  addr: "test@telios.io",
};

const bool = await Domain.isAvailable('telios.app');
```

#### `await Domain.isAvailable(domain)`

Check if custom a domain is available and has not been previously registered.

- `domain`: String of the domain `telios.app`

Example usage:

```js    
const bool = await Domain.isAvailable('telios.app');
```

#### `await Domain.register(payload)`

Register a new custom domain.

- `domain`: String of the domain `telios.app`

Example usage:

```js
const payload = {
  domain:'telios.app'
};

const res = await Domain.register('telios.app');
```

Example response:

```js
{
  "domain": "telios.app",
  "verification": {
    "name": "@",
    "type": "TXT",
    "value": "telios-verification=d48808347d7d8a0b91f2e3af9d77ce33"
  }
}
```

#### `await Domain.verifyOwnership(domain)`

Verify user owns the domain.

- `domain`: String of the domain `telios.app`

Example usage:

```js
const { verified } = await Domain.verifyOwnership('telios.app');
```

#### `await Domain.verifyDNS(payload)`

Verify DNS records are correctly set.

- `domain`: String of the domain `telios.app`

Example usage:

```js
const payload = {
  domain:'telios.app'
};

const res = await Domain.verifyDNS('telios.app');
```

Example response:

```js
{
  "mx": {
    "type": "MX",
    "name": "telios.app",
    "value": "mailer.telios.app",
    "verified": true
  },
  "spf": {
    "type": "TXT",
    "name": "telios.app",
    "value": "v=spf1 include:mailer.telios.app ~all",
    "verified": true
  },
  "dkim": {
    "type": "TXT",
    "name": "dkim._domainkey.telios.app",
    "value": "",
    "verified": true
  },
  "dmarc": {
    "type": "TXT",
    "name": "_dmarc.telios.app",
    "value": "v=DMARC1;p=quarantine",
    "verified": true
  }
}

```

#### `await Domain.registerMailbox(payload)`

Register a mailbox under a custom domain.

- `name`: String of the mailbox display name `Bob Test`
- `addr`: String of the full mailbox address with custom domain `bob@telios.app`
- `mailbox_key`: String of the mailbox public key

Example usage:

```js
const payload = {
  name: 'Bob Tester',
  addr:'bob@telios.app',
  mailbox_key: '0000000000000000000000000000000000000000000000000000000000000000'
};

await Domain.registerMailbox(payload);
```

#### `await Domain.update(payload)`

Update a custom domain mailbox.

- `addr`: String of the mailbox address `bob`
- `disabled`: Boolean that determines if the mailbox is disabled and should receive mail

Example usage:

```js
const payload = {
  addr:'bob@telios.app',
  disabled: true
};

const res = await Domain.update(payload);
```

Example response:

```js
{
    "address": "bob@telios.app",
    "disabled": true
}
```

#### `await Domain.deleteMailbox(payload)`

Delete a mailbox under a custom domain.

- `addr`: String of the mailbox address `bob@telios.app`

Example usage:

```js
const payload = {
  addr:'bob@telios.app'
};

await Domain.deleteMailbox(payload);
```

