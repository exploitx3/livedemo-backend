import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import changePasswordValidator from '../helpers/validators/oldLambdaRoutes/users/changePasswordValidator.js'
import authUtils from '../helpers/authUtils.js'
import AuthTokenStatuses from '../constants/AuthTokenStatuses.js'
import { getUserByAccessToken } from '../helpers/authHelpers.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let authUserDoc = null
  let requestBody = null
  let authToken = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser, authToken: token }) => {
      authUserDoc = authUser
      authToken = token

      // Validate request body
      let validatedBody = helpers.validateBody(req.body, changePasswordValidator)
      requestBody = validatedBody.value

      if (!requestBody) {
        const resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }

        let error = new Error('Invalid request body')
        error.resultResponse = resultResponse
        throw error
      }

      // Get user by access token
      return getUserByAccessToken(authToken, Models.User, Models.AuthToken)
    })
    .then((userData) => {
      const newPassword = requestBody.newPassword

      // Generate hash for new password
      return authUtils.generateHash(newPassword)
        .then((newPassHash) => {
          return Models.User.findOneAndUpdate(
            { _id: userData._id },
            { password: newPassHash }
          )
        })
        .then(() => {
          return userData
        })
    })
    .then((userData) => {
      // Create new token for user
      return authUtils.createTokenForUser(userData, Models.AuthToken)
        .then((authTokenDoc) => {
          return {
            userData,
            authTokenDoc
          }
        })
    })
    .then(({ userData, authTokenDoc }) => {
      // Expire the old change password token
      return Models.AuthToken_UserChangePassword.findOneAndUpdate(
        { token: authToken },
        { status: AuthTokenStatuses.EXPIRED }
      )
        .then(() => {
          return {
            userData,
            authTokenDoc
          }
        })
    })
    .then(({ userData, authTokenDoc }) => {
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
      res.send(JSON.stringify({
        id: userData._id,
        email: userData.email,
        name: userData.name,
        timezone: userData.timezone,
        token: authTokenDoc.token
      }))
    })
    .catch((error) => {
      console.log(error)

      let resultResponse
      if (error.resultResponse) {

        resultResponse = error.resultResponse
      } else {


        resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify({
            error: error.message || 'Something went wrong, please try again'
          })
        }

      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default  handler
