    import fsp from 'fs/promises'
import ENV from '../envServer.js'
import StoryStatuses from '../constants/StoryStatuses.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import ContentStatuses from '../constants/ContentStatuses.js'
import pkg from 'mongodb'
const {ObjectId} = pkg
import flixHelpers from '../helpers/flixHelpers.js'
import stream from 'stream'
import short from 'short-uuid'
import {sendEmail} from '../helpers/emails/emailsSender.js'
import Templates from '../helpers/emails/templates/index.js'

import puppeteer from 'puppeteer'
import {PuppeteerScreenRecorder} from 'puppeteer-screen-recorder'
var args = [];
args.push('--no-sandbox');
args.push('--disable-setuid-sandbox');

import ffmpegPath from 'ffmpeg-static'
import childProcess from 'child_process'

// Use /usr/bin/ffmpeg if available, otherwise fall back to ffmpeg-static default
let getFfmpegPath = async () => {
    const systemFfmpegPath = '/usr/bin/ffmpeg'
    try {
        await fsp.access(systemFfmpegPath)
        return systemFfmpegPath
    } catch {
        return ffmpegPath
    }
}

async function mp4ToGif(videoName) {
    let tempFileInputLocation = `${ENV.TMP_FOLDER}/${videoName}.mp4`
    let tempFileOutputLocation = `${ENV.TMP_FOLDER}/${videoName}.gif`

    const resolvedFfmpegPath = await getFfmpegPath()

    return new Promise((resolve, reject) => {
        const child = childProcess.spawn(
            resolvedFfmpegPath,
            [
                '-y',
                '-i',
                `${tempFileInputLocation}`,
                // copy over the input streams of the input file to the output file
                '-loop',
                '0',
                '-filter_complex',
                'fps=fps=10,scale=860:-1:flags=lanczos',
                `${tempFileOutputLocation}`,
            ],
        );

        child.on('error', () => {
            // catches execution error (bad file)
            let errorMessage = `Error executing binary: ${resolvedFfmpegPath}`
            let newError = new Error(errorMessage)
            console.log(errorMessage);
            reject(newError)
        });

        child.stdout.on('data', (data) => {
            // console.log(data.toString());
        });

        child.stderr.on('data', (data) => {
            // console.log(data.toString());
        });

        child.on('close', (code) => {
            console.log(`Process exited with code: ${code}`);
            if (code === 0) {
                console.log(`FFmpeg finished successfully`);
                resolve(tempFileOutputLocation)
            } else {
                let errorMessage = `FFmpeg encountered an error, check the console output`
                let newError = new Error(errorMessage)
                console.log(errorMessage);
                throw newError
            }
        })
    })

}

async function enhanceVideoQuality(videoName) {
    const inputVideo = `${ENV.TMP_FOLDER}/${videoName}.mp4`
    const outputVideo = `${ENV.TMP_FOLDER}/${videoName}_hq.mp4`

    const resolvedFfmpegPath = await getFfmpegPath()

    return new Promise((resolve, reject) => {
        const child = childProcess.spawn(
            resolvedFfmpegPath,
            [
                '-y',
                '-i', inputVideo,
                '-c:v', 'libx264',
                '-crf', '18',           // 0=lossless, 23=default, 18=visually near-lossless
                '-preset', 'slow',      // slower preset = better compression at same quality
                '-pix_fmt', 'yuv420p',  // max browser/player compatibility
                '-movflags', '+faststart', // streaming-friendly
                '-vf', 'fps=60',        // ensure consistent framerate
                outputVideo,
            ]
        )

        child.on('error', (err) => {
            reject(new Error(`ffmpeg spawn error: ${err.message}`))
        })

        child.stderr.on('data', (data) => {
            console.log(`[enhanceQuality] ${data.toString()}`)
        })

        child.on('close', async (code) => {
            if (code === 0) {
                await fsp.rename(outputVideo, inputVideo)
                console.log(`Quality enhanced for ${videoName}.mp4`)
                resolve(inputVideo)
            } else {
                reject(new Error(`ffmpeg quality enhance failed with code ${code}`))
            }
        })
    })
}

async function mixBackgroundAudio(videoName, audioUrl) {
    const inputVideo = `${ENV.TMP_FOLDER}/${videoName}.mp4`
    const outputVideo = `${ENV.TMP_FOLDER}/${videoName}_audio.mp4`

    const resolvedFfmpegPath = await getFfmpegPath()

    return new Promise((resolve, reject) => {
        const child = childProcess.spawn(
            resolvedFfmpegPath,
            [
                '-y',
                '-i', inputVideo,
                '-stream_loop', '-1',
                '-i', audioUrl,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-shortest',
                '-map', '0:v:0',
                '-map', '1:a:0',
                outputVideo,
            ]
        )

        child.on('error', (err) => {
            reject(new Error(`ffmpeg spawn error: ${err.message}`))
        })

        child.stderr.on('data', (data) => {
            console.log(`[mixAudio] ${data.toString()}`)
        })

        child.on('close', async (code) => {
            if (code === 0) {
                await fsp.rename(outputVideo, inputVideo)
                console.log(`Audio mixed into ${videoName}.mp4`)
                resolve(inputVideo)
            } else {
                reject(new Error(`ffmpeg audio mix failed with code ${code}`))
            }
        })
    })
}

async function recordStoryDemo(videoName, pageWidth, pageHeight, pageUrl) {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        ignoreHTTPSErrors: true,
        args
    })
    const pipeStream = new stream.PassThrough()

    const page = await browser.newPage();
    await page.emulateMediaFeatures([{
        name: 'prefers-reduced-motion',
        value: 'no-preference'
    }])

    await page.setViewport({
        width: pageWidth,
        height: pageHeight,
        deviceScaleFactor: 2
    });

    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 60,
        videoFrame: {
            width: pageWidth,
            height: pageHeight,
        },
    })

    // let tempFileName = `${short.uuid()}.mp4`
    // let tempFileLocation = `${ENV.TMP_FOLDER}/${tempFileName}`
    let tempFileLocation = `${ENV.TMP_FOLDER}/${videoName}.mp4`

    try {

        await page.goto(pageUrl, {
            waitUntil: 'load'
        });

        await recorder.start(tempFileLocation)

        console.log('Processing video for demo - ' + videoName)
        await waitUntilDemoIsOver(page);
        await recorder.stop();

    } catch (e) {
        console.log(e)
    } finally {
        await browser.close();
    }


    return tempFileLocation
}

const waitUntilDemoIsOver = async (page) => {
    let hasEnded = false

    while (hasEnded !== true) {
        await wait(1000);
        hasEnded = await page.evaluate(() => {
            return window.config.hasEnded
        })
    }
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));


async function processStoryDemoVideo(sharedConfig, params, callback) {
    const {Models, axios} = sharedConfig
    const {storyDemoId, userEmail} = params

    let storyDemo = {}
    let videoName = `${storyDemoId}-${short.generate()}`

    return Models.Story.findOne({_id: storyDemoId})
        .lean()
        .then((storyDemoDoc) => {
            let name = storyDemoDoc.name
            let workspaceId = storyDemoDoc.workspaceId

            let tabInfo = storyDemoDoc.tabInfo
            let windowMeasures = storyDemoDoc.windowMeasures

            let storyId = storyDemoDoc._id.toString(16)

            storyDemo = storyDemoDoc

            return recordStoryDemo(
                videoName,
                windowMeasures.innerWidth,
                windowMeasures.innerHeight,
                `${ENV.STORY_API}/workspaces/${workspaceId}/stories/${storyId}/preview?autoplay=true&autoplayDelay=3`
            )
        })
        .then(async (videoLocation) => {
            console.log(videoLocation)

            await enhanceVideoQuality(videoName)

            const bgMusic = storyDemo.custom && storyDemo.custom.backgroundMusic
            if (bgMusic && bgMusic.isActive && bgMusic.backgroundMusicUrl) {
                console.log(`Mixing background audio: ${bgMusic.backgroundMusicUrl}`)
                await mixBackgroundAudio(videoName, bgMusic.backgroundMusicUrl)
            }

            return mp4ToGif(videoName)
                .then((gifLocation) => {
                    console.log(gifLocation)
                })
        })
        .then(() => {
            const videoLocation = `${ENV.TMP_FOLDER}/${videoName}.mp4`

            return fsp.readFile(videoLocation)
                .then((buff) => {
                    return flixHelpers.uploadStoryVideo(videoName, buff)
                })
                .then((videoUploadResult) => {
                    return fsp.rm(videoLocation)
                        .then(() => {
                            return videoUploadResult
                        })
                })

        })
        .then((videoUploadResult) => {
            let gifLocation = `${ENV.TMP_FOLDER}/${videoName}.gif`

            return fsp.readFile(gifLocation)
                .then(buff => {

                    return flixHelpers.uploadStoryGif(videoName, buff)
                })
                .then((gifUploadResult) => {
                    return fsp.rm(gifLocation)
                        .then(() => {
                            return gifUploadResult
                        })
                })
                .then((gifUploadResult) => {
                    return {
                        videoUploadResult: videoUploadResult,
                        gifUploadResult: gifUploadResult
                    }
                })
        })
        .then(({videoUploadResult, gifUploadResult}) => {

            if (storyDemo.content.contentId) {

                return Models.Story.findOneAndUpdate({_id: storyDemoId}, {
                        $set: {
                            videoUrl: `${ENV.LIVEDEMO_CDN_URL}/${videoUploadResult.Key}`,
                            gifUrl: `${ENV.LIVEDEMO_CDN_URL}/${gifUploadResult.Key}`,
                        }
                    },
                    {
                        new: true
                    })
            } else {

                return new Models.StoryContent({
                    videoUrl: `${ENV.LIVEDEMO_CDN_URL}/${videoUploadResult.Key}`,
                    gifUrl: `${ENV.LIVEDEMO_CDN_URL}/${gifUploadResult.Key}`,
                    storyId: storyDemo._id.toString(16),
                    workspaceId: storyDemo.workspaceId
                })
                    .save()
            }
        })
        .then((storyContentDoc) => {
            return Models.Story.findOneAndUpdate({_id: storyDemoId}, {
                $set: {
                    content: {
                        contentId: storyContentDoc._id,
                        contentStatus: ContentStatuses.READY
                    }
                }
            })
                .then(() => {
                    return storyContentDoc
                })
        })
        .then((storyContentDoc) => {

            return sendEmail(Templates.storyDemoContentCreated,{
                demoName: storyDemo.name,
                videoUrl: storyContentDoc.videoUrl,
                gifUrl: storyContentDoc.gifUrl
            },
                [userEmail],
                Models
            )
        })
        .then((storyContentDoc) => {
            console.log('processStoryDemoVideo completed - end')
            console.log(storyContentDoc)

            callback(null, {
                storyDemoId: storyDemoId,
                storyContentId: storyContentDoc._id
            })
        })
        .catch(err => {
            console.log('processStoryDemoVideo failed - end')
            console.log(err)

            callback(err)
        })


}


const config = {
    queueNames: ['storyDemos'],
    jobNames: ['processStoryDemoVideo'],
    handler: processStoryDemoVideo
}

export default config
