# Adapted from https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:6.6

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app
RUN npm install

COPY . /usr/src/app
RUN npm run heroku-postbuild


ENV PORT 9494
EXPOSE 9494
CMD [ "node", "/usr/src/app/dist/headless-bundle.js"]
