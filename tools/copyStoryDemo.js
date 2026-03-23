import {setupDB, getModels} from '../src/models/index.js'
import axios from 'axios'
import pkg from 'mongodb';
const { ObjectId } = pkg;

const prodStoryId = '69b1a246a79951001c303387'
const prodWorkspaceId = '683e79831ba6640008e2bfe5'
const prodAuthToken = ''

const localWorkspaceId = '694dcb7155ee437ee86b8bb5'
const localUserId = '63fc45a0207a95711692763e'

var Models
var newStoryId

setupDB()
    .then(conn => getModels(conn))
    .then(ModelsResult => {
        Models = ModelsResult

        return axios.get(`https://story-api.livedemo.ai/workspaces/${prodWorkspaceId}/stories/${prodStoryId}`, {
            headers: {
                Authorization: `Bearer ${prodAuthToken}`,
                ClientId: 'publicClient'
            }
        }).then((res) => {
            return res.data
        })
            .then((storyDemoFullDoc) => {

                let uniqueObjId = new ObjectId()
                newStoryId = uniqueObjId

                let promisesArray = []

                for (let i = 0; i < storyDemoFullDoc.screens.length; i++) {
                    let screen = storyDemoFullDoc.screens[i]
                    screen._id = new ObjectId()

                    promisesArray.push(new Models.Screen({
                        ...screen,
                        storyId: newStoryId
                    }).save())
                }

                return Promise.all(promisesArray)
                    .then((screensArray) => {
                        let screenIds = screensArray.map(scr => scr._id)


                        return new Models.Story({
                            ...storyDemoFullDoc,
                            _id: newStoryId,
                            userId: localUserId,
                            workspaceId: localWorkspaceId,
                            screens: screenIds
                        }).save()

                    })
            })
    })
    .then(() => {
        console.log(`Copied - ${prodStoryId} from prod to local with id ${newStoryId}`)
    })
    .catch(err => {

        console.log(err)

    })
