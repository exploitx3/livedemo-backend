import fs from 'fs'
import { google } from 'googleapis'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ENV from '../../../envServer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TOKEN_PATH = __dirname + '/token.json'
const GMAIL_CONF = ENV.GMAIL


/**
 * Returns GmailApi
 */
function authenticate() {
  let credentials = {
    client_id: GMAIL_CONF.CLIENT_ID,
    client_secret: GMAIL_CONF.CLIENT_SECRET,
    redirect_uris: GMAIL_CONF.REDIRECT_URIS
  }

  return new Promise((resolve, reject) => {
    const { client_secret, client_id, redirect_uris } = credentials
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])


    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        reject(err)
      } else {
        oAuth2Client.setCredentials(JSON.parse(token))

        const gmail = google.gmail({ version: 'v1', auth:oAuth2Client })

        resolve(gmail)

      }

    })

  })

}

export default authenticate