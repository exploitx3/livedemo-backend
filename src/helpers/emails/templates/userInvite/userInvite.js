import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let htmlPart = fs.readFileSync(join(__dirname, 'userInvite.html'), 'utf8')

export default {
  "TemplateName": "userInvite",
  "SubjectPart": "{{ownerName}} invites you to join LiveDemo",
  "HtmlPart": htmlPart,
}
