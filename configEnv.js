import fs from 'fs'


import('./src/envClient.js')
    .then(module => module.default)
    .then(envVars => (envVars) => {

        // let ENV = 'prod'
        let ENV = process.env.ENV || 'dev'
        console.log("Environment built for " + ENV)


        // import * as fs from 'fs';

        fs.writeFileSync('./src/config.json', JSON.stringify(ENV_VARS))
        fs.writeFileSync('./src/livedemo-components/components/config.json', JSON.stringify(ENV_VARS))
    })
    .catch(error => {
        console.error('Error loading environment variables:', error)
        process.exit(1)
    })

