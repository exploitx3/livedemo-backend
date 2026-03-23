import helpers from '../helpers/livedemoHelpers.js'
import fsp from 'fs/promises'
import ResponseCodes from '../constants/ResponseCodes.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import ENV from '../envServer.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let requestBody = null

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let authUserDoc = null

  let stepIndex = 0

  return Promise.resolve().then(async () => {

      // return authReq(req)
    })
    // .then(({ authUser }) => {
    // authUserDoc = authUser

    // let validatedBody = validateBody(req.body, patchScreenValidator)
    // requestBody = validatedBody.value

    // validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    // })
    .then(async () => {
      stepIndex = req.query.step && parseInt(req.query.step) - 1


      return Models.Story.findOne({
          _id: storyId,
          deletedAt: null
        })
        .populate({
          path: 'screens',
          populate: [
            {
              path: 'customTransitions.gotoScreen',
              model: 'Screen',
              select: '_id name'
            },
            {
              path: 'steps.view.formId',
              model: 'Form',
            },
            {
              path: 'steps.stepAudioId',
              model: 'Audio',
            },
          ],
          select: '_id name steps customTransitions width height imageUrl index imageUrl asset playbackRate',
          options: { sort: { 'index': 1 } }
        })
        .lean()
    })
    .then(async (storyDoc) => {
      let firstScreen = storyDoc.screens && storyDoc.screens.length && storyDoc.screens[0]

      let thumbnailImage = firstScreen.type === ScreenTypes.SCREEN_VIDEO ? `https://image.mux.com/${firstScreen.asset.playback_ids[0].id}/thumbnail.png` : firstScreen.imageUrl

      let htmlString = '<html><head>'

      htmlString += '<link rel="shortcut icon" type="image/png" href="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
        '    <link rel="apple-touch-icon" href="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
        '    <meta name="msapplication-TileImage" content="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
        '    <link rel="alternate" type="application/json+oembed"\n' +
        `          href="${ENV.STORIES_API}/oembed?url=${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview"\n` +
        `          title="${storyDoc.name}"/>\n` +
        '    <meta charSet="UTF-8"/>\n' +
        '    <meta name="generator"\n' +
        '          content="Powered by LiveDemo -- Demo the future. Visit us at https://livedemo.ai."/>\n' +
        '    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>\n' +
        '    <meta name="viewport" content="width=device-width, initial-scale=1"/>\n' +
        '    <meta name="robots" content="max-image-preview:large"/>\n' +
        '    <meta name="author" content="livedemo.ai"/>\n' +
        '    <meta name="copyright" content="LiveDemo"/>\n' +
        '    <meta name="twitter:card" content="player"/>\n' +
        '    <meta name="twitter:site" content="@Live_Demo_Live"/>\n' +
        `    <meta name="twitter:title" content="${storyDoc.name}"/>\n` +
        '    <meta name="twitter:description" content=""/>\n' +
        '    <meta name="twitter:image:alt" content=""/>\n' +
        '    <meta name="twitter:image"\n' +
        `          content="${thumbnailImage}"/>\n` +
        `    <meta name="twitter:player" content="${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview?step=1"/>\n` +
        '    <meta name="twitter:player:width" content="480"/>\n' +
        '    <meta name="twitter:player:height" content="242"/>\n' +
        '    <meta property="og:locale" content="en_US"/>\n' +
        '    <meta property="og:site_name" content="LiveDemo"/>\n' +
        `    <meta name="title" property="og:title" content="${storyDoc.name}"/>\n` +
        '    <meta name="description" property="og:description" content=""/>\n' +
        '    <meta name="image" property="og:image"\n' +
        `          content="${thumbnailImage}"/>\n` +
        `    <meta property="og:url" content="${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview?step=1"/>\n` +
        '    <meta property="og:image:width" content="480"/>\n' +
        '    <meta property="og:image:height" content="242"/>\n' +
        '    <meta property="og:type" content="article"/>\n' +
        `    <meta property="article:modified_time" content="${storyDoc.updatedAt.toISOString()}"/>\n`

      // htmlString += '<link href="https://fonts.cdnfonts.com/css/gagalin" rel="stylesheet">'

      // htmlString += '<script src="https://cdn.lr-in-prod.com/LogRocket.min.js" crossorigin="anonymous"></script>\n' +
      //   '<script>window.LogRocket && window.LogRocket.init(\'dotxvj/livedemo\', {  mergeIframes: true });</script>\n'

      let screenIds = storyDoc.screens.map(screen => screen._id)
      let transitions = storyDoc.screens.reduce((accum, screen) => {

        if (!screen.customTransitions) {

          return accum
        }

        accum[screen._id] = screen.customTransitions
        return accum
      }, {})

      let steps = storyDoc.screens.sort((firstScreen, secondScreen) => firstScreen.index - secondScreen.index).reduce((accum, screen) => {

        let screenSteps = []

        if (screen.steps) {
          screenSteps = screen.steps.map(step => {
            step.screenId = screen._id
            step.type = screen.type
            step.screenWidth = screen.width
            step.screenHeight = screen.height


            return step
          })

        } else if (screen.type === 'Screen_Screenshot') {

          let stepObj = {
            screenId: screen._id,
            type: screen.type,
            imageUrl: screen.imageUrl,
            customTransitions: screen.customTransitions
          }

          screenSteps.push(stepObj)

        } else if (screen.type === 'Screen_Video') {
          screenSteps.push({
            screenId: screen._id,
            type: screen.type,
            asset: screen.asset,
            playbackRate: screen.playbackRate
          })
        } else {

          screenSteps.push({
            screenId: screen._id,
            type: screen.type
          })
        }



        accum = accum.concat(screenSteps)

        return accum
      }, [])

      steps = steps.map((step, index) => {
        step.index = index
        return step
      })

      if (steps.length !== 0) {

        if (stepIndex > steps[steps.length - 1].index) {

          stepIndex = steps[steps.length - 1].index
        } else if (stepIndex < steps[0].index) {

          stepIndex = steps[0].index
        }
      }


      htmlString += '<script>\n' +
        'window.config = {\n' +
        'SCREENS: ' + '[\'' + screenIds.join('\',\'') + '\'],' + '\n' +

        'STEPS: ' + JSON.stringify(steps, null, 2) + '\n,' +
        'TRANSITIONS: ' + JSON.stringify(transitions, null, 2) + '\n,' +
        'workspaceId: "' + storyDoc.workspaceId + '"\n,' +
        'currentStepIndex: ' + stepIndex + '\n,' +
        'storyId: "' + storyDoc._id + '"\n,' +
        'storyDemo: ' + JSON.stringify(storyDoc, null, 2) + '\n,' +
        'hasEnded: ' + 'false' + '\n' +

        '}\n' +

        '</script>\n'

      await new Promise(async (resolve, reject) => {

        if (ENV.ENV === 'dev') {

          htmlString += '\n<script src="http://localhost.mine:8080/injectScript.bundle.js" type="text/javascript"></script>\n'
          resolve()
        } else {

          htmlString += '\n<script src="https://livedemo-cdn.s3.us-east-1.amazonaws.com/static/injectScript.bundle.js" type="text/javascript"></script>\n'
          resolve()

          // await fsp.readFile('./src/injectScript/injectScript.bundle.js', { encoding: 'utf-8' })
          //   .then((injectScriptString) => {
          //
          //
          //     htmlString += `<script>\n ${injectScriptString} \n</script>`
          //     resolve()
          //   })
        }


      })


      htmlString += '    <meta name="viewport" content="width=device-width,initial-scale=1">\n' +
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
        '    <meta charset="utf-8">\n' +
        '    <title>LiveDemo</title>\n' +
        '    <link rel="shortcut icon" href="https://app.livedemo.ai/favicon.ico">\n' +
        '    <link href="https://app.livedemo.ai/npm.antd.22ac6bf460102b138bd1.css" rel="stylesheet">\n' +
        '    <link href="https://app.livedemo.ai/main.5e127e43bab44cb0e073.css" rel="stylesheet">\n'

      htmlString += '</head><body>' +
        '<div id="app" style="height:100%;width:100%"></div>\n' +
        '<div id="app" style="height: 100%; width: 100%"></div>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/runtime.3c60ba32c89b6abee02c.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.antd.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.emotion.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.babel.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-pagination.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-util.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.tippy.js.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.moment.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.lodash.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.core-js.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.popperjs.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.async-validator.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.axios.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-redux.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.fontsource.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-tabs.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.babel-runtime.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.connected-react-router.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-select.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.mini-store.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-menu.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-tooltip.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-trigger.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-transition-group.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-animate.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-slick.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.ant-design.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-align.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-checkbox.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-form.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-switch.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-router-dom.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-router.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-media.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.hot-loader.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.enquire.js.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.html-entities.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-icons.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.webpack.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.prop-types.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-hot-loader.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.scheduler.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.add-dom-event-listener.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.css-animation.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-toastify.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.dom-helpers.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.dom-scroll-into-view.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.history.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.querystring-es3.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-dialog.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.redux-immutable-state-invariant.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.webpack-hot-middleware.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.create-react-class.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.css-loader.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-is.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.slate.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.style-loader.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.symbol-observable.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.tippyjs.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.ansi-html.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.ansi-regex.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.classnames.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.component-classes.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.component-indexof.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.decode-uri-component.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.dom-align.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.fast-levenshtein.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.goober.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.gud.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.hoist-non-react-statics.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.immer.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.invariant.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.is-buffer.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.isarray.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.jquery.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.json-stringify-safe.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.json2mq.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.lodash.debounce.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.memoize-one.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.mini-create-react-context.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.mutationobserver-shim.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.object-assign.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.omit.js.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.path-to-regexp.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.performance-now.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.process.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.query-string.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.raf.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.rc-calendar.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-device-detect.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-hot-toast.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-lifecycles-compat.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.react-recaptcha.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.redux-thunk.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.redux.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.resize-observer-polyfill.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.resolve-pathname.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.secure-ls.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.shallowequal.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.split-on-first.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.strict-uri-encode.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.string-convert.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.strip-ansi.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.styled-components.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.stylis-rule-sheet.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.stylis.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.tiny-invariant.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.tiny-warning.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.tinycolor2.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.toastr.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.ua-parser-js.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.value-equal.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/npm.warning.bundle.js"></script>\n' +
        '<script type="text/javascript" src="http://localhost.mine:5000/main.bundle.js"></script>' +
        '\n</body></html>'

        // '<script type="text/javascript" src="https://app.livedemo.ai/runtime.41538a0d3756d852bef8.js"></script>\n' +
        // '<script type="text/javascript" src="https://app.livedemo.ai/npm.antd.bundle.js"></script>\n' +
        // '<script type="text/javascript" src="https://app.livedemo.ai/npm.emotion.bundle.js"></script>\n' +
        // '<script type="text/javascript" src="https://app.livedemo.ai/main.bundle.js"></script>\n</body></html>'

      return htmlString
    })
    .then((htmlString) => {

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
      res.send(htmlString)
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
