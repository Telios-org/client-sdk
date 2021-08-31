module.exports = (auth) => {
  const Account = require('./account');
  if (auth) {
    const payload = {
      ...auth.claims,
      sig: auth.sig
    }
    return Account.createAuthToken(payload, auth.device_signing_priv_key);
  }
  return null;
}