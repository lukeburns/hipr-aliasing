# ipfs hipr resolver

resolves `_ipfs` [hip5](https://github.com/handshake-org/HIPs/blob/master/HIP-0005.md) protocol ns records (but recursively) using [hipr](https://github.com/lukeburns/hipr). we are currently just resolving with the cloudflare ipfs gateway.

## usage

`hipr-ipfs` is [hipr](https://github.com/lukeburns/hipr) middleware. 

if you don't have [hipr](https://github.com/lukeburns/hipr) installed, run
```
npm i -g hipr
```
then you can install the `hipr-ipfs` middleware
```
hipr install hipr-ipfs
```
and spin up a server
```
hipr hipr-ipfs 127.0.0.1:5333 1.1.1.1
```

this starts a recursive server on port 5333 capable of resolving zone files from sia using Cloudflare's public resolver as a stub resolver. If you want to resolve handshake names as well, and you are running [hsd](https://github.com/handshake-org/hsd) with an authoritative server on port 5349, then start hipr with

```
hipr hipr-ipfs 127.0.0.1:5333 127.0.0.1:5349
```

now, in a new shell, you can test that hipr is resolving properly:

```
> dig @127.0.0.1 -p 5333 ipfs.chan0
66.42.108.201
```
which is resolving from the ipfs zone file [QmRhPDZ6DAnWKpzpt8tUwqNujS9uyZp69nDKF5Re9wrfdk](https://cloudflare-ipfs.com/ipfs/QmRhPDZ6DAnWKpzpt8tUwqNujS9uyZp69nDKF5Re9wrfdk).

i have a hip5 ns record 

```
ipfs.chan0. 3600 IN NS ciqddyv5s4lxywtwm5jeosdsddjab4iu2llbdcwyrtkcsku33py3n4y._ipfs.
```

in my zone for the tld chan0, where `ciqddyv5s4lxywtwm5jeosdsddjab4iu2llbdcwyrtkcsku33py3n4y` is the [base32](https://github.com/bcoin-org/bs32) encoding of the cid `QmRhPDZ6DAnWKpzpt8tUwqNujS9uyZp69nDKF5Re9wrfdk`. you can use `encode.js` and `decode.js` in this repo for base32 encoding and decoding of base58-encoded ipfs cids.

```
> node encode QmRhPDZ6DAnWKpzpt8tUwqNujS9uyZp69nDKF5Re9wrfdk
ciqddyv5s4lxywtwm5jeosdsddjab4iu2llbdcwyrtkcsku33py3n4y

> node decode ciqddyv5s4lxywtwm5jeosdsddjab4iu2llbdcwyrtkcsku33py3n4y
QmRhPDZ6DAnWKpzpt8tUwqNujS9uyZp69nDKF5Re9wrfdk
```
