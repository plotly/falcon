- Chris - Web version (bundle, new endpoint)
- Sobo - UI:  
    - 'x' should `alert("")`
    - after successfully connecting, credentials should collapse
    - add "edit" button to modify the credentials and a new button to save the modified credentials
- Sobo - Add the SSL scripts back to the desktop app
- Sobo - Fix up tables UI in APP and add back the step 3 and step 4 screenshots
- HTTPS - Add a setting with the path to the CERT files
- Move all ~/.plotly/connector/.json files to .yaml files
- Can we deploy this with on-prem? Chris will check in with Jody
    - Do we get SSL for free with this?
- UI and endpoints for adding API keys
- Apache Drill, S3 into workspace 2
- Deploy on heroku and start running against prod

***


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
- Need to update shareplot and workspace dates to be "date modified" instead of
  date created.
