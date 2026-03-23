import fs from 'fs'
import ENV from '../../../../envServer.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// let htmlPart = require('./workspaceReport.html')
// let htmlPart = fs.readFileSync(__dirname + '/workspaceReport.html', 'utf8')
// let htmlPart = ENV.ENV === 'dev' && !ENV.SLS_BUILDING ? fs.readFileSync(__dirname + '/workspaceReport.html', 'utf8') : require('./workspaceReport.html')
let htmlPart
// if(ENV.ENV === 'prod' && ENV.SLS_BUILDING) {
//   htmlPart = require('./workspaceReport.html')
// } else {
  htmlPart = fs.readFileSync(__dirname + '/workspaceReport.html', 'utf8')
// }

export default {
  "TemplateName": "workspaceReport",
  "SubjectPart": "TellTrail Report - {{workspaceName}}",
  "HtmlPart": htmlPart,
}
