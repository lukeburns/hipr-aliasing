# aliasing hipr resolver

[hipr](https://github.com/lukeburns/hipr) middleware for resolving `_aliasing` [hip5](https://github.com/handshake-org/HIPs/blob/master/HIP-0005.md) protocol ns records.

this can be used to resolve Handshake SLDs trustlessly. see https://github.com/lukeburns/hip5-hyperzone#tld-aliases for more details.

## usage

install `hipr`, then run
```
hipr install hipr-aliasing
```
to install the aliasing middleware, and spin up your hipr server:
```
hipr hipr-aliasing
```