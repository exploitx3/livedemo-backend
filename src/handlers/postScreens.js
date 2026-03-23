import postScreensValidator from '../helpers/validators/stories/screens/postScreensValidator.js'
import helpers from '../helpers/livedemoHelpers.js'
import short from 'short-uuid'
import ResponseCodes from '../constants/ResponseCodes.js'
import pkg from 'mongodb';
const { ObjectId } = pkg;
import ENV from '../envServer.js'
import fsp from 'fs/promises'

import * as parse5 from 'parse5'
// const {parse5} = parse5Import
import parse5Helper from 'parse5-helper'

import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import xpath from 'xpath'
import jsdom from 'jsdom'
const { JSDOM } = jsdom

const SCREENDOC_ENCODING = 'utf-8'

function handler(req, res){
  let {Models, conn} = req.mongo

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let requestBody = req.body
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser
      let validatedBody = helpers.validateBody(req.body, postScreensValidator)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {

      let name = requestBody.name
      let width = requestBody.width
      let height = requestBody.height
      let content = requestBody.content
      let imageData = requestBody.imageData
      let screenId = new ObjectId()

      let storyDir = `${ENV.STORIES_FOLDER}/${storyId}`
      let screenDir = `${storyDir}/${screenId}.html`

      let imageUrl = ''
      let imageName = short.uuid() + '.png'

      return helpers.uploadImage(imageData, imageName)
        .then((uploadResult) => {
          console.log(uploadResult)
          imageUrl = uploadResult.Location

          return imageUrl
        })
        .then(async () => {
          return fsp.access(storyDir)
            .catch(() => {

              return fsp.mkdir(storyDir)
            })
        })
        .then(() => {

          console.log('before')
          // console.log(content)
          // const document = new DOMParser().parseFromString(content)
          // const documentString = new XMLSerializer().serializeToString(document)

          const document = parse5.parse(content)

          const documentString = parse5.serialize(document)


          console.log('after')
          // console.log(documentString)
          // Linkedom
          // const { document }= parseHTML(content)
          // const documentString = document.toString()

          // JSDOM
          // const document = new JSDOM(content, {
          //   parsingMode: 'xml',
          //   resources: "usable"
          // })
          // const documentString = document.serialize()

          // // Serializes a document.
          // const html = parse5.serialize(document);
          //
          // // Serializes the <html> element content.
          // const str = parse5.serialize(document.childNodes[1]);
          //
          // console.log(str); //> '<head></head><body>Hi there!</body>'

          return helpers.writeToSystem(screenDir, documentString, SCREENDOC_ENCODING)
          // return fsp.writeFile(screenDir, documentString, { encoding: SCREENDOC_ENCODING })
        })
        .then(() => {

          return Models.Story.findOne({ _id: storyId })
            .lean()
            .then((storyDoc) => {
              let screensLength = storyDoc.screens.length

              let screenObj = {
                _id: screenId,
                name,
                workspaceId,
                userId: authUserDoc._id,
                storyId: storyId,
                contentPath: screenDir,
                width: width,
                height: height,
                imageUrl: imageUrl,
                index: screensLength
              }

              // if (screensLength === 0) {
              let newStep = new Models.Step({
                view: {
                  content: '<p>Welcome to our StoryDemo!</p>'
                }
              })
              screenObj.steps = [
                newStep
              ]
              // }

              return new Models.Screen_Page(screenObj).save()
            })

        })


    })
    .then((newScreen) => {
      return Models.Story.findOneAndUpdate({ _id: storyId }, {
          $push: {
            screens: newScreen._id
          }
        })
        .then(() => {
          return Models.Workspace.findOneAndUpdate({ _id: workspaceId }, {
            $addToSet: {
              'library.pages': newScreen._id,
            }
          })
        })
        .then(() => newScreen)
    })
    .then((newScreen) => {

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
      res.send(JSON.stringify(newScreen))
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
