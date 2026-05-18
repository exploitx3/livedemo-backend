FROM node:22-slim

ENV CI=true
# Create app directory
WORKDIR /home/app

COPY . ./

COPY ./package*.json ./

#RUN git submodule init
#RUN git submodule update
#RUN cd ./src/modules/react-joyride && npm run build

RUN npm install -g pnpm@10.27.0

RUN pnpm install


ENTRYPOINT ./start.sh
