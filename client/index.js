const opn = require('opn')
const execa = require('execa')
const http = require('http')
const url = require('url')
const stoppable = require('stoppable')

exports.getPublicKey = async () => {
  const { stdout } = await execa('ssh-add', ['-L'])
  return stdout.trim()
}

exports.getCertificateFlow = async function(
  publicKey,
  serverUrl,
  callbackPort,
  openBrowserWindow = opn
) {
  const encodedPubKey = new Buffer(publicKey).toString('base64')

  let handleCallback // gets set later on

  const handleResponse = (req, res) => {
    handleCallback(req, res)
  }

  const server = stoppable(http.createServer(handleResponse))
  server.listen(callbackPort)

  openBrowserWindow(serverUrl + '?pubkey=' + encodedPubKey)

  const certificate = await new Promise((resolve, reject) => {
    handleCallback = (req, res) => {
      const parsedUrl = url.parse(req.url, true)

      const decodedCertificate = new Buffer(
        parsedUrl.query.cert,
        'base64'
      ).toString()

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('You can now close this window<script>window.close()</script>')
      resolve(decodedCertificate)
    }
  })

  await new Promise(resolve => server.stop(resolve))

  return certificate
}
