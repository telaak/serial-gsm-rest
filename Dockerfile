FROM node:20-bookworm-slim as base

WORKDIR /app
COPY . .
RUN chown -R node:node /app
USER node
RUN npm ci
RUN npx tsc

FROM node:20-bookworm-slim as runner
WORKDIR /app
COPY --from=base ./app/dist ./dist
COPY package*.json ./
ENV NODE_ENV production
RUN chown -R node:node /app
USER node
RUN npm ci

EXPOSE 4000

CMD [ "node", "./dist/index.js" ]