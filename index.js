const {
  util, dnssec, Zone,
  wire: {
    Record,
    CNAMERecord,
    NSRecord,
    SOARecord,
    Message,
    Question,
    types,
    typesByVal,
    codes
  }
} = require('bns');

const base32 = require('bs32');
const blake3 = require('blake3');
const { getAlias } = require('./alias');
const { ds, zsk, zskPriv, signResponse } = require('./dnssec');

const { hashName } = require('./script.js');
const { Context } = require('./context.js');
const context = new Context(process.env.ALIASING_NETWORK, undefined, process.env.ALIASING_API_KEY);
const { nodeClient, network } = context;

const empty = new Zone();

module.exports = () => ({
  hostname: ':data.:protocol(_aliasing|aliasing|_ns).:gateway?.',
  handler
});

async function handler ({ data, protocol }, name, type, res, rc, ns) {
  const dataLabels = data.split('.');
  const hip5data = dataLabels[dataLabels.length - 1];

  if (name.indexOf(protocol) > 0) {
    return sendSOA();
  }

  const nameLabels = name.split('.');
  const count = ns.name.split('.').length;
  const subLabels = nameLabels.slice(0, nameLabels.length - count);
  const firstValidIndex = subLabels.findIndex(x => x[0] !== '_');

  if (!rc._aliasPassthrough) {
    rc._aliasPassthrough = true;
    await this.middleware(rc);
    const res = rc.res;

    if (firstValidIndex < 0) {
      res.answer = res.answer.filter(rec => {
        return rec.name === name;
      });
      res.authority = res.authority.filter(rec => {
        return rec.name === name;
      });
      return sendSOA(res);
    } else {
      const subLabel = subLabels[subLabels.length - 1];
      console.log(`[${protocol}@${ns.name}] ${name} ${type} @ ${subLabel}.${hip5data}`);

      let alias

      if (protocol === '_ns') {
        alias = base32.encode(hashName(subLabel, hip5data));
        alias = await getAlias(subLabel, hip5data, nodeClient, network);
        if (!alias) {
          return empty.resolve(name, type);
        }
      } else {
        alias = base32.encode(blake3.hash(subLabel+hip5data));
      }

      alias = util.fqdn(alias)

      const top = nameLabels.slice(nameLabels.length - (count + 1)).join('.');
      const cname = name.replace(top, alias);

      if (process.env.ALIASING_CNAME) {
        const rr = new Record();
        rr.name = name;
        rr.type = types.CNAME;
        rr.ttl = 0;
        rr.data = new CNAMERecord();
        rr.data.target = cname;

        rc.res.answer = [rr];
        signResponse(rc.res, zsk, zskPriv);
        return null;
      }

      if (process.env.ALIASING_NS) {
        const rr = new Record();
        rr.name = name;
        rr.type = types.NS;
        rr.ttl = 0;
        rr.data = new NSRecord();
        rr.data.ns = cname;
        rc.res.answer = [rr];
        signResponse(rc.res, zsk, zskPriv);
        return null;
      }

      if (process.env.ALIASING_PROXY) {
        const res = await this.stub.lookup(cname, types[type]);
        res.question = rc.res.question;
        const signed = signResponse(res, zsk, zskPriv, rec => {
          rec.name = rec.name.replace(cname, name);
        });
        rc.res = res;
        return null;
      }
    }
  }

  return null;
}

function serial () {
  const date = new Date();
  const y = date.getUTCFullYear() * 1e6;
  const m = (date.getUTCMonth() + 1) * 1e4;
  const d = date.getUTCDate() * 1e2;
  const h = date.getUTCHours();
  return y + m + d + h;
}

function toSOA () {
  const rr = new Record();
  const rd = new SOARecord();

  rr.name = '.';
  rr.type = types.SOA;
  rr.ttl = 86400;
  rr.data = rd;
  rd.ns = '.';
  rd.mbox = '.';
  rd.serial = serial();
  rd.refresh = 1800;
  rd.retry = 900;
  rd.expire = 604800;
  rd.minttl = 21600;

  return rr;
}

function sendSOA (res) {
  res = res || new Message();
  res.aa = true;
  res.authority.push(toSOA());
  dnssec.signType(res.authority, types.SOA, zsk, zskPriv);
  return res;
}
