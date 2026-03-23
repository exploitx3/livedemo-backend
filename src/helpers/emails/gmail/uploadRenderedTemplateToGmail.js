import authenticate from './getGmailAuth.js'
import ENV from '../../../envServer.js'
import { google } from 'googleapis'
import fs from 'fs'
import Base64 from 'js-base64'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const GMAIL_CONF = ENV.GMAIL

function uploadToGmail(template) {

  return getData(__dirname + `/../renderedTemplateExamples/${template.data.TemplateName}.eml`, 'utf8')
    .then(fileData => {

      return authenticate()
        .then(gmailApi => {
          return {
            gmailApi, fileData
          }
        })
    })
    .then(({ gmailApi, fileData }) => {

      let raw = Base64.encodeURI(fileData)
      gmailApi.users.messages.insert({
          userId: 'me',
          resource: {
            raw: raw
          }
        })
        .then(res => {

          console.log(res)
        })
        .catch(err => {
          console.log(err)
        })
    })
    .catch(err => {
      console.log(err)
    })
}

function getData(fileName, type) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName, type, (err, data) => {
      err ? reject(err) : resolve(data)
    })
  })
}

export default uploadToGmail
