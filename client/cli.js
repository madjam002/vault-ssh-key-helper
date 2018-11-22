#!/usr/bin/env node

const { getCertificateFlow } = require('./')
const { SERVER_URL, CALLBACK_PORT } = process.env

if (!SERVER_URL) {
  throw new Error('SERVER_URL not set')
}

if (!CALLBACK_PORT) {
  throw new Error('CALLBACK_PORT not set')
}

getCertificateFlow(SERVER_URL, CALLBACK_PORT).then(certificate =>
  console.log(certificate)
)
