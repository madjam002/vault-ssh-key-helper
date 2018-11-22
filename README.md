# vault-ssh-key-helper

> CLI tool and accompanying server to help with SSH certificate signing using Hashicorp Vault

## Problem

- You're using Hashicorp Vault for your secret management needs
- You're also using Vault for signing SSH certificates used for accessing your SSH servers
- Your instance of Vault is behind a Bastion server which you cannot access without a signed SSH certificate

So how do you get a signed SSH certificate to connect to the Bastion server to access Vault if Vault is the thing that generates your SSH certificates?

## Solution

This is a command line helper and accompanying web server to retrieve a signed SSH certificate from Vault without actually having Vault exposed to the public internet. It is meant for organisations where lots of users might be accessing Vault and you have implemented the JWT auth backend for Vault so that users can authenticate with a Single Sign On method.

The web server in this repo should be run behind an instance of Keycloak Gatekeeper (https://github.com/keycloak/keycloak-gatekeeper) which will pass through an `X-Auth-Token` header to the server. The server will then give this token to Vault and exchange it for a Vault token. Then, the Vault token will be used to sign the public key and retrieve a signed OpenSSH certificate.

The CLI helper is used to automatically retrieve the public key from the running SSH agent, pass the public key to the web server, and then start a local web server used to return the certificate through a callback URL.

This may sound complicated, but it's actually quite simple in practice. More documentation will follow here.

## Docker

The server component of this repo is published to docker as `madjam002/vault-ssh-key-helper`

## License

Licensed under the MIT License.

[View the full license here](https://raw.githubusercontent.com/madjam002/vault-ssh-key-helper/master/LICENSE).
