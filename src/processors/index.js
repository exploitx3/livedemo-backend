import processStoryDemo from './processStoryDemo.js'
import processStoryDemoVideo from './processStoryDemoVideo.js'
import processAutoRecording from './processAutoRecording.js'
import processDemoActivityEvents from './processDemoActivityEvents.js'

const configsArr = [
  // publishLiveDemo
  processStoryDemo,
  processStoryDemoVideo,
  processAutoRecording,
  processDemoActivityEvents
]

export default (sharedConfig) => {
  return {
    allQueueNames: configsArr
      .reduce((accum, config) => {
        accum = accum.concat(config.queueNames)
        return accum
      }, [])
      .filter(function (value, index, self) {

        return self.indexOf(value) === index
      }),
    workerConfig: {
      collection: 'jobs-monq',
      callbacks: configsArr.reduce((accum, config) => {
        config.jobNames.forEach(jobName => {
          accum[jobName] = (params, callback) => {
            return config.handler(sharedConfig, params, callback)
          }
        })

        return accum
      }, {})

    }
  }
}
