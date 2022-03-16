# Aliasing Middleware

Resolve Handshake SLDs trustlessly.

## Usage

Install `hipr`, then run
```
hipr install hipr-aliasing
```
to install the aliasing middleware, and spin up your hipr server (assuming you have an hsd root resolver on port 5349):
```
hipr hipr-aliasing :5333 :5349
```

To test if it's working, try running `dig @127.0.0.1 -p 5333 luke.dsub +short`. you should get `66.42.108.201`.

## How it works

If a Handshake TLD _{tld}_ sets a [HIP-5](https://github.com/handshake-org/HIPs/blob/master/HIP-0005.md) NS record "_{hip5data}_._aliasing", then any HIP-5 extension implementing the `aliasing` protocol must:

1. For any SLD _{label}.{tld}_, compute the _{alias}_: the [base32](https://github.com/bcoin-org/bs32) encoding of the [blake3](https://github.com/connor4312/blake3) hash of _{label}_ concatenated (as strings) with the _first_ label of _{hip5data}_ (line [24](https://github.com/lukeburns/hipr-aliasing/blob/52d286b7c64712d4647c3f6f600f3d65b2296263/index.js#L24)).
2. Forward the original DNS query for _{label}.{tld}_ to _{alias}_ (line [30](https://github.com/lukeburns/hipr-aliasing/blob/52d286b7c64712d4647c3f6f600f3d65b2296263/index.js#L30)) after substituting _{label}.{tld}_ for _{alias}_ (line [25](https://github.com/lukeburns/hipr-aliasing/blob/52d286b7c64712d4647c3f6f600f3d65b2296263/index.js#L25)), then return the response after substituting _{alias}_ for _{label}.{tld}_ (lines [34-41](https://github.com/lukeburns/hipr-aliasing/blob/main/index.js#L34-L41))

A TLD owner wishing to open their TLD for SLD registration should set a single HIP-5 NS record as above with a unique public key as hip5 data, then [set their TLD to renew-only](https://github.com/handshake-org/hsd/pull/567). They can use the public key to prove that they originally owned the TLD.

A HIP-5 extension supporting the `aliasing` protocol might also resolve top-level records for the TLD using the public key as a decentralized zone address, as we do in the experimental implementation discussed below. If it does, it must specify the distributed zone protocol that it is using as a sublabel, such as: `{public-key}._hyper._aliasing`. For this reason, only the first label of _{hip5data}_ should be used to compute _{alias}_.
