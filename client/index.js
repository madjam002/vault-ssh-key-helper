const open = require('opn')
const execa = require('execa')
const express = require('express')

async function getPubKey() {
  const { stdout } = await execa('ssh-add', ['-L'])
  return stdout.trim()
}

exports.getCertificateFlow = async function(serverUrl, callbackPort) {
  const pubkey = await getPubKey()
  const encodedPubKey = new Buffer(pubkey).toString('base64')

  const app = express()

  open(serverUrl + '?pubkey=' + encodedPubKey)

  const server = app.listen(callbackPort)

  const certificate = await new Promise((resolve, reject) => {
    app.get('/', (req, res) => {
      const decodedCertificate = new Buffer(req.query.cert, 'base64').toString()
      res.send('You can now close this window<script>window.close()</script>')
      resolve(decodedCertificate)
    })
  })

  await new Promise(resolve => server.close(resolve))

  return certificate
}
