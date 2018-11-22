const express = require('express')
const helmet = require('helmet')
const { post, get } = require('axios')

const {
  PORT,
  VAULT_ADDR,
  CALLBACK_URL,
  JWT_MOUNT_PATH,
  JWT_AUTH_ROLE,
  SSH_MOUNT_PATH,
  SSH_SIGN_ROLE
} = process.env

if (process.env.NODE_ENV !== 'production') {
  console.log('*******')
  console.log('RUNNING IN DEVELOPMENT MODE')
  console.log('*******')
}

if (!PORT) {
  throw new Error('PORT not set')
}

if (!VAULT_ADDR) {
  throw new Error('VAULT_ADDR not set')
}

if (!CALLBACK_URL) {
  throw new Error('CALLBACK_URL not set')
}

if (!JWT_MOUNT_PATH) {
  throw new Error('JWT_MOUNT_PATH not set')
}

if (!JWT_AUTH_ROLE) {
  throw new Error('JWT_AUTH_ROLE not set')
}

if (!SSH_MOUNT_PATH) {
  throw new Error('SSH_MOUNT_PATH not set')
}

if (!SSH_SIGN_ROLE) {
  throw new Error('SSH_SIGN_ROLE not set')
}

const log = (displayName, ...rest) =>
  console.log(`[${new Date().toISOString()}] [${displayName}]`, ...rest)

require('express-async-errors')

const app = express()

app.use(helmet())

app.get('/', async (req, res) => {
  if (!req.headers['x-auth-token']) {
    return res.status(400).send('Missing x-auth-token')
  }

  if (!req.query.pubkey) {
    return res.status(400).send('Missing SSH pubkey')
  }

  let decodedPublicKey
  try {
    decodedPublicKey = new Buffer(req.query.pubkey, 'base64').toString()
  } catch (ex) {
    return res.status(400).send('Failed to decode pubkey')
  }

  const vaultLoginResult = await post(
    `${VAULT_ADDR}/v1/auth/${JWT_MOUNT_PATH}/login`,
    {
      role: JWT_AUTH_ROLE,
      jwt: req.headers['x-auth-token']
    }
  )

  const { client_token } = vaultLoginResult.data.auth

  const tokenDetailsResult = (await get(
    `${VAULT_ADDR}/v1/auth/token/lookup-self`,
    {
      headers: {
        'X-Vault-Token': client_token
      }
    }
  )).data.data

  log(tokenDetailsResult.display_name, `Attempting key sign`)

  const vaultSSHResult = (await post(
    `${VAULT_ADDR}/v1/${SSH_MOUNT_PATH}/sign/${SSH_SIGN_ROLE}`,
    {
      public_key: decodedPublicKey
    },
    {
      headers: {
        'X-Vault-Token': client_token
      }
    }
  )).data.data

  // prettier-ignore
  log(tokenDetailsResult.display_name, `Successfully signed certificate with serial ${vaultSSHResult.serial_number}`)

  const encodedCert = Buffer.from(vaultSSHResult.signed_key.trim()).toString(
    'base64'
  )

  res.redirect(`${CALLBACK_URL}?cert=${encodedCert}`)
})

app.use((err, req, res, next) => {
  console.error(
    err.stack,
    err.response && err.response.data,
    err.request && err.request.path
  )
  res.status(500).send('Internal server error')
})

app.listen(PORT)

console.log('Listening on port', PORT)
