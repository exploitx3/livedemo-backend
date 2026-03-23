If the gmail token expires
You will need to create a new token using the /gmail/generateTokenJSON.js script
And also you might need to active the GMAIL API in google console and create a webclient with consent which will be used
by the generateTokenJson from the env vars "GMAIL__..."

For local testing of email you have to comment
// let htmlPart = require('./changePassword.html')
and uncomment
let htmlPart = fs.readFileSync(__dirname + '/changePassword.html', 'utf8')

so that the renderTemplateExamples will work, although serverless-offline won't work and you will
have to revert back to using require() after local testing is done

If you want to sendEmails in monq-queue or somewhere which is not in aws lambda.
Use the lambda function api call sendEmail which is an internal API