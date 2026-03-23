import helpers from '../helpers/livedemoHelpers.js'
import postScreenEditTextValidator from '../helpers/validators/stories/screens/postScreenEditTextValidator.js'
import short from 'short-uuid'
import ResponseCodes from '../constants/ResponseCodes.js'
import fsp from 'fs/promises'

import * as parse5Obj from 'parse5'
const {parse5} = parse5Obj
import parse5Helper from 'parse5-helper'

import { DOMParser, XMLSerializer } from 'xmldom'
import xpath from 'xpath'
import jsdom from 'jsdom'
const { JSDOM } = jsdom

const SCREENDOC_ENCODING = 'utf-8'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let requestBody = null

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let screenId = req.params.screenId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      let validatedBody = helpers.validateBody(req.body, postScreenEditTextValidator)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {


      return Models.Screen.findOne({
        _id: screenId
      }).lean()
    })
    .then((screenDoc) => {

      return fsp.readFile(screenDoc.contentPath, { encoding: SCREENDOC_ENCODING })
        .then((contentString) => {
          let { selector, text } = requestBody
          // let doc = new DOMParser().parseFromString(contentString)

          // const { document : doc} = parseHTML(contentString)


          const doc = parse5.parse(contentString)

          //
          // let doc= new JSDOM(contentString, {
          //   parsingMode: 'xml',
          //   resources: "usable"
          // })
          let foundNode = helpers.findNodeByTagValue('livedemo_id', selector, doc.childNodes)
          let editNode = helpers.findNodeByNodeName('#text', [foundNode])

          if (!editNode) {
            throw new Error('Node not found')
          }

          console.log(editNode)
          editNode.value = text

          // const documentString = new XMLSerializer().serializeToString(document)

          // let documentString = doc.serialize()
          // let documentString = doc.toString()
          let documentString = parse5.serialize(doc)

          return fsp.writeFile(screenDoc.contentPath, documentString)
        })
    })
    .then(() => {

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
      res.send(JSON.stringify({}))
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
