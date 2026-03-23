import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import AuthTokenTypes from '../constants/AuthTokenTypes.js'
import AuthTokenStatuses from '../constants/AuthTokenStatuses.js'
import { getUserByAccessToken } from './authHelpers.js'

function randomValueHex(len) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len) // return required number of characters
}

function createTokenForChangePassword(userData, AuthTokenModel) {
  // Generate a secure random token
  const token = randomValueHex(64)

  return AuthTokenModel.create({
    token: token,
    type: AuthTokenTypes.AuthToken_UserChangePassword,
    status: AuthTokenStatuses.ACTIVE,
    userId: userData._id.toString(),
    clientId: 'customScopes',
    scopes: ['postChangePassword']
  })
}

function createTokenForUser(userData, AuthTokenModel) {
  // Generate a secure random token
  const token = randomValueHex(64)

  return AuthTokenModel.create({
    token: token,
    type: AuthTokenTypes.AuthToken_User,
    status: AuthTokenStatuses.ACTIVE,
    userId: userData._id.toString(),
    clientId: 'publicClient',
    scopes: []
  })
}

async function generateHash(plaintextPassword) {
  try {
    const hash = await bcrypt.hash(plaintextPassword, 10)
    return hash
  } catch (err) {
    throw err
  }
}

function authorizeInstance(instanceId, token, AuthTokenModel) {
  return AuthTokenModel.findOneAndUpdate({ token: token },
    { $push: { authorizedInstances: instanceId } }, { new: true }).lean()
    .then((token) => {
      if (!token) {
        throw new Error('Token not found')
      }
      return token
    })
}

function authenticateUser(email, password, UserModel) {
  return UserModel.findOne({ email: email })
    .populate('workspaceMembers', '-slackAccessTokens')
    .then((user) => {
      if (!user) {
        throw new Error('Incorrect Email Or Password')
      }

      return new Promise((resolve, reject) => {
        user.comparePassword(password, (err, response) => {
          if (response) {
            resolve(user.toJSON())
          } else {
            reject(new Error('Incorrect Email Or Password'))
          }
        })
      })
    })
}

export default {
  createTokenForChangePassword,
  createTokenForUser,
  generateHash,
  getUserByAccessToken,
  authenticateUser,
  authorizeInstance
}
