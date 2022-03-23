const { util, Zone, wire: { Question, types, codes } } = require('bns');
const base32 = require('bs32');
const blake3 = require('blake3');

const empty = new Zone();

module.exports = () => ({
  hostname: ':data.:protocol(_aliasing|aliasing).:gateway?.',
  handler
});

async function handler ({ data, protocol }, name, type, res, rc, ns) {
  const dataLabels = data.split('.');
  const hip5data = dataLabels[dataLabels.length - 1];

  if (name.indexOf(protocol) > 0) {
    return null;
  }

  // compute alias
  const nameLabels = name.split('.');
  const count = ns.name.split('.').length;
  const subLabels = nameLabels.slice(0, nameLabels.length - count);
  const subLabel = subLabels[subLabels.length - 1];
  const realIndex = subLabels.findIndex(x => x[0] !== '_');

  if (realIndex < 0) {
    return null;
  }

  const alias = util.fqdn(base32.encode(blake3.hash(subLabel + hip5data)));
  const domain = subLabel + '.' + ns.name;
  const nameAlias = name.replace(domain, alias);

  // query alias
  try {
    const res = await this.lookup(nameAlias, types[type]);
    // handle NX Proof
    if (res.code = codes.NXDOMAIN) {
      return res;
    } else {
      // this substitution doesn't play nice with dnssec
      // todo: rather than substitution, expect zone for name: this.lookup(name, types[type]).
      res.answer = res.answer.map(answer => {
        answer.name = answer.name.replace(alias, domain);
        return answer;
      });
      res.authority = res.authority.map(answer => {
        answer.name = answer.name.replace(alias, domain);
        return answer;
      });
      res.additional = res.additional.map(answer => {
        answer.name = answer.name.replace(alias, domain);
        return answer;
      });
    }
  } catch (err) {
    return empty.resolve(name, types[type]);
  }
}
