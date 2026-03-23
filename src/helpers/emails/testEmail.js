import uploadToGmail from './gmail/uploadRenderedTemplateToGmail.js'
import renderTemplate from './renderTemplateExamples.js'
import updateTemplate from './updateTemplates.js'
import templates from './templates/index.js'

import { sendEmail } from './emailsSender.js'
// Test Locally
// let changePassword = templates.changePassword
// let workspaceMemberInvite = templates.workspaceMemberInvite
// let workspaceReport = templates.workspaceReport
let userInvite = templates.userInvite
let newAutoGenAccountCreated = templates.newAutoGenAccountCreated
// let storyDemoContentCreated = templates.storyDemoContentCreated

// updateTemplate(newAutoGenAccountCreated)
//   .then(() => {
//
//     return renderTemplate(newAutoGenAccountCreated)
//   }).then(() => {
//
//   return uploadToGmail(newAutoGenAccountCreated)
// })


// Test SES
//
import { setupDB, getModels } from '../../models/index.js'

setupDB()
  .then(conn => getModels(conn))
  .then(Models => {

    return sendEmail(templates.newAutoGenAccountCreated, {
      name: 'New User Test',
    }, ['george@livedemo.ai'], Models)

    // return sendEmail(templates.userInvite, {
    //   ownerName: 'Georgi',
    //   newUserEmail: 'gapostolov333@gmail.com',
    //   directLoginLink: 'http://localhost:5000'
    // }, ['gapostolov333@gmail.com'], Models)

    // return sendEmail(templates.storyDemoContentCreated, {
    //   demoName: 'LiveDemo | Demo The Future',
    //   videoUrl: 'https://d1tmqwkaq9ygb3.cloudfront.net/story-videos/65790176447bb90a38e47304-24b45326-7f3a-4455-9d2e-114bb4fc4153.mp4',
    //   gifUrl: 'https://d1tmqwkaq9ygb3.cloudfront.net/story-gifs/65790176447bb90a38e47304-24b45326-7f3a-4455-9d2e-114bb4fc4153.gif'
    // }, ['gapostolov333@gmail.com'], Models)
  })

