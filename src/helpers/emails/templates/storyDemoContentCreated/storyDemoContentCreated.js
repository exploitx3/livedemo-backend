import fs from 'fs'
import ENV from '../../../../envServer.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let htmlPart
// if(ENV.ENV === 'prod' && ENV.SLS_BUILDING) {
// if(ENV.ENV === 'dev' || ENV.ENV === 'prod') {
//   htmlPart = require('./storyDemoContentCreated.html')
// } else {
  htmlPart = fs.readFileSync(__dirname + '/storyDemoContentCreated.html', 'utf8')
// }
// let htmlPart = ENV.ENV === 'dev' ?
//     fs.readFileSync(__dirname + '/storyDemoContentCreated.html', 'utf8') :
//     require('./storyDemoContentCreated.html')

export default {
  "TemplateName": "storyDemoContentCreated",
  "SubjectPart": "Ta-da! Your LiveDemo Video has been created! 🎉",
  "HtmlPart": htmlPart,
}
