# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm install
COPY ./tsconfig.json ./
COPY ./src ./src
RUN npm run build

# production stage
FROM node:lts-alpine as production-stage
COPY --from=build-stage /app/out .
COPY --from=build-stage /app/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "out/main.js"]
