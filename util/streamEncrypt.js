const FixedChunker = require('@telios/nebula/util/fixedChunker');
const Crypto = require('@telios/nebula/lib/crypto');

const MAX_PLAINTEXT_BLOCK_SIZE = 65536;
const MAX_ENCRYPTED_BLOCK_SIZE = 65553;

module.exports.decryptStream = async (stream, key, header) => {
  const fixedChunker = new FixedChunker(stream, MAX_ENCRYPTED_BLOCK_SIZE);
  return Crypto.decryptStream(fixedChunker, key, header);
}

module.exports.encryptStream = async (readStream, writeStream) => {
  const fixedChunker = new FixedChunker(readStream, MAX_PLAINTEXT_BLOCK_SIZE)
  return Crypto.encryptStream(fixedChunker, writeStream)
}