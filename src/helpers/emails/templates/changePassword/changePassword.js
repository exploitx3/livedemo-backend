import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let htmlPart = fs.readFileSync(join(__dirname, 'changePassword.html'), 'utf8')

export default {
  "TemplateName": "changePassword",
  "SubjectPart": "Change password request",
  "HtmlPart": htmlPart,
}
