module.exports = (auth) => {
  const Account = require('./account');
  const TeliosSDK = require('../index')
    try{
      if (auth) {
        const payload = {
          ...auth.claims,
          sig: auth.sig
        }
        const sdk = new TeliosSDK()
        const account = sk.Account
        return account.createAuthToken(payload, auth.device_signing_priv_key);
      }
    }catch(error){
      console.log('ERROR',error)
    }
    
  return null;
}