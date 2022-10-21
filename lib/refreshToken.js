module.exports = (auth) => {
  const Account = require('./account');

    try {
      if (auth) {
        const payload = {
          ...auth.claims,
          sig: auth.sig
        }
        const account = new Account({});
        return account.createAuthToken(payload, auth.device_signing_priv_key);
      }
    } catch(error) {
      throw error;
    }
    
  return null;
}