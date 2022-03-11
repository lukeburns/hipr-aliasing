# aliasing hipr resolver

[hipr](https://github.com/lukeburns/hipr) middleware for resolving `_aliasing` [hip5](https://github.com/handshake-org/HIPs/blob/master/HIP-0005.md) protocol ns records.

this can be used to resolve Handshake SLDs trustlessly. see https://github.com/lukeburns/hip5-hyperzone#tld-aliases for more details.

## usage

install `hipr`, then run
```
hipr install hipr-aliasing
```
to install the aliasing middleware, and spin up your hipr server (assuming you have an hsd root resolver on port 5349):
```
hipr hipr-aliasing 127.0.0.1:5333 120.0.0.1:5349
```

to test if it's working, try running `dig @127.0.0.1 -p 5333 luke.dsbu +short`. you should get `66.42.108.201`.
