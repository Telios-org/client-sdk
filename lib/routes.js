const fs = require('fs');
const path = require('path');

module.exports = {
  account: {
    register: {
      auth: null,
      method: 'post',
      url: '/account/register',
      req: {
        account: {
          account_key: '',
          device_signing_key: '',
          device_peer_key: '',
          recovery_email: 'alice@mail.com',
          device_id: '00000000-0000-0000-000000000000'
        },
        sig: ''
      },
      res: {
        _sig: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      }
    },
    login: {
      auth: null,
      method: 'post',
      url: '/account/login',
      req: {
        account: {
          spkey: '',
          account_key: '',
          device_id: '00000000-0000-0000-000000000000',
          sig: ''
        },
        sig: ''
      },
      res: {
        _access_token: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      }
    },
    logout: {
      auth: 'Bearer',
      method: 'post',
      url: '/account/logout',
      req: { devices: 'all' },
      res: {}
    },
    drive: {
      auth: 'Bearer',
      method: 'get',
      url: '/account/key/',
      req: {},
      res: {
        drive: "0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    retrieve_stats: {
      auth: 'Bearer',
      method: 'get',
      url: '/account/stats/',
      req: {},
      res: {
        plan: "FREE",
        daily_email_used: 1,
        daily_email_reset_date: "2021-12-21T19:00:35.000+00:00",
        namespace_used: 1,
        aliases_used: 3,
        storage_space_used: 109635126,
        updated_at: "2021-12-21T19:00:35.000+00:00",
        maxOutgoingEmails: 0,
        maxAliasNames: 0,
        maxAliasAddresses: 0,
        maxGBCloudStorage: 0,
        maxGBBandwidth: 0
      }
    },
    recover: {
      auth: null,
      method: 'post',
      url: '/account/recover/',
      req: {
        email: 'alice@telios.io',
        recovery_email: 'alice@mail.com'
      },
      res: {}
    },
    sync: {
      auth: null,
      method: 'post',
      url: '/account/sync/code',
      req: {
        code: 'AbC123'
      },
      res: {
        drive_key: '0000000000000000000000000000000000000000000000000000000000000000',
        peer_pub_key: '0000000000000000000000000000000000000000000000000000000000000011'
      }
    }
  },
  mailbox: {
    register: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/register',
      req: {
        account_key: '',
        name: 'Alice Tester',
        addr: 'test@telios.io'
      },
      res: {
        registered: true
      }
    },
    register_alias_name: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/alias/name',
      req: { 
        alias_name: 'aliceAlias',
        domain: 'telios.io',
        key: '0000000000000000000000000000000000000000000000000000000000000000'
      },
      res: {
        registered: true,
        key: '0000000000000000000000000000000000000000000000000000000000000000',
        alias_name: 'aliasAlias'
      }
    },
    remove_alias_name: {
      auth: 'Bearer',
      method: 'delete',
      url: '/mailbox/alias/name',
      req: { alias_name: 'aliceAlias' },
      res: {}
    },
    register_alias_address: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/alias/address',
      req: { 
        alias_address: 'aliceAlias#netflix@telios.io',
        forwards_to: [],
        whitelisted: true 
      },
      res: {
        "_xid": "155",
        "alias_key": "0000000000000000000000000000000000000000000000000000000000000000",
        "registered": true,
        "address": "aliceAlias#netflix@telios.io",
        "forwards_to": [
            "alice@telios.io"
        ],
        "whitelisted": true
      }
    },
    update_alias_address: {
      auth: 'Bearer',
      method: 'put',
      url: '/mailbox/alias/address',
      req: { 
        alias_address: 'aliceAlias#netflix@telios.io',
        forwards_to:  [
          "alice@mail.io"
        ],
        disabled: false,
        whitelisted: true
      },
      res: {
        "alias_address": "aliceAlias#netflix@telios.io",
        "forwards_to": [
            "alice@mail.io"
        ],
        "whitelisted": true,
        "disabled": false
      }
    },
    remove_alias_address: {
      auth: 'Bearer',
      method: 'delete',
      url: '/mailbox/alias/address',
      req: { alias_address: 'aliceAlias#netflix@telios.io' },
      res: {}
    },
    get_public_key: {
      auth: null,
      method: 'get',
      url: '/mailbox/addresses/:addresses',
      req: null,
      res: [
        {
          address: 'alice@telios.io',
          account_key: '8922001759cda2b4d2a2cc6890c7ae4ed7b71f3a645c74b77ec89365985af236'
        }
      ]
    },
    isvalid_recovery_email: {
      auth: null,
      method: 'get',
      url: '/account/recover/email/valid/:email',
      req: null,
      res: {}
    },
    get_new_mail: {
      auth: 'Bearer',
      method: 'get',
      url: '/mailbox/messages',
      req: null,
      res: [{
        _id: '111111111111111111111111',
        msg: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      },
      {
        _id: '222222222222222222222222',
        msg: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        }
      ]
    },
    send_encrypted_mail: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/message',
      req: [
        {
          account_key: '',
          msg: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        },
        {
          account_key: '0000000000000000000000000000000000000000000000000000000000000000',
          msg: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        }
      ],
      res: {}
    },
    send_external_mail: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/external/message',
      req: {
        to: [{
          name: "Alice Tester",
          address: "alice@telios.io"
        }],
        from: [{
          name: "Bob Tester",
          address: "bob@telios.io"
        }],
        subject: "Hello Alice",
        text_body: "You're my favorite test person ever",
        html_body: "<h1>You're my favorite test person ever</h1>",
        attachments: [
            {
                filename: "test.pdf",
                content: "--base64-data--",
                contentType: "application/pdf"
            },
            {
                filename: "test.txt",
                content: "--base64-data--",
                contentType: "text/plain"
            }
        ]
      },
      res: {}
    },
    mark_as_synced: {
      auth: 'Bearer',
      method: 'post',
      url: '/mailbox/messages/read',
      req: {
        "msg_ids": ["000000000000000000000000"]
      },
      res: {}
    },
  },
  ipfs: {
    add: {
      auth: 'Bearer',
      method: 'POST',
      url: '/file',
      req: {},
      res: {
        uuid: 'ca91cdbd-f640-49b6-fed2-cdf9bd987037',
        cid: 'bafkreif7unfcuq3zw6fl4pmxh67niukus4ozw3lvqmycrsd23wmor4n6km',
        query_id: 'ca91cdbd-f640-49b6-fed2-cdf9bd987037'
      }
    },
    get: {
      auth: 'Bearer',
      method: 'GET',
      url: '/ipfs/:cid',
      req: {},
      res: {
        body: getEncryptedIPFSFileStream() // Returns readable file stream
      }
    },
    delete: {
      auth: 'Bearer',
      method: 'delete',
      url: '/file',
      req: {}, // Send body as readable file stream
      res: {}
    },
    status: {
      auth: 'Bearer',
      method: 'get',
      url: '/file/status/:id',
      req: {}, // Send body as readable file stream
      res: {
        uuid: 'ca91cdbd-f640-49b6-fed2-cdf9bd987037',
        uploaded: 1337,
        done: false
      }
    }
  }
}

function getEncryptedIPFSFileStream() {
  const fp = path.join(__dirname, '../tests/data/encrypted.eml');
  
  if(fs.existsSync(fp))
    return fs.createReadStream(fp);
}