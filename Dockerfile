FROM node:20-alpine as base

WORKDIR /app
COPY . .
RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    linux-headers \
    udev \
    g++ \
    gcompat \
    && npm install serialport --build-from-source \
    && apk del .gyp
RUN chown -R node:node /app
USER node
RUN npm i
RUN npx tsc

FROM node:20-alpine as runner
WORKDIR /app
RUN apk add --no-cache gcompat
COPY --from=base ./app/dist ./dist
COPY package*.json ./
ENV NODE_ENV production
RUN chown -R node:node /app
USER node
RUN npm i

EXPOSE 4000

CMD [ "node", "./dist/index.js" ]