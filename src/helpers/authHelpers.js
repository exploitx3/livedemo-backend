import AuthTokenStatuses from '../constants/AuthTokenStatuses.js'
import { normalizeSubscriptions } from './subscriptionHelpers.js'

export function getUserByAccessToken(token, UserModel, AuthToken) {
    let userDataPromise = AuthToken.findOne({ token: token, status: AuthTokenStatuses.ACTIVE }).lean()
        .then(authToken => {
            if (!authToken) {
                throw new Error('No user found by the userId from the access token')
            }

            return authToken
        })


    return userDataPromise
        .then((authTokenDoc) => {

            return UserModel.findOne({ _id: authTokenDoc.userId })
                .populate('workspaceMembers subscriptions workspaces', '-slackAccessTokens')
                .lean()
                .then(userData => {
                    if (!userData) {
                        throw new Error('No user found by the userId from the access token')
                    }

                    const user = JSON.parse(JSON.stringify(userData))
                    if (user.subscriptions) {
                      user.subscriptions = normalizeSubscriptions(user.subscriptions)
                    }
                    return user
                })
        })
}


export function getUserAndTokenByInstanceId(instanceId, UserModel, AuthToken) {
    let userAndTokenPromise = AuthToken.findOne({ status: AuthTokenStatuses.ACTIVE, authorizedInstances: { $in: [instanceId] } }).lean()
        .then((authTokenDoc) => {
            if (!authTokenDoc) {
                throw new Error('No token found by the instanceId')
            }

            return UserModel.findOne({ _id: authTokenDoc.userId })
                .populate('workspaceMembers subscriptions workspaces', '-slackAccessTokens')
                .lean()
                .then(userData => {
                    if (!userData) {
                        throw new Error('No user found by the userId from the access token')
                    }

                    const user = JSON.parse(JSON.stringify(userData))
                    if (user.subscriptions) {
                      user.subscriptions = normalizeSubscriptions(user.subscriptions)
                    }
                    return {
                        userData: user,
                        authToken: JSON.parse(JSON.stringify(authTokenDoc))
                    }
                })
        })

    return userAndTokenPromise
        .then(({ userData, authToken }) => {
            return {
                userData: userData,
                authToken: authToken
            }
        })
}
