const Keyring = require('hsd/lib/primitives/keyring.js');
const Output = require('hsd/lib/primitives/output.js');
const rules = require('hsd/lib/covenants/rules.js');
const Address = require('hsd/lib/primitives/address.js');
const Witness = require('hsd/lib/script/witness.js');
const MTX = require('hsd/lib/primitives/mtx.js');
const { createLockScript } = require('./script.js');
const common = require('hsd/lib/script/common.js');
const assert = require('assert').strict;

const { ALL } = common.hashType;

module.exports = {
  fundMTX,
  signMTX,
  getCoins
};

async function getCoins () {
  const { wallet, network } = this;
  const coinsJSON = await wallet.getCoins('default');
  const coins = coinsJSON.sort((a, b) => b.value - a.value).map((c) => new Coin().fromJSON(c));

  return coins;
}

async function fundMTX (mtx, coins, changeAddress) {
  const { wallet, network } = this;
  const info = await this.execNode('getblockchaininfo');
  const feeRes = await this.execNode('estimatesmartfee', 10);
  const rate = Math.max(Number(feeRes.fee), 5000);

  console.log('change address:', changeAddress);
  await mtx.fund(coins, {
    rate,
    changeAddress,
    height: info.blocks,
    coinbaseMaturity: network.coinbaseMaturity
  });
  return mtx;
}

// ---

async function createRings (mtx, startIdx = 0) {
  const { wallet } = this;
  const passphrase = await this.getPassphrase();
  const rings = [];
  for (let i = startIdx; i < mtx.inputs.length; i++) {
    const input = mtx.inputs[i];
    const prevout = mtx.view.getEntry(input.prevout).output;
    const address = prevout.address.toString(this.networkName);
    const privKeyWIF = await wallet.getWIF(address, passphrase);
    rings.push(
      new Keyring().fromSecret(privKeyWIF.privateKey, this.networkName)
    );
  }
  return rings;
}

async function signMTX (mtx) {
  const rings = await createRings.call(this, mtx, 0);
  const signed = mtx.sign(rings, ALL);
  assert(signed, 'Transaction failed to sign.');

  return mtx;
}

async function getRenewalBlock (context) {
  const { network, nodeClient } = context;
  const info = await context.execNode('getblockchaininfo');
  let height = info.blocks - network.names.renewalMaturity * 2;
  if (height < 0) {
    height = 0;
  }

  const block = await nodeClient.getBlock(height);
  return block.hash;
}

function stringEnum (items) {
  return items.reduce((acc, curr) => {
    acc[curr] = curr;
    return acc;
  }, {});
}
