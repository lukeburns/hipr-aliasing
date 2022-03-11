#!/usr/bin/env node

let [serverHost, serverPort] = (process.argv[2] || '127.0.0.1:53').split(':')
let [rootHost, rootPort] = (process.argv[3] || '127.0.0.1:9891').split(':')
serverPort = parseInt(serverPort || 53)
rootPort = parseInt(rootPort || 53)

const { RecursiveServer, createDS } = require('hipr');
const middleware = require('./')

const server = new RecursiveServer({ tcp: true, inet6: true, edns: true, dnssec: true })
server.parseOptions({ dnssec: true })
server.resolver.setStub(rootHost, rootPort, createDS())

server.use(middleware())

server.bind(serverPort, serverHost)
