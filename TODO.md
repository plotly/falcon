- get http / https to work
     - new endpoints to replace IPC?
- get logger back in server
- figure out new endpoints for e.g. folders in S3 (GET /s3-folders)
- add support for previewing and configuring S3 and apache drill
- deploy headlessly on aws
- integration test in workspace using the hosted headless version on aws

- API keys - save them? provide a UI?
- check that restifys error message and object format codes (e.g. what
  happens when there is an uncaught exception) are the same
  as ours

little things
- remove hardcoded port 9000 in frontend
    - i think: remove mainWindow.loadURL and replace with a restify serve
    - replace `http://localhost:9000/${path}` with just `/${path}` in the
      front-end.
- update e2e tests
    - test that server is running (keep majority of api tests in routes.spec.js)
    - test headless mode
- update `updateGrid` in QueryScheduler to remove query if the response was a 404

***

- Alert users who are deleting a tab that contains a credential ID with a
  persistent query
- Tell people about the logs in the UI
