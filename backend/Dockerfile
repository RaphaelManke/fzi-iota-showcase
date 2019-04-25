# build stage
FROM node:lts-alpine as build-stage
# install additional build dependecies
RUN apk add --no-cache --virtual .gyp \
    python \
    make \
    git \
    g++ 

WORKDIR /app

COPY package*.json .npmrc ./tsconfig.json ./
COPY ./src ./src

RUN npm install && \
    npm run build


# production stage
FROM node:lts-alpine as production-stage
COPY --from=build-stage /app/out ./out
COPY --from=build-stage /app/node_modules ./node_modules
COPY ./config/ ./out/config/
EXPOSE 3000
CMD ["node", "out/main.js"]
