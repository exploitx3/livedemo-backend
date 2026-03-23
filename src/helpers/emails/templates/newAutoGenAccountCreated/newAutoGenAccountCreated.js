import fs from 'fs'
import ENV from '../../../../envServer.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let htmlPart
// if(ENV.ENV === 'prod') {
// if(ENV.ENV === 'prod' && ENV.SLS_BUILDING) {
//   htmlPart = require('./newAutoGenAccountCreated.html')
// } else {
  htmlPart = fs.readFileSync(__dirname + '/newAutoGenAccountCreated.html', 'utf8')
// }

// let htmlPart = ENV.ENV === 'dev' ?
//     fs.readFileSync(__dirname + '/newAutoGenAccountCreated.html', 'utf8') :
//     require('./newAutoGenAccountCreated.html')

export default {
  "TemplateName": "newAutoGenAccountCreated",
  "SubjectPart": "Welcome to LiveDemo 🎉",
  "HtmlPart": htmlPart,
}
