const base32 = require('bs32');
const blake3 = require('blake3');
const Address = require('hsd/lib/primitives/address');
const rules = require('hsd/lib/covenants/rules');
const { Script, Opcode } = require('hsd/lib/script');

module.exports = {
  createScript,
  createAddress,
  hashName
};

function createScript (nameHash, publicKey) {
  if (typeof nameHash === 'string') {
    nameHash = base32.decode(nameHash);
  }

  if (typeof publicKey === 'string') {
    publicKey = base32.decode(publicKey);
  }

  const script = new Script([
    Opcode.fromPush(publicKey),
    Opcode.fromSymbol('checksig'),
    Opcode.fromPush(nameHash),
    Opcode.fromSymbol('drop')
  ]);

  return script;
}

function createAddress (name, publicKey) {
  const nameHash = hashName(name, publicKey);
  const script = createScript(nameHash, publicKey);
  const address = new Address().fromScript(script);

  return address;
}

function hashName (name, publicKey) {
  if (typeof name === 'string') {
    name = name.split('.')[0];
    name = Buffer.from(name);
  }
  if (typeof publicKey === 'string') {
    publicKey = base32.decode(publicKey);
  }
  return blake3.hash(name, publicKey);
}
