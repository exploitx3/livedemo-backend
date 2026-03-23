import helpers from '../helpers/livedemoHelpers.js'
const SCREENDOC_ENCODING = 'utf-8'
import ENV from '../envServer.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import fsp from 'fs/promises'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let requestBody = null

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let screenId = req.params.screenId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      // return authReq(req)
    })
    // .then(({ authUser }) => {
    //   authUserDoc = authUser
    //
    //   let validatedBody = validateBody(req.body, patchScreenValidator)
    //   requestBody = validatedBody.value
    //
    //   validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    // })
    .then(async () => {


      return Models.Screen.findOne({
          _id: screenId
        })
          .populate({
            path: 'steps',
            populate: [
              {
                path: 'view.popup.formId',
                model: 'Form',
              },
              {
                path: 'stepAudioId',
                model: 'Audio',
              }
            ],
            options: { sort: { 'index': 1 } }
          })
        .lean()
    })
    .then((screenDoc) => {

      if(screenDoc.contentPath) {
        return fsp.readFile(screenDoc.contentPath, { encoding: SCREENDOC_ENCODING })
          .then((contentString) => {


            // let indexOfHeadStart = contentString.indexOf('<head livedemo_id="top_1">')


            let scriptToAppend = `<script>document.domain = "${ENV.URL_COMMON_DOMAIN}"</script>\n`
            scriptToAppend += '<style>@keyframes pulse {\n\t0% {\n\t\ttransform: scale(0.98);\n\t\tbox-shadow: 0 0 0 0 rgba(16, 112, 255, 0.7);\n\t}\n\n\t70% {\n\t\ttransform: scale(1);\n\t\tbox-shadow: 0 0 0 10px rgba(16, 112, 255, 0);\n\t}\n\n\t100% {\n\t\ttransform: scale(0.98);\n\t\tbox-shadow: 0 0 0 0 rgba(16, 112, 255, 0);\n\t}\n}</style>'

            // scriptToAppend += '<script src="https://cdn.lr-in-prod.com/LogRocket.min.js" crossorigin="anonymous"></script>\n' +
            //   '<script>window.LogRocket && window.LogRocket.init(\'dotxvj/livedemo\', {  mergeIframes: true});</script>\n'

            // '<script>\n' +
            // 'history.pushState(null, null, location.href);\n' +
            // '    window.onpopstate = function () {\n' +
            // '      history.go(1);\n' +
            // '    };\n' +
            // '</script>'

            let respBodyFinal = contentString.replace(/(<\s*head[\W\w]*?[^>]*>)/, '$1\n' + scriptToAppend)

            screenDoc.contentString = respBodyFinal

            return screenDoc
          })
      } else {

        return screenDoc
      }


    })
    .then((screenDoc) => {

      const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
          // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(
        JSON.stringify({
          screenDoc: screenDoc,
          content: screenDoc.contentString
        })
      )
    })
    .catch((error) => {
      console.log(error)

      let resultResponse
      if (error.resultResponse) {

        resultResponse = error.resultResponse
      } else {


        resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: ''
        }

      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body)
    })
}

export default  handler
