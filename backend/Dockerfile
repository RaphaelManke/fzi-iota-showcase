# build stage
FROM node:lts-alpine as build-stage
# install additional build dependecies
RUN apk add --no-cache --virtual .gyp \
    python \
    make \
    git \
    g++ \
    tzdata

WORKDIR /app

COPY package*.json .npmrc ./tsconfig.json ./
COPY ./src ./src

RUN npm install && \
    npm run build && \
    npm prune --production


# production stage
FROM node:lts-alpine as production-stage
RUN apk add --no-cache curl
COPY --from=build-stage /app/out ./out
COPY --from=build-stage /app/node_modules ./out/node_modules
COPY ./config/ ./out/config/
EXPOSE 3000
WORKDIR /out
CMD ["node", "main.js"]
