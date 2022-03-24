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

  if (res.authority.filter(x => x.name.indexOf(nameAlias) > -1).length > 0) {
    return empty.resolve(name, types[type]);
  } else {
    const res = await this.stub.lookup(nameAlias, types.A);
    res.answer = [];
    res.question = rc.res.question;
    res.authority = res.authority.map(answer => {
      answer.name = answer.name.replace(alias, domain);
      return answer;
    });
    res.additional = res.additional.map(answer => {
      answer.name = answer.name.replace(alias, domain);
      return answer;
    });
    rc.res = res;
    return null;
  }
}
