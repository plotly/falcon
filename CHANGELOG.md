# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased

## [2.0.0] - 2017-05-18

### Changed
- The SQL connector app runs on HTTPS by default. While the application is still
  running as a server on localhost, a TLS certificate issuing server
  ([open source and built and maintained by plotly](https://github.com/plotly/le-bot))
  creates a unique DNS entry that points to `localhost:9495` and creates a unique
  TLS certificate. This happens when the user first starts the app and the
  certificate and the domain entry is saved to the user's plotly connector directory
  in `~/.plotly/connector`.
  These certificates should renew every 60-90 days automatically, generating
  a new unique URL each time.
- The user goes through an Oauth flow when starting the application.
  This flow saves an oauth token to the user's `~/.plotly/connector` directory
  and is used when scheduling updates to grids.

## [1.0.2] - 2016-12-09

### Changed
Removed mixpanel from the app completely

### Added
Express to dev dependencies

## [1.0.1] - 2016-12-08

### Changed
Changed Node version to 6.9.2 and NPM version to 3.10.9 across
Docker, Heroku, and Dev environments. https://github.com/plotly/plotly-database-connector/pull/117

## [1.0.0] - 2016-12-08
1.0.0 is here! 🎉


### Changed
- A new RESTFUL API

### Added
Lots of great new features:
- Support for scheduling and saving queries
- Support for S3, Elasticsearch, Apache Drill in addition to Postgres, Redshift, MySQL, MSSQL, Mariadb, SQLite
- Support for loading and saving connections on disk
- A command-line version of the app
- A web-app version of the app
- Over 100 tests


## [0.0.8] - 2016-9-27

### Added
- Multiple Sessions API
- On Prem domain
- GeoJSON objects parsed in the response

## [0.0.7] - 2016-9-20

### Added
- MySQL, MariaDB, PostgreSQL, Redshift, Microsoft SQL, SQLite (Mac only)
