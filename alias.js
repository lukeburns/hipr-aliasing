const base32 = require('bs32');
const bech32 = require('bcrypto/lib/encoding/bech32');
const { createAddress } = require('./script');

module.exports = {
  getAlias
};

async function getAlias (name, publicKey, nodeClient, network = 'main') {
  const scriptAddress = createAddress(name, publicKey).toString(network);
  let txs;
  try {
    txs = await nodeClient.getTXByAddress(scriptAddress);
  } catch (error) {
    console.error('[get-alias] ERROR:', error);
    return null;
  }
  const alias = getAliasFromTXs(txs, scriptAddress);
  return (alias || '').toString() || null;
}

function getAliasFromTXs (txs = [], address) {
  txs = txs.sort((a, b) => a.height - b.height).filter(tx => address === tx.inputs[0].coin.address);

  if (txs.length) {
    const canonical = txs[0];

    if (canonical) {
      const outputs = canonical.outputs;
      const nulldata = outputs[1].address;
      const [hrp, version, data] = bech32.decode(nulldata);
      return data;
    }

    return null;
  }

  return null;
}
