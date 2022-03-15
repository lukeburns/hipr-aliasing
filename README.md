# Aliasing Middleware

Resolve Handshake SLDs trustlessly. See https://github.com/lukeburns/hip5-hyperzone#tld-aliases for more details.

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
