const Coin = require('hsd/lib/primitives/coin.js');
const Address = require('hsd/lib/primitives/address');
const MTX = require('hsd/lib/primitives/mtx');
const Output = require('hsd/lib/primitives/output');
const { Script, Opcode, Stack, Witness } = require('hsd/lib/script');
const common = require('hsd/lib/script/common');
const secp256k1 = require('bcrypto/lib/secp256k1');
const base32 = require('bs32');
const blake3 = require('blake3');
const random = require('bcrypto/lib/random');
const { createScript, hashName } = require('./script');
const { ALL } = common.hashType;

module.exports = { createTransaction, createAlias };

async function createTransaction (fund, sign, name, alias, privateKey, publicKey) {
  if (typeof alias === 'string') {
    alias = Buffer.from(alias);
  }

  if (typeof privateKey === 'string') {
    privateKey = base32.decode(privateKey.trim());
  }

  if (!publicKey) {
    publicKey = secp256k1.publicKeyCreate(privateKey);
  }

  const nameHash = hashName(name, publicKey);
  const script = createScript(nameHash, publicKey);
  const scriptAddress = new Address().fromScript(script).toString(this.network);
  console.log('name:', name);
  console.log('alias:', alias.toString());
  console.log('public key:', base32.encode(publicKey));
  console.log('name hash:', base32.encode(nameHash));
  console.log('script address:', scriptAddress);

  const mtx = new MTX();

  // scriptAddress spends
  const coinsJSON = await this.nodeClient.getCoinsByAddress(scriptAddress);
  const coins = coinsJSON.sort((a, b) => b.value - a.value).map((c) => new Coin().fromJSON(c));

  if (coins.length === 0) {
    console.log('please fund', scriptAddress, 'with enough to cover tx fee')
  }

  mtx.addCoin(coins[0]);
  await fund(mtx, coins, scriptAddress);

  mtx.addOutput(new Output({
    value: 0,
    address: Address.fromNulldata(alias)
  }));

  const signature = mtx.signature(0, script, coins[0].value, privateKey, ALL);
  const witness = new Stack();
  witness.pushData(signature);
  witness.pushData(script.encode());
  mtx.inputs[0].witness.fromStack(witness);

  console.log('inputs:', mtx.inputs);
  console.log('outputs:', mtx.outputs);

  mtx.check();

  return mtx;
}

function createAlias (n = 1) {
  if (n === 1) {
    return base32.encode(blake3.hash(random.randomBytes(32))).slice(0, 16);
  }

  return Array(n).fill(1).map(x => createAlias(publicKey, 1));
}
