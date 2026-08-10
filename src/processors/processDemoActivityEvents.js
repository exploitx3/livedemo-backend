import fsp from 'fs/promises'
import ENV_VARS from '../envServer.js'
import StoryStatuses from '../constants/StoryStatuses.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import mongoose from 'mongoose'
const { ObjectId } = mongoose.Types
import flixHelpers from '../helpers/flixHelpers.js'
import he from 'he'
import axios from 'axios'

function processVisitEvent(sharedConfig, storyDoc, data) {
    const { Models, axios } = sharedConfig
    console.log('processVisitEvent - Done')
    return Promise.resolve()
}

function processCompletionEvent(sharedConfig, storyDoc, data) {
    const { Models, axios } = sharedConfig
    console.log('processCompletionEvent - Done')
    return Promise.resolve()

}

function processLeadCollectionEvent(sharedConfig, storyDoc, data) {
    const { Models, axios } = sharedConfig
    const { workspaceId, leadData } = data
    
    // Get workspace to check hubspot integration
    return Models.Workspace.findOne({ _id: workspaceId })
        .lean()
        .then((workspaceDoc) => {
            if (!workspaceDoc) {
                throw new Error(`Workspace not found: ${workspaceId}`)
            }

            // Check if HubSpot integration is enabled
            if (!workspaceDoc.integrations?.hubspot) {
                console.log(`HubSpot integration not enabled for workspace ${workspaceId}`)
                return Promise.resolve()
            }

            // Get HubSpot token for this workspace
            return Models.HubspotToken.findOne({
                workspaceId: new ObjectId(workspaceId)
            })
            .lean()
            .then((hubspotToken) => {
                if (!hubspotToken || !hubspotToken.accessToken) {
                    console.log(`HubSpot token not found for workspace ${workspaceId}`)
                    return Promise.resolve()
                }

                // Extract name and email from leadData
                const email = leadData?.email
                const name = leadData?.name

                if (!email) {
                    console.log('No email found in lead data, skipping HubSpot contact creation')
                    return Promise.resolve()
                }

                // Prepare contact data - split name into first and last if possible
                let firstName = ''
                let lastName = ''
                if (name) {
                    const nameParts = name.trim().split(/\s+/)
                    firstName = nameParts[0] || ''
                    lastName = nameParts.slice(1).join(' ') || ''
                }

                // Helper function to create HubSpot contact
                function createHubspotContact(token, email, firstName, lastName) {
                    // Create HubSpot contact
                    const contactData = {
                        properties: {
                            email: email
                        }
                    }

                    if (firstName) {
                        contactData.properties.firstname = firstName
                    }
                    if (lastName) {
                        contactData.properties.lastname = lastName
                    }

                    return axios.post(
                        'https://api.hubapi.com/crm/v3/objects/contacts',
                        contactData,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                    .then((response) => {
                        console.log(`HubSpot contact created successfully: ${response.data.id}`)
                        return Promise.resolve()
                    })
                    .catch((error) => {
                        // If contact already exists (409), that's okay
                        if (error.response && error.response.status === 409) {
                            console.log(`HubSpot contact already exists for email: ${email}`)
                            return Promise.resolve()
                        }
                        // Log other errors but don't fail the job
                        console.error('Error creating HubSpot contact:', error.response?.data || error.message)
                        return Promise.resolve()
                    })
                }

                // Check if token is expired and refresh if needed
                let accessToken = hubspotToken.accessToken
                let tokenNeedsRefresh = hubspotToken.expiresAt && new Date(hubspotToken.expiresAt) < new Date()

                if (tokenNeedsRefresh) {
                    // Refresh the token
                    const HubspotCreds = ENV_VARS.OAUTH2Credentials?.HubSpot
                    if (!HubspotCreds || !hubspotToken.refreshToken) {
                        console.log('Cannot refresh HubSpot token: OAuth not configured or refresh token missing')
                        return Promise.resolve()
                    }

                    return axios.post('https://api.hubapi.com/oauth/v1/token', new URLSearchParams({
                        grant_type: 'refresh_token',
                        client_id: HubspotCreds.client_id,
                        client_secret: HubspotCreds.client_secret,
                        refresh_token: hubspotToken.refreshToken
                    }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                    .then((tokenResponse) => {
                        const tokenRes = tokenResponse.data
                        if (!tokenRes.access_token) {
                            throw new Error('Failed to refresh access token from HubSpot')
                        }

                        const expiresAt = new Date(Date.now() + (tokenRes.expires_in * 1000))
                        accessToken = tokenRes.access_token

                        // Update the token in the database
                        return Models.HubspotToken.findOneAndUpdate(
                            { _id: hubspotToken._id },
                            {
                                accessToken: tokenRes.access_token,
                                refreshToken: tokenRes.refresh_token || hubspotToken.refreshToken,
                                expiresAt: expiresAt
                            }
                        )
                        .then(() => {
                            console.log('HubSpot token refreshed successfully')
                            return accessToken
                        })
                    })
                    .catch((refreshError) => {
                        console.error('Error refreshing HubSpot token:', refreshError.message)
                        // Continue with existing token, API call may fail but we'll handle it
                        return accessToken
                    })
                    .then((token) => {
                        // Continue with contact creation using the token (refreshed or original)
                        return createHubspotContact(token, email, firstName, lastName)
                    })
                } else {
                    // Token is still valid, proceed with contact creation
                    return createHubspotContact(accessToken, email, firstName, lastName)
                }
            })
        })
}

function processDemoActivityEvents(sharedConfig, params, callback) {
    const { Models, axios } = sharedConfig
    const { storyId, sessionId, sessionEventId, eventName, workspaceId, leadId, leadData } = params
    
    // Determine event type from eventName or params structure
    let name = eventName
    if (!name) {
        // Fallback: determine from params structure
        if (leadId || leadData) {
            name = 'lead-collection'
        } else if (sessionEventId) {
            name = 'completion'
        } else if (sessionId) {
            name = 'visit'
        } else {
            return callback(new Error('Unable to determine event type from params'))
        }
    }

    // Get story document (not needed for lead-collection, but kept for consistency)
    return Models.Story.findOne({ _id: storyId })
        .lean()
        .then((storyDoc) => {
            if (!storyDoc) {
                throw new Error(`Story not found: ${storyId}`)
            }

            let data = {
                storyId,
                sessionId,
                sessionEventId,
                workspaceId,
                leadId,
                leadData
            }

            switch (name) {
                case 'visit':
                    return processVisitEvent(sharedConfig, storyDoc, data)
                case 'completion':
                    return processCompletionEvent(sharedConfig, storyDoc, data)
                case 'lead-collection':
                    return processLeadCollectionEvent(sharedConfig, storyDoc, data)
                default:
                    return Promise.reject(new Error(`Invalid event name: ${name}`))
            }
        })
        .then((result) => {
            // console.log('processDemoActivityEvents completed - end')
            callback(null, { storyId, sessionId })
        })
        .catch(err => {
            console.log('processDemoActivityEvents failed - end')
            console.log(err)

            callback(err)
        })
}


const config = {
    queueNames: ['demoActivityEvents'],
    jobNames: ['visit-event', 'completion-event', 'lead-collection-event'],
    handler: processDemoActivityEvents
}

export default config
