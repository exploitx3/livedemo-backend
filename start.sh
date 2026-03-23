#!/bin/bash

npm run config-env
#npm run bundle
node -r @esbuild-kit/cjs-loader ./src/server.js
