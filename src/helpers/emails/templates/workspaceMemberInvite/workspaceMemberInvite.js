import fs from 'fs'
import ENV from '../../../../envServer.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// let htmlPart = require('./workspaceMemberInvite.html')
let htmlPart
// if(ENV.ENV === 'prod' && ENV.SLS_BUILDING) {
// if (ENV.ENV === 'dev' || ENV.ENV === 'prod') {
//     htmlPart = require('./workspaceMemberInvite.html')
// } else {
    htmlPart = fs.readFileSync(__dirname + '/workspaceMemberInvite.html', 'utf8')
// }

// let htmlPart = fs.readFileSync(__dirname + '/workspaceMemberInvite.html', 'utf8')
// let htmlPart = ENV.ENV === 'dev' ?
//     fs.readFileSync(__dirname + '/workspaceMemberInvite.html', 'utf8') :
//     require('./workspaceMemberInvite.html')


export default {
    "TemplateName": "workspaceMemberInvite",
    "SubjectPart": "{{ownerName}} invites you to join TellTrail",
    "HtmlPart": htmlPart,
}
