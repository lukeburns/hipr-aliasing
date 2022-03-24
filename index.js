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
  const firstValidIndex = subLabels.findIndex(x => x[0] !== '_');

  if (firstValidIndex < 0) {
    if (!rc._aliasPassthrough) {
      rc._aliasPassthrough = true;
      await this.middleware(rc);
      const res = rc.res;

      // strict answers only
      // todo: improve filtering to prevent cache takeovers by TLD owner
      res.answer = res.answer.filter(rec => {
        return rec.name === name;
      });

      return rc.res;
    }

    return null;
  }

  const alias = util.fqdn(base32.encode(blake3.hash(subLabel + hip5data)));
  const domain = subLabel + '.' + ns.name;
  const nameAlias = name.replace(domain, alias);

  if (res.authority.filter(x => x.name.indexOf(nameAlias) > -1).length > 0) {
    return empty.resolve(name, types[type]);
  } else {
    const res = await this.stub.lookup(nameAlias, types[type]);

    res.question = rc.res.question;

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

    // answer with DS record
    if (type === 'DS') {
      return res;
    }

    // otherwise just pass along referral
    rc.res = res;
    return null;
  }
}
