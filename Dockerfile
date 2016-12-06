# Usage:
# $ PLOTLY_API_DOMAIN="api-local.plot.ly" PLOTLY_STREAMBED_SSL_ENABLED="true" docker build -t chriddyp/database-connector .
# $ docker run -p 9494:9494 -e PLOTLY_CONNECTOR_PLOTLY_API_DOMAIN=$PLOTLY_DOMAIN_API -e PLOTLY_CONNECTOR_PLOTLY_API_SSL_ENABLED=$PLOTLY_STREAMBED_SSL_ENABLED -d chriddyp/database-connector -v ~/.plotly/connector:/plotly-connector
#
# Depends on the following ENV variables:
# - PLOTLY_DOMAIN_API (e.g. api-local.plot.ly)
# - PLOTLY_STREAMBED_SSL_ENABLED (e.g. true)
# Adapted from https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:6.6

# I'd like to install the latest version of npm with something like this:
# RUN npm install --global npm@4.0.3
# But unforunately that fails with
# It doesn't seem like there is a good solution in the community yet
# See: https://github.com/npm/npm/issues/9863

# The App saves folders to the `os.homedir()` directory.
ENV HOME=/home/

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Create a directory that the app can save files to and that the host can access
# To map to the files that are saved on your host, run with:
# $ docker run -v ~/.plotly/connector:/plotly-connector
# TODO - With that command ^^, it's redudant to call `VOLUME /plotly-connector` right?
# Save that directory as an ENV variable for the app to use when saving files
# By default, the app will save these files in the home directory
ENV PLOTLY_CONNECTOR_DATA_FOLDER="/plotly-connector"

# Log to stdout in addition to the file
ENV PLOTLY_CONNECTOR_LOG_TO_STDOUT="true"

# Install app dependencies
COPY package.json /usr/src/app
COPY npm-shrinkwrap.json /usr/src/app
RUN npm install --no-optional

COPY . /usr/src/app
RUN npm run heroku-postbuild

ENV PLOTLY_CONNECTOR_PORT 9494
EXPOSE 9494
CMD [ "node", "/usr/src/app/dist/headless-bundle.js" ]
