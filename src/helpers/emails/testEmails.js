import uploadToGmail from './gmail/uploadRenderedTemplateToGmail.js'
import renderTemplate from './renderTemplateExamples.js'
import updateTemplate from './updateTemplates.js'
import templates from './templates/index.js'

import { sendEmail } from './emailsSender.js'
// Test Locally
// let changePassword = templates.changePassword
// let workspaceMemberInvite = templates.workspaceMemberInvite
let newAutoGenAccountCreated = templates.newAutoGenAccountCreated
// let workspaceReport = templates.workspaceReport

updateTemplate(changePassword)
  .then(() => {

    return renderTemplate(changePassword)
  }).then(() => {

  return uploadToGmail(changePassword)
})
  .then(() => updateTemplate(workspaceMemberInvite))
  .then(() => {

    return renderTemplate(workspaceMemberInvite)
  }).then(() => {

  return uploadToGmail(workspaceMemberInvite)
})
  .then(() => updateTemplate(newAutoGenAccountCreated))
  .then(() => {

    return renderTemplate(newAutoGenAccountCreated)
  }).then(() => {

  return uploadToGmail(newAutoGenAccountCreated)
})
  .then(() => updateTemplate(workspaceReport))
  .then(() => {

    return renderTemplate(workspaceReport)
  }).then(() => {

  return uploadToGmail(workspaceReport)
})


// Test SES
//
// sendEmail(templates.newAutoGenAccountCreated, {
//   name: 'Georgi',
//   newUserEmail: 'georgi@gmail.com',
//   directLoginLink: 'http://localhost:5000'
// }, ['gapostolov333@gmail.com'])